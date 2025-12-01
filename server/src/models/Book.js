const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    // Standard ID (we use the library's ID as the _id or a specialized indexed field)
    libraryId: { type: Number, required: true, unique: true, index: true },
    
    title: { type: String, index: true },
    author: { type: String, index: true },
    publisher: String,
    
    // Physical Location (Indexed for fast filtering)
    floor: { type: String, index: true }, // e.g., "III"
    row: { type: Number, index: true },   // e.g., 9
    rack: { type: Number, index: true },  // e.g., 6
    shelfCode: String,                    // Raw code e.g., "IIIF-R9..."
    
    // Classification
    callNumber: String,
    isbn: String,
    category: { type: String, index: true },
    
    // Status Logic
    status: String,        // "Available", "Reference"
    derivedStatus: String, // "Due: 2025-06-13"
    statusColor: String,   // "green", "orange", "red"
    
    // Metadata
    tags: [String],        // ["Computer Science", "New Arrival"]
    year: String,
    pages: String,
    vendor: String,
    
    scrapedAt: Date
});

// Text Index for High-Performance Full-Text Search
bookSchema.index({ title: 'text', author: 'text', isbn: 'text', callNumber: 'text' });

module.exports = mongoose.model('Book', bookSchema);