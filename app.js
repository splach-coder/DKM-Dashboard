const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    activePage: 'dashboard'
  });
});

app.get('/azure', (req, res) => {
  res.render('dashboard', {
    title: 'Azure Tools',
    activePage: 'azure'
  });
});

app.get('/ai-chatbots', (req, res) => {
  res.render('dashboard', {
    title: 'AI Chatbots',
    activePage: 'ai-chatbots'
  });
});

app.get('/container-checker', (req, res) => {
  res.render('dashboard', {
    title: 'Container Checker',
    activePage: 'container-checker'
  });
});

app.get('/military-addresses', (req, res) => {
  res.render('dashboard', {
    title: 'Military Addresses Checker',
    activePage: 'military-addresses'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});