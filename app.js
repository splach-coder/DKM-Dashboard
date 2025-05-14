const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
dotenv.config();

// Import routes
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const reportesApiRouter = require('./routes/uploads/reports');

// Import middleware
const  mockAuth  = require('./middlewares/mockAuth');
const { authMiddleware } = require('./middlewares/auth');


// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware && Static files
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
if ((process.env.NODE_ENV || '').trim() === 'development') {
    console.log("Using mock authentication middleware");
    app.use(mockAuth);
}

// Apply auth middleware globally
app.use(authMiddleware);

// Routes
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/api', reportesApiRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});