require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { loadLibraryData } = require('./src/models/libraryModel');
const { searchBooks } = require('./src/controllers/bookController');

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect('mongodb://localhost:27017/library_db')
    .then(() => console.log('✅ Connected to Local MongoDB'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// Routes
app.get('/api/books', searchBooks);

const PORT = process.env.PORT || 5001;

// Start server with Error Handling
const startServer = async () => {
    try {
        console.log("Initializing Library System...");
        // Load data BEFORE listening to avoid race conditions
        await loadLibraryData(); 
        
        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        // Handle Port Conflicts
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use!`);
                console.error(`Try running: npx kill-port ${PORT}`);
            } else {
                console.error("❌ Server Error:", e);
            }
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
    }
};

startServer();