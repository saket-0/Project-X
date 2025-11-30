const natural = require('natural');
const ddcMap = require('../../utils/classificationMap'); 
const config = require('../config');
const { cleanAndMergeTags } = require('../../utils/tagEngine'); // Re-use your existing engine

const tokenizer = new natural.WordTokenizer();

/**
 * Intelligent Tag Generator
 * Sources: 
 * 1. Call Number (DDC) Map -> High Accuracy & Broad Categories
 * 2. Explicit Meta (Google/OpenLib Categories) -> Specific Topics
 * 3. Description NLP -> Contextual Keywords
 */
const generateTags = (book, meta) => {
    // We use a raw Set for internal accumulation, then pass to cleanAndMergeTags at the end
    const rawTags = new Set();
    
    // --- 1. DDC CALL NUMBER DECODING (Fixed) ---
    // Problem: Previously looked in 'locations' (Physical Shelves). 
    // Fix: Prioritize 'callNumber' which contains the Dewey Decimal Code.
    const potentialSources = [
        book.callNumber,
        book.callNo,       // Handle casing variations
        book.CallNo,
        ...(book.locations || []) // Fallback only
    ].filter(Boolean); // Remove null/undefined

    // Regex Explanation:
    // (?:^|\s|\[)  -> Start of string, whitespace, or bracket (non-capturing)
    // (\d{3})      -> Capture exactly 3 digits (The DDC Class)
    // (?:\.|\s|$)  -> Followed by dot, space, or end of string (ensure we don't match year '2021')
    const ddcRegex = /(?:^|\s|\[)(\d{3})(?:\.|\s|$)/;

    // Iterate sources until we find valid DDC tags (stop after finding the first valid code to reduce noise)
    let ddcFound = false;
    
    for (const source of potentialSources) {
        if (ddcFound) break; 
        
        const match = source.match(ddcRegex);
        if (match) {
            const code = match[1]; // e.g. "624"
            
            // Helper to add tags from map if they exist
            const addFromMap = (key) => {
                if (ddcMap[key]) {
                    ddcMap[key].forEach(t => rawTags.add(t));
                    return true;
                }
                return false;
            };

            // A. Exact Match (e.g., 624 -> Civil Engineering)
            const exact = addFromMap(code);
            
            // B. Broader Match (e.g., 624 -> 620 -> Engineering)
            const broadCode = code.substring(0, 2) + '0';
            const broad = addFromMap(broadCode);
            
            // C. Top Level Match (e.g., 624 -> 600 -> Technology)
            const topCode = code[0] + '00';
            const top = addFromMap(topCode);

            if (exact || broad || top) ddcFound = true;
        }
    }

    // --- 2. EXPLICIT METADATA ---
    if (meta.categories) meta.categories.forEach(t => rawTags.add(t));
    if (meta.subjects) meta.subjects.forEach(t => rawTags.add(t));

    // --- 3. NLP: MINING THE DESCRIPTION ---
    const textToAnalyze = meta.description || ''; 

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

        // Take top 6 keywords (reduced from 8 to avoid clutter)
        Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .forEach(([word]) => rawTags.add(word));
    }

    // --- 4. CLEANING & REDUNDANCY FILTER ---
    // Use the robust tagEngine to normalize and remove stop words
    const cleanedTags = cleanAndMergeTags(Array.from(rawTags));

    // Filter against Title Words
    const titleWords = new Set(
        book.rawTitle.toLowerCase().split(/[\s\-_:;,]+/)
    );

    return cleanedTags.filter(tag => {
        // Tag validation logic
        const tagLower = tag.toLowerCase();
        
        // 1. Exact title word match
        if (titleWords.has(tagLower)) return false;
        
        // 2. Phrase match inside title (e.g. Title: "History of Art", Tag: "History")
        if (book.rawTitle.toLowerCase().includes(tagLower)) return false;

        return true; 
    });
};

module.exports = { generateTags };