const normalizeData = (rawRows) => {
    const uniqueBooksMap = new Map();

    rawRows.forEach(row => {
        const title = row.Title ? row.Title.trim() : 'Unknown';
        
        // FIX: Clean the author name (Remove 'By:', 'Dr.', etc.)
        let author = row.Author || '';
        author = author.replace(/By:|Dr\.|Prof\.|Mr\.|Mrs\./gi, '').trim();

        // Create a unique key
        const key = (title + author).toLowerCase().replace(/[^\w]/g, '');

        if (!uniqueBooksMap.has(key)) {
            uniqueBooksMap.set(key, {
                rawTitle: title,
                rawAuthor: author, // Now clean!
                locations: new Set(),
                originalId: row.BiblioID,
                localPubDate: row.Pub
            });
        }
        
        if (row.CallNo) uniqueBooksMap.get(key).locations.add(row.CallNo);
    });

    console.log(`📉 Normalized ${rawRows.length} rows into ${uniqueBooksMap.size} unique titles.`);
    return Array.from(uniqueBooksMap.values());
};

module.exports = { normalizeData };