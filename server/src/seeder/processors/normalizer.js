/**
 * server/src/seeder/processors/normalizer.js
 * FIX: Now explicitly prioritizes the 'Shelf' column and sanitizes bad data.
 */
const normalizeData = (rawRows) => {
    const uniqueBooksMap = new Map();

    rawRows.forEach(row => {
        const title = row.Title ? row.Title.trim() : 'Unknown';
        
        // Clean Author Name
        let author = row.Author || '';
        author = author.replace(/By:|Dr\.|Prof\.|Mr\.|Mrs\./gi, '').trim();

        const key = (title + author).toLowerCase().replace(/[^\w]/g, '');

        if (!uniqueBooksMap.has(key)) {
            uniqueBooksMap.set(key, {
                rawTitle: title,
                rawAuthor: author,
                locations: new Set(),
                originalId: row.BiblioID,
                // We store the CallNo separately for reference, but NOT for location
                callNumber: row.CallNo 
            });
        }
        
        // --- CRITICAL LOCATION FIX ---
        // 1. Target the 'Shelf' column specifically
        // 2. Fallback to 'CallNo' only if Shelf is missing (but CallNo is usually DDC, not Shelf)
        let loc = row.Shelf || '';

        // 3. Strict Filter: Remove "Vellore...", "Stack", or empty/garbage data
        if (loc && 
            !loc.includes('Vellore') && 
            !loc.includes('Technology') && 
            loc.length > 2 // Filter out tiny invalid strings
        ) {
            uniqueBooksMap.get(key).locations.add(loc.trim());
        }
    });

    console.log(`📉 Normalized ${rawRows.length} rows into ${uniqueBooksMap.size} unique titles.`);
    return Array.from(uniqueBooksMap.values());
};

module.exports = { normalizeData };