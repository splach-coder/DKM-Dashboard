const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { fetchUserData } = require("../utils/fetchData");
const { normalizeKeys } = require('../utils/functions');
const { validateContainerNumber } = require('../utils/functions')
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set in .env
});

// API route to handle chat requests using OpenAI SDK
router.post('/chat', async (req, res) => {
    try {
      const userMessage = req.body.message;
      const assistantId = req.body.assistantId; // Replace with your Assistant ID from OpenAI
  
      // Create a thread
      const thread = await openai.beta.threads.create();
  
      // Send user message to the assistant
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage
      });
  
      // Run the assistant on the thread
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });
  
      // Poll for completion
      let response;
      while (true) {
        const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        if (runStatus.status === "completed") {
          const messages = await openai.beta.threads.messages.list(thread.id);
          response = messages.data[0].content[0].text.value;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
      }
  
      res.json({ response });
    } catch (error) {
      console.error('Error calling OpenAI Assistant API:', error);
      res.status(500).json({ 
        error: 'An error occurred while processing your request.',
        details: error.message
      });
    }
  });

var mockDeclarations = [];

// Get all declarations
router.get('/declarations', requireAuth, async (req, res) => {
    // In production, this would fetch from your actual API
    mockDeclarations = await fetchUserData();
    if (mockDeclarations){
        mockDeclarations = mockDeclarations.map(obj => normalizeKeys(obj));
    }
    
    // For development, return mock data
    setTimeout(() => {
        res.json(mockDeclarations);
    }, 300); // Simulate network delay
});

// Get a specific declaration
router.get('/declarations/:id', requireAuth, (req, res) => {
    const declaration = mockDeclarations.find(d => String(d.ID) === String(req.params.id));
    if (declaration) {
        res.json(declaration);
    } else {
        res.status(404).json({ error: 'Declaration not found' });
    }
});

// Get container information
router.get('/containers/:id', requireAuth, (req, res) => {
    const isValid = validateContainerNumber(req.params.id);

    // Mock container data
    const container = {
        id: req.params.id,
        isValid: isValid.isValid
    };
    
    res.json(container);
});

module.exports = router;
 