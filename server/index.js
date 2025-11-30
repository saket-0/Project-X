require('dotenv').config(); // This MUST be the first line
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { searchBooks } = require('./src/controllers/bookController');

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION (Refactored)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ DB Connection Error:', err));

app.get('/api/books', searchBooks);

// PORT (Refactored)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});