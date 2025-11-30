const normalizeData = (rawRows) => {
    const uniqueBooksMap = new Map();

    rawRows.forEach(row => {
        const title = row.Title || 'Unknown';
        const author = row.Author || '';
        // Create a unique key (lowercase, alphanumeric only)
        const key = (title + author).toLowerCase().replace(/[^\w]/g, '');

        if (!uniqueBooksMap.has(key)) {
            uniqueBooksMap.set(key, {
                rawTitle: title,
                rawAuthor: author,
                locations: new Set(),
                originalId: row.BiblioID,
                localPubDate: row.Pub
            });
        }
        
        // Aggregate locations/call numbers
        if (row.CallNo) uniqueBooksMap.get(key).locations.add(row.CallNo);
    });

    console.log(`📉 Normalized ${rawRows.length} rows into ${uniqueBooksMap.size} unique titles.`);
    return Array.from(uniqueBooksMap.values());
};

module.exports = { normalizeData };