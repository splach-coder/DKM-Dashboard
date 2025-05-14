const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requireAuth } = require("../../middlewares/auth");
const { sendReportToAzure, fetchReports } = require("../../utils/uploadsData");

// Set up multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// add a report
router.post("/report", requireAuth, upload.array("files"), async (req, res) => {
  try {
    console.log("📩 Incoming report");

    const form = req.body;
    const files = req.files;

    const result = await sendReportToAzure(form, files);

    res.status(200).json({ message: "✅ Report sent successfully", result });
  } catch (error) {
    console.error("Error sending report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all Company reports
router.get("/reports/:companyname", requireAuth, async (req, res) => {
  try {
    const CompanyName = req.params.companyname;
    console.log("CompanyName", CompanyName);

    if (!CompanyName) {
      return res.status(400).json({ error: "Missing required fields1" });
    }

    const response = await fetchReports(CompanyName);
    res
      .status(200)
      .json({ message: "Company runs fetched successfully", runs: response });
  } catch (error) {
    console.error("Error updating declaration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all Company runs
router.get("/reports/files/:companyname", requireAuth, async (req, res) => {
  try {
    const CompanyName = req.params.companyname;
    console.log("CompanyName", CompanyName);

    if (!CompanyName) {
      return res.status(400).json({ error: "Missing required fields1" });
    }

    const response = await fetchReports(CompanyName);
    res
      .status(200)
      .json({ message: "Company runs fetched successfully", runs: response });
  } catch (error) {
    console.error("Error updating declaration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
