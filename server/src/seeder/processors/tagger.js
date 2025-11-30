const natural = require('natural');
const ddcMap = require('../../utils/classificationMap');
const config = require('../config');

const tokenizer = new natural.WordTokenizer();

const generateTags = (book, meta) => {
    const finalTags = new Set();

    // --- STRATEGY 1: CALL NUMBER DECODING (The "Secret Sauce") ---
    // We look at the 'locations' set (e.g., "624.014 UAZ", "621.7:744 BHA")
    const callNumbers = Array.from(book.locations || []);
    
    callNumbers.forEach(loc => {
        // Regex to find any 3-digit DDC code (000-999) at start or after separators
        // Matches "624" in "624.014", "744" in "621:744"
        const matches = loc.match(/(\d{3})/g); 
        
        if (matches) {
            matches.forEach(code => {
                // 1. Exact Match (e.g., 624 -> Civil Engineering)
                if (ddcMap[code]) {
                    ddcMap[code].forEach(t => finalTags.add(t));
                }
                
                // 2. Broad Match (e.g., 624 -> 620 -> Engineering)
                //    This ensures if we don't have a specific tag for 624, we try 620
                const broadCode = code.substring(0, 2) + '0';
                if (ddcMap[broadCode]) {
                    ddcMap[broadCode].forEach(t => finalTags.add(t));
                }
                
                // 3. Top Level Match (e.g., 600 -> Technology)
                const topCode = code[0] + '00';
                if (ddcMap[topCode]) {
                    ddcMap[topCode].forEach(t => finalTags.add(t));
                }
            });
        }
    });

    // --- STRATEGY 2: EXPLICIT METADATA (From Google/OpenLib) ---
    const explicitTags = [
        ...(meta.categories || []),
        ...(meta.subjects || [])
    ];
    explicitTags.forEach(t => finalTags.add(t));

    // --- STRATEGY 3: NLP & TEXT MINING (Fallback) ---
    // Only run intensive NLP if we have < 5 tags or if description exists
    const text = `${book.rawTitle} ${meta.description || ''}`;
    const words = tokenizer.tokenize(text);
    const wordFreq = {};

    words.forEach(w => {
        const clean = w.toLowerCase();
        // Filter out short words, numbers, and stop words
        if (clean.length > 3 && !config.stopWords.has(clean) && isNaN(clean)) {
            wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
    });

    // Sort by frequency and take top 10 keywords
    Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([word]) => {
            // Capitalize first letter for consistency
            finalTags.add(word.charAt(0).toUpperCase() + word.slice(1));
        });

    return Array.from(finalTags);
};

module.exports = { generateTags };