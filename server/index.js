const express = require('express');
const cors = require('cors');
const { loadLibraryData } = require('./src/models/libraryModel');
const { searchBooks } = require('./src/controllers/bookController');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/books', searchBooks);

// Start server and pre-load data
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Initializing Library System...");
    await loadLibraryData();
});