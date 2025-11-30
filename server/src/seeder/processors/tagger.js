const natural = require('natural');
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
    // FIX: We now look at 'callNumber' first, then fallback to 'locations'
    const potentialSources = [
        book.callNumber,     // Primary Source: "624.1 S34"
        ...(book.locations || []) // Fallback: Sometimes CallNo is put in Shelf col by mistake
    ].filter(Boolean);

    // Regex to find the DDC Code (e.g. 624 from "624.1")
    // Matches 3 digits at start of string or after a space/bracket
    const ddcRegex = /(?:^|\s|\[)(\d{3})(?:\.|\s|$)/;

    potentialSources.forEach(source => {
        const match = source.match(ddcRegex);
        
        if (match) {
            const code = match[1]; // e.g., "624"
            
            // Helper to safely add tags
            const addTags = (lookupCode) => {
                if (ddcMap[lookupCode]) {
                    ddcMap[lookupCode].forEach(t => finalTags.add(t));
                }
            };

            // A. Exact Match (e.g., 624 -> Civil Engineering)
            addTags(code);

            // B. Broader Match (e.g., 624 -> 620 -> Engineering)
            // Replaces last digit with 0
            const broadCode = code.substring(0, 2) + '0';
            addTags(broadCode);
            
            // C. Top Level Match (e.g., 624 -> 600 -> Technology)
            // Replaces last two digits with 00
            const topCode = code[0] + '00';
            addTags(topCode);
        }
    });

    // --- 2. EXPLICIT METADATA (Google Books / Open Library) ---
    const explicitTags = [
        ...(meta.categories || []),
        ...(meta.subjects || [])
    ];
    explicitTags.forEach(t => finalTags.add(t));

    // --- 3. NLP: MINING THE DESCRIPTION ---
    // We analyze the description to find frequent keywords
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

        // Take top 6 most frequent keywords
        Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .forEach(([word]) => {
                // Capitalize first letter (Title Case)
                finalTags.add(word.charAt(0).toUpperCase() + word.slice(1));
            });
    }

    // --- 4. THE REDUNDANCY FILTER ---
    // Remove any tag that is already a word in the Book Title.
    const titleWords = new Set(
        book.rawTitle.toLowerCase().split(/[\s\-_:;,]+/) 
    );

    return Array.from(finalTags).filter(tag => {
        const tagLower = tag.toLowerCase();
        
        // Check 1: Is the tag exactly one of the words in the title?
        if (titleWords.has(tagLower)) return false;

        // Check 2: Is the tag contained inside the title as a phrase?
        if (book.rawTitle.toLowerCase().includes(tagLower)) return false;

        return true; 
    });
};

module.exports = { generateTags };