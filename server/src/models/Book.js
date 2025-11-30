const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  subtitle: String,
  authors: [String],
  isbn: { type: String, index: true },
  description: String,
  categories: [String],
  tags: [String], // Rich tags
  publisher: String,
  publishedDate: String,
  pageCount: Number,
  language: String,
  averageRating: Number,
  ratingsCount: Number,
  coverImage: String,
  previewLink: String,
  
  // Inventory Management
  count: { type: Number, default: 1 },
  locations: [String], // Changed from 'location: String' to Array
  
  status: { type: String, default: 'Available' },
  meta: {
    source: String,
    originalId: String,
    importedAt: { type: Date, default: Date.now }
  }
});

// Super Search Index
bookSchema.index({ 
  title: 'text', 
  tags: 'text', 
  description: 'text', 
  authors: 'text' 
}, {
  weights: { title: 10, tags: 8, authors: 5, description: 1 }
});

module.exports = mongoose.model('Book', bookSchema);