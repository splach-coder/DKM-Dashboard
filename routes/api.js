const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requireAuth } = require("../middlewares/auth");
const { fetchUserData, updateRecord } = require("../utils/fetchData");
const { normalizeKeys } = require("../utils/functions");
const pdfParse = require("pdf-parse");
const xlsx = require("xlsx");
const { Readable } = require('stream');
const csvParser = require("csv-parser");
const assistants = require("../data/assistants");
const { validateContainerNumber } = require("../utils/functions");
const { OpenAI } = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set in .env
});

// Set up multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// 📌 Helper function to process files
async function processFile(file) {
  const { originalname, buffer, mimetype } = file;

  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return `📄 PDF File: ${originalname}\nContent:\n${data.text}`;
  } else if (mimetype === "text/csv") {
    return new Promise((resolve, reject) => {
      const results = [];
      Readable.from(buffer.toString())
        .pipe(csvParser())
        .on("data", (row) => results.push(row))
        .on("end", () =>
          resolve(
            `📊 CSV File: ${originalname}\nContent:\n${JSON.stringify(results, null, 2)}`
          )
        )
        .on("error", reject);
    });
  } else if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return `📊 Excel File: ${originalname}\nContent:\n${JSON.stringify(sheetData, null, 2)}`;
  } else if (mimetype.startsWith("image/")) {
    // Convert image to Base64 format for GPT-4o
    const base64Image = buffer.toString("base64");
    return {
      type: "input_image", // Correct OpenAI format for images
      image_url: `data:${mimetype};base64,${base64Image}`
    };
  } else {
    return `⚠️ Unsupported File Type: ${originalname}`;
  }
}

// 📌 Main Chat Route
router.post("/chat", upload.any(), async (req, res) => {
  try {
    let { message, assistantId } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });
    if (!assistantId) return res.status(400).json({ error: "Assistant ID is required" });

    // Find assistant
    const assistant = assistants.find((a) => a.id === assistantId);
    if (!assistant) return res.status(404).json({ error: "Assistant not found" });

    // 📂 Process uploaded files
    let fileContents = [];
    let images = []; // Separate storage for images

    if (req.files && req.files.length > 0) {
      const filePromises = req.files.map(processFile);
      const processedFiles = await Promise.all(filePromises);

      processedFiles.forEach((file) => {
        if (typeof file === "string") {
          fileContents.push(file); // Non-image files are treated as text
        } else {
          images.push(file); // Image files are stored separately
        }
      });
    }

    // Create input for OpenAI (Start with message)
    const inputValue = [
      {
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    ];

    // Attach non-image file content
    if (fileContents.length > 0) {
      inputValue[0].content.push({
        type: "input_text",
        text: `\n\nAttached Files:\n${fileContents.join("\n\n")}`
      });
    }

    // Attach images to OpenAI input
    images.forEach((image) => {
      inputValue[0].content.push(image);
    });

    // 🧠 OpenAI Request with Image Input
    const completion = await openai.responses.create({
      model: "gpt-4o",
      input: inputValue,
      text: {
        format: { type: "text" },
      },
      reasoning: {},
      tools: assistant.tools,
      temperature: 1,
      max_output_tokens: 2048,
      top_p: 1,
      store: true,
    });

    let responseText = "Sorry, there was an issue generating a response.";
    if (completion && completion.output_text) {
      responseText = completion.output_text;
    }

    return res.status(200).json({
      success: true,
      response: responseText,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      success: false,
      error: "Error processing your request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// API route to enhance some chat requests using OpenAI SDK
router.post("/enhance", requireAuth, upload.any(), async (req, res) => {
  try {
    let userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Add additional context to the prompt to guide the AI better
    const enhancedPrompt = `
        You are an expert prompt engineer. Your task is to take any user input and transform it into a highly optimized, detailed, and structured prompt that extracts the most accurate and comprehensive response from an AI. You must:

Clarify vague requests.
Add necessary context or details.
Rephrase for maximum precision.
Structure it logically for better AI comprehension.
Ensure it is direct and well-formed.
🔥 Rules:

If the input is unclear, vague, or nonsense, return it exactly as received without modification.
Your response must ONLY contain the enhanced prompt with NO extra words or explanations.
Do NOT acknowledge the user request—just return the optimized prompt.
💬 User input: "${userMessage}"

🚀 Now return ONLY the optimized version of the prompt. If it is unrecognizable or gibberish, return it as it is!
      `;

    // Create completion with OpenAI using the modified prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // ensure you have the correct model identifier
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that provides accurate and detailed responses.",
        },
        { role: "user", content: enhancedPrompt },
      ],
      temperature: 0.7, // Reduce temperature to make the response more focused and consistent
      max_tokens: 2048,
      top_p: 0.9, // Top-p for better response diversity while keeping accuracy
      n: 1, // Only return one completion
    });

    const response = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      success: false,
      error: "Error processing your request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

var mockDeclarations = [];

// Get all declarations
router.get("/declarations", requireAuth, async (req, res) => {
  // In production, this would fetch from your actual API
  mockDeclarations = await fetchUserData();
  if (mockDeclarations) {
    mockDeclarations = mockDeclarations.map((obj) => normalizeKeys(obj));
  }

  // For development, return mock data
  setTimeout(() => {
    res.json(mockDeclarations);
  }, 300); // Simulate network delay
});

// Get a specific declaration
router.get("/declarations/:id", requireAuth, (req, res) => {
  const declaration = mockDeclarations.find(
    (d) => String(d.ID) === String(req.params.id)
  );
  if (declaration) {
    res.json(declaration);
  } else {
    res.status(404).json({ error: "Declaration not found" });
  }
});

// Get container information
router.get("/containers/:id", requireAuth, (req, res) => {
  const isValid = validateContainerNumber(req.params.id);

  // Mock container data
  const container = {
    id: req.params.id,
    isValid: isValid.isValid,
  };

  res.json(container);
});

// update a declarations
router.post("/declaration", requireAuth, async (req, res) => {
  try {
    const { ID, handler } = req.body;

    if (!ID || !handler) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    response = await updateRecord(ID, handler);
    console.log(response)

    res.status(200).json({ message: "Declaration updated successfully", ID, handler });
  } catch (error) {
    console.error("Error updating declaration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;