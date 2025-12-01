/**
 * server/src/utils/searchEngine.js
 * DEDICATED SEARCH ENGINE
 * Handles ranking, fuzzy matching, and relevance scoring.
 */

// --- CONFIGURATION ---
const WEIGHTS = {
    EXACT_MATCH: 100,
    STARTS_WITH: 80,
    WORD_MATCH: 60, // Contains " Python "
    SUBSTRING: 40,  // Contains "pyth"
    FUZZY: 20       // Typo "Pythen"
};

const FUZZY_TOLERANCE = 2; // Max character edits allowed

// --- 1. LEVENSHTEIN DISTANCE (For Typos) ---
const getLevenshteinDistance = (a, b) => {
    if (Math.abs(a.length - b.length) > FUZZY_TOLERANCE) return 100; // Optimization: fast fail

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// --- 2. SCORING ALGORITHM ---
const calculateScore = (book, term, fields) => {
    let maxScore = 0;
    const cleanTerm = term.toLowerCase();

    // Iterate through user-selected fields (Title, Author, etc.)
    fields.forEach(field => {
        let textValues = [];

        // Handle Array fields (like Tags) vs String fields
        if (field === 'tags' && Array.isArray(book.tags)) {
            textValues = book.tags;
        } else if (book[field]) {
            textValues = [String(book[field])];
        }

        // Check each value in this field
        textValues.forEach(rawVal => {
            const val = rawVal.toLowerCase();
            let currentScore = 0;

            if (val === cleanTerm) {
                currentScore = WEIGHTS.EXACT_MATCH;
            } else if (val.startsWith(cleanTerm)) {
                currentScore = WEIGHTS.STARTS_WITH;
            } else if (val.includes(` ${cleanTerm} `)) {
                currentScore = WEIGHTS.WORD_MATCH;
            } else if (val.includes(cleanTerm)) {
                currentScore = WEIGHTS.SUBSTRING;
            } else {
                // Expensive Check: Only run if lengths are close
                if (Math.abs(val.length - cleanTerm.length) <= FUZZY_TOLERANCE) {
                    const dist = getLevenshteinDistance(val, cleanTerm);
                    if (dist <= FUZZY_TOLERANCE) {
                        currentScore = WEIGHTS.FUZZY;
                    }
                }
            }
            
            // Keep the highest score found across all fields/values
            if (currentScore > maxScore) maxScore = currentScore;
        });
    });

    return maxScore;
};

/**
 * Main Entry Point
 * @param {Array} books - Raw DB results
 * @param {String} search - User query
 * @param {Array} fields - ['title', 'author', 'tags']
 * @param {Boolean} isExact - strict mode
 */
const rankBooks = (books, search, fields, isExact) => {
    if (!search) return books.map(b => ({ ...b, relevanceScore: 0 }));

    const ranked = books.map(book => {
        const score = calculateScore(book, search, fields);
        return {
            ...book,
            relevanceScore: score
        };
    });

    // Filter out zero-relevance items if exact match was requested
    const filtered = isExact ? ranked.filter(b => b.relevanceScore >= WEIGHTS.EXACT_MATCH) : ranked;

    // Sort: Higher Score = Better
    return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

module.exports = { rankBooks };