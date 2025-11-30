const natural = require('natural');
const { cleanAndMergeTags } = require('../../utils/tagEngine'); // Reuse your utility
const config = require('../config');

const tokenizer = new natural.WordTokenizer();

const generateTags = (book, meta) => {
    // 1. Get explicitly defined categories
    const explicitTags = cleanAndMergeTags(meta.categories, meta.subjects);

    // 2. Mining the Description (NLP)
    const text = `${book.rawTitle} ${meta.description || ''}`;
    const words = tokenizer.tokenize(text);
    const wordFreq = {};

    words.forEach(w => {
        const clean = w.toLowerCase();
        if (clean.length > 3 && !config.stopWords.has(clean) && isNaN(clean)) {
            wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
    });

    // Get top 15 keywords
    const smartTags = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

    // Merge everything
    return [...new Set([...explicitTags, ...smartTags])];
};

module.exports = { generateTags };