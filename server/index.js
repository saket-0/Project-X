require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { getBooks, getBookById } = require('./src/controllers/bookController');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/books', getBooks);
app.get('/api/books/:id', getBookById);

// Start Server
const startServer = async () => {
    try {
        // Connect to Mongo
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
    }
};

startServer();