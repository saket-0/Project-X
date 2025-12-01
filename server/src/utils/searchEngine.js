const Fuse = require('fuse.js');

/**
 * "PROJECT-X" SMART SEARCH ENGINE (Powered by Fuse.js)
 * Handles fuzzy matching (typos), weighting, and relevance ranking.
 */
const rankBooks = (books, search, fields, isExact) => {
    // 1. If no search term, return empty relevance
    if (!search) return books.map(b => ({ ...b, relevanceScore: 0, matchedWords: [] }));

    // 2. Configure Fuse.js (The "Google-like" Brain)
    const options = {
        includeScore: true,
        includeMatches: true,
        // 0.0 = Perfect Match, 1.0 = Match Anything. 
        // 0.3 is the "Goldilocks" zone for typos like "Practisioner" -> "Practitioner"
        threshold: isExact ? 0.0 : 0.3, 
        
        // Dynamic Keys: We map your frontend "fields" to Fuse keys
        // We give 'title' and 'author' higher weight via boosting
        keys: fields.length > 0 ? fields : [
            { name: 'title', weight: 0.6 },
            { name: 'author', weight: 0.3 },
            { name: 'tags', weight: 0.1 },
            { name: 'publisher', weight: 0.1 },
            { name: 'isbn', weight: 0.1 }
        ],
        ignoreLocation: true, // Search anywhere in the string
        minMatchCharLength: 2,
        useExtendedSearch: false // Set true if you want advanced query syntax like "'exact"
    };

    // 3. Initialize & Search
    const fuse = new Fuse(books, options);
    const results = fuse.search(search);

    // 4. Process Results & Extract Highlights
    return results.map(result => {
        const matchedWords = new Set();

        // Fuse returns match indices (e.g. [4, 9]). We extract the actual substring to highlight.
        if (result.matches) {
            result.matches.forEach(match => {
                match.indices.forEach(([start, end]) => {
                    // Extract the text that ACTUALLY matched (e.g., "Practitioner")
                    // This allows us to highlight the correct word even if the user typed "Practisioner"
                    const substring = match.value.substring(start, end + 1);
                    matchedWords.add(substring);
                });
            });
        }

        return {
            ...result.item,
            // Convert Fuse score (0=Best, 1=Worst) to Relevance (100=Best, 0=Worst)
            relevanceScore: (1 - result.score) * 100,
            matchedWords: Array.from(matchedWords)
        };
    });
};

module.exports = { rankBooks };