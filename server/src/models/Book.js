const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true }, 
    author: { type: String, index: true },
    callNumber: String,
    publisher: String,
    
    // FIX: Explicitly add 'shelf' to store the exact rack location
    shelf: String,      // e.g. "IIF-R16-C9-F"
    location: String,   // e.g. "Stack" or Library Name
    
    tags: [String],
    description: String,
    
    sourceId: String,
    status: String
});

// Update index to include shelf search if needed
bookSchema.index({ title: 'text', author: 'text', tags: 'text' });

module.exports = mongoose.model('Book', bookSchema);