/**
 * server/src/utils/searchEngine.js
 * "PROJECT-X" SMART ENGINE
 * Features: Phonetic Matching, Stemming, Fuzzy Logic, and Relevance Ranking.
 */

// --- CONFIGURATION ---
const WEIGHTS = {
    EXACT: 100,      // "Python" == "Python"
    STEM_MATCH: 95,  // "Run" matches "Running"
    PHONETIC: 85,    // "Pythen" (sounds like) "Python", "Practisioner" == "Practitioner"
    STARTS_WITH: 70, // "Pyth" matches "Python"
    CONTAINS: 50,    // "on" matches "Python"
    FUZZY: 30        // "Python" (1 char wrong) matches "Python"
};

const FUZZY_TOLERANCE = 2; 

// --- 1. SMART HELPERS ---

// A. Stemming-Lite: Removes common suffixes to find the "root" word
// e.g., "Practitioner's" -> "Practitioner"
const getRootWord = (word) => {
    let w = word.toLowerCase().trim();
    if (w.length < 4) return w; // Don't stem short words
    
    // Step 1: Remove possessives and basic plurals
    w = w.replace(/'s$/, "");     // Practitioner's -> Practitioner
    w = w.replace(/s$/, "");      // Books -> Book
    
    // Step 2: Remove common endings
    if (w.endsWith("ing")) return w.slice(0, -3);
    if (w.endsWith("ed")) return w.slice(0, -2);
    if (w.endsWith("es")) return w.slice(0, -2);
    if (w.endsWith("ly")) return w.slice(0, -2);
    
    return w;
};

// B. Phonetic Signature: Converts word to a "sound code"
// e.g., "Practisioner" -> "PRKTSNR", "Practitioner" -> "PRKTSNR" -> MATCH!
const getPhoneticCode = (word) => {
    let w = word.toLowerCase().trim();
    
    // 1. Common Phonetic Replacements
    w = w.replace(/ph/g, "f");    // Phone -> Fone
    w = w.replace(/gh/g, "f");    // Rough -> Rouf
    w = w.replace(/ci/g, "si");   // Special -> Spesial
    w = w.replace(/ce/g, "se");   // Center -> Senter
    w = w.replace(/sh/g, "x");    // (X represents 'sh' sound)
    w = w.replace(/tion/g, "xn"); // Action -> Axn
    w = w.replace(/sion/g, "xn"); // Version -> Verxn
    w = w.replace(/ck/g, "k");    // Kick -> Kik
    w = w.replace(/c/g, "k");     // Cat -> Kat
    
    // 2. Remove Vowels (except first letter) to focus on consonants
    const first = w.charAt(0);
    const rest = w.slice(1).replace(/[aeiouy]/g, "");
    
    return first + rest;
};

// C. Levenshtein Distance (The standard fuzzy fallback)
const getLevenshteinDistance = (a, b) => {
    if (Math.abs(a.length - b.length) > FUZZY_TOLERANCE) return 100;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
};

// D. Tokenizer: Breaks text into clean array of words
const tokenize = (text) => {
    if (!text) return [];
    // Split by spaces, dots, dashes, etc.
    return text.toString().toLowerCase().split(/[\s\-_:;,.()\[\]"']+/).filter(t => t.length > 0);
};

// --- 2. CORE RANKING ALGORITHM ---

const calculateScore = (book, searchTerm, fields) => {
    let maxScore = 0;
    const matchedTokens = new Set(); 

    // Pre-process the search term
    const searchRaw = searchTerm.toLowerCase().trim();
    const searchRoot = getRootWord(searchRaw);
    const searchPhone = getPhoneticCode(searchRaw);

    // If search term is multiple words (e.g. "Harry Potter"), split it
    const searchTokens = tokenize(searchRaw);

    // Iterate over selected fields (Title, Author, Tags)
    fields.forEach(field => {
        let fieldText = "";
        
        // Combine array fields (tags) or simple string fields
        if (field === 'tags' && Array.isArray(book.tags)) {
            fieldText = book.tags.join(" ");
        } else if (book[field]) {
            fieldText = String(book[field]);
        }

        // Tokenize the field content (e.g. Book Title)
        const bookTokens = tokenize(fieldText);

        // CHECK 1: WHOLE PHRASE MATCH (Highest Priority)
        // If the title contains the exact search phrase "Harry Potter"
        if (fieldText.toLowerCase().includes(searchRaw)) {
            maxScore = Math.max(maxScore, WEIGHTS.CONTAINS + 10);
            // Add all search tokens to matches
            searchTokens.forEach(t => matchedTokens.add(t));
        }

        // CHECK 2: TOKEN-BY-TOKEN INTELLIGENT MATCH
        bookTokens.forEach(token => {
            let tokenScore = 0;
            const tokenRoot = getRootWord(token);
            const tokenPhone = getPhoneticCode(token);

            // A. Exact Match
            if (token === searchRaw) {
                tokenScore = WEIGHTS.EXACT;
                matchedTokens.add(token);
            }
            // B. Stem Match ("Practitioner" == "Practitioner's")
            else if (tokenRoot === searchRoot) {
                tokenScore = WEIGHTS.STEM_MATCH;
                matchedTokens.add(token);
            }
            // C. Phonetic Match ("Practisioner" ~= "Practitioner")
            // Only check if words are roughly same length to avoid false positives
            else if (Math.abs(token.length - searchRaw.length) <= 3 && tokenPhone === searchPhone) {
                tokenScore = WEIGHTS.PHONETIC;
                matchedTokens.add(token); // Highlight the book's word (Practitioner), not the typo
            }
            // D. Starts With
            else if (token.startsWith(searchRaw)) {
                tokenScore = WEIGHTS.STARTS_WITH;
                matchedTokens.add(token);
            }
            // E. Levenshtein Fuzzy (Fallback for random typos like "Pythen")
            else if (Math.abs(token.length - searchRaw.length) <= FUZZY_TOLERANCE) {
                const dist = getLevenshteinDistance(token, searchRaw);
                if (dist <= FUZZY_TOLERANCE) {
                    tokenScore = WEIGHTS.FUZZY;
                    matchedTokens.add(token);
                }
            }

            if (tokenScore > maxScore) maxScore = tokenScore;
        });
    });

    return { score: maxScore, matches: Array.from(matchedTokens) };
};

/**
 * Main Entry Point
 */
const rankBooks = (books, search, fields, isExact) => {
    if (!search) return books.map(b => ({ ...b, relevanceScore: 0, matchedWords: [] }));

    const ranked = books.map(book => {
        const { score, matches } = calculateScore(book, search, fields);
        return {
            ...book,
            relevanceScore: score,
            matchedWords: matches
        };
    });

    // STRICT FILTER: Remove garbage results (Score 0)
    // This ensures only relevant stuff appears.
    const filtered = ranked.filter(b => b.relevanceScore > 0);

    // Sort Descending (Best match first)
    return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

module.exports = { rankBooks };