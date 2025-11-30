const mongoose = require('mongoose');

const taxonomySchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true, index: true },
  tags: [String], // Associated tags like ["Computer Science", "Coding"]
  frequency: { type: Number, default: 1 }
});

module.exports = mongoose.model('Taxonomy', taxonomySchema);