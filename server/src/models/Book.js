const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  
  // PRIMARY FIELDS (Used by Frontend)
  author: { type: String, index: true },   // Singular (for search/display)
  location: { type: String, index: true }, // Singular (for shelf parsing)
  status: String,
  
  // RICH METADATA (Used by Detail View)
  authors: [String],        // Plural (all authors)
  publisher: String,
  description: String,
  tags: [String],
  coverImage: String,
  
  // INVENTORY DATA
  locations: [String],      // All copies found
  count: { type: Number, default: 1 },
  callNumber: String,
  
  // ENGINE METADATA
  meta: {
    source: String,     // 'Google', 'OpenLib', 'Local'
    originalId: String
  }
}, { timestamps: true });

// Enable text search on key fields
bookSchema.index({ title: 'text', author: 'text', tags: 'text' });

module.exports = mongoose.model('Book', bookSchema);