const natural = require('natural');
// Ensure you have created this file as discussed
const ddcMap = require('../../utils/classificationMap'); 
const config = require('../config');

const tokenizer = new natural.WordTokenizer();

/**
 * Intelligent Tag Generator
 * Sources: 
 * 1. Call Number (DDC) Map -> High Accuracy & Broad Categories
 * 2. Explicit Meta (Google/OpenLib Categories) -> Specific Topics
 * 3. Description NLP -> Contextual Keywords
 */
const generateTags = (book, meta) => {
    const finalTags = new Set();
    
    // --- 1. DDC CALL NUMBER DECODING ---
    // Extract the first 3 digits from call numbers (e.g., "624.1" -> "624")
    const callNumbers = Array.from(book.locations || []);
    
    callNumbers.forEach(loc => {
        // Regex matches any 3-digit sequence at the start or after a separator
        const matches = loc.match(/(?:^|\s|\.)(\d{3})/g); 
        
        if (matches) {
            matches.forEach(m => {
                const code = m.trim().replace('.', '');
                
                // A. Exact Match (e.g., 624 -> Civil Engineering)
                if (ddcMap[code]) {
                    ddcMap[code].forEach(t => finalTags.add(t));
                }

                // B. Broader Match (e.g., 624 -> 620 -> Engineering)
                // This ensures that if '624' isn't mapped, we still get 'Engineering' from '620'
                const broadCode = code.substring(0, 2) + '0';
                if (ddcMap[broadCode]) {
                    ddcMap[broadCode].forEach(t => finalTags.add(t));
                }
                
                // C. Top Level Match (e.g., 624 -> 600 -> Technology)
                const topCode = code[0] + '00';
                if (ddcMap[topCode]) {
                    ddcMap[topCode].forEach(t => finalTags.add(t));
                }
            });
        }
    });

    // --- 2. EXPLICIT METADATA (Google Books / Open Library) ---
    const explicitTags = [
        ...(meta.categories || []),
        ...(meta.subjects || [])
    ];
    explicitTags.forEach(t => finalTags.add(t));

    // --- 3. NLP: MINING THE DESCRIPTION ---
    // CRITICAL FIX: We ONLY analyze the description. We DO NOT include the title here.
    const textToAnalyze = meta.description || ''; 

    // Only run NLP if we have a substantial description
    if (textToAnalyze.length > 50) {
        const words = tokenizer.tokenize(textToAnalyze);
        const wordFreq = {};

        words.forEach(w => {
            const clean = w.toLowerCase();
            // Filter stop words, short words, and numbers
            if (clean.length > 3 && !config.stopWords.has(clean) && isNaN(clean)) {
                wordFreq[clean] = (wordFreq[clean] || 0) + 1;
            }
        });

        // Take top 8 most frequent keywords
        Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .forEach(([word]) => {
                // Capitalize first letter (Title Case)
                finalTags.add(word.charAt(0).toUpperCase() + word.slice(1));
            });
    }

    // --- 4. THE REDUNDANCY FILTER ---
    // Remove any tag that is already a word in the Book Title.
    // Example: If Title is "Advanced Java Programming", remove tags "Java" and "Programming".
    const titleWords = new Set(
        book.rawTitle.toLowerCase().split(/[\s\-_:;,]+/) // Split title into words
    );

    return Array.from(finalTags).filter(tag => {
        const tagLower = tag.toLowerCase();
        
        // Check 1: Is the tag exactly one of the words in the title?
        if (titleWords.has(tagLower)) return false;

        // Check 2: Is the tag contained inside the title as a phrase?
        // (e.g. Title: "Introduction to Civil Engineering", Tag: "Civil Engineering") -> Remove
        if (book.rawTitle.toLowerCase().includes(tagLower)) return false;

        return true; 
    });
};

module.exports = { generateTags };