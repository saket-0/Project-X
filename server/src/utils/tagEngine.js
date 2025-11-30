// src/utils/tagEngine.js

/**
 * Normalizes a string to be a clean tag (lowercase, trimmed)
 */
const normalize = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '');
};

/**
 * Merges arrays of tags, cleans them, removes duplicates and stop words.
 */
const cleanAndMergeTags = (...sources) => {
    const stopWords = ['a', 'the', 'an', 'of', 'in', 'and', 'book', 'textbook', 'general', 'introduction', 'guide', 'na', 'n/a'];
    const uniqueTags = new Set();

    // Flatten all sources (arrays or single strings)
    const allCandidates = sources.flat().filter(Boolean);

    allCandidates.forEach(item => {
        // Split comma-separated tags if they come from CSV (e.g. "Computer Science, Programming")
        const parts = item.split(/,|;/);
        
        parts.forEach(tag => {
            const cleanTag = normalize(tag);
            // Only keep tags longer than 2 chars that aren't stop words
            if (cleanTag.length > 2 && !stopWords.includes(cleanTag)) {
                uniqueTags.add(cleanTag);
            }
        });
    });

    return Array.from(uniqueTags);
};

module.exports = { cleanAndMergeTags };