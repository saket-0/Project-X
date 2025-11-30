/**
 * server/src/models/Book.js
 */
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    author: { type: String, index: true },
    publisher: String,
    
    // This field will store the "Stack" or "Reference" value from your "Type" column
    accessionType: { type: String, default: 'General' }, 
    
    callNumber: String,
    isbn: String,
    location: String, // Stores the raw Shelf string
    status: { type: String, default: 'Available' },
    tags: [String],
    coverImage: String,
    description: String,
    
    createdAt: { type: Date, default: Date.now }
});

bookSchema.index({ title: 'text', author: 'text', tags: 'text' });

module.exports = mongoose.model('Book', bookSchema);