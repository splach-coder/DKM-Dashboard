const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const assistants = require('../data/assistants');

// Active assistant
const activeAssistant = 'EU Trade & Customs';

router.get("/", requireAuth, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    activePage: "dashboard",
    user: req.user
  });
});

router.get("/azure", requireAuth, (req, res) => {
  res.render("dashboard", {
    title: "Azure Tools",
    activePage: "azure",
    user: req.user
  });
});

router.get("/ai-chatbots", requireAuth, (req, res) => {
  res.render("chatbots", {
    title: "AI Chatbots",
    activePage: "ai-chatbots",
    user: req.user,
    assistants,
    activeAssistant 
  });
});

router.get("/container-checker", requireAuth, (req, res) => {
  res.render("container-checker", {
    title: "Container Checker",
    activePage: "container-checker",
    user: req.user
  });
});

router.get("/military-addresses", requireAuth, (req, res) => {
  res.render("dashboard", {
    title: "Military Addresses Checker",
    activePage: "military-addresses",
    user: req.user
  });
});


module.exports = router;
