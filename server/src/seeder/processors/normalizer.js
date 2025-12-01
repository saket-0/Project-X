const { parseShelfLocation } = require('../../utils/shelfParser');

const normalizeBook = (rawRecord) => {
    // 1. Title Cleaning: Remove trailing slashes or colons common in MARC
    let title = rawRecord['245'] || 'Untitled';
    title = title.replace(/\s*[:\/]\s*$/, '').trim();

    // 2. Author Cleaning
    let author = rawRecord['100'] || 'Unknown Author';
    author = author.replace(/,/, '').trim(); // "Doe, John" -> "Doe John" (optional preference)

    // 3. Parse Location (The 952 Field)
    const locationData = parseShelfLocation(rawRecord['952']);

    return {
        id: rawRecord.id, // Keep original ID
        title: title,
        author: author,
        publisher: rawRecord['260'] ? rawRecord['260'].replace(/^: /, '') : 'N/A',
        isbn: rawRecord['020'] || null,
        callNumber: rawRecord['082'] || 'N/A', // Dewey Decimal
        category: rawRecord['650'] || 'Uncategorized', // Subject
        
        // Flattened Location Data for easier indexing
        floor: locationData.floor,
        row: locationData.row,
        rack: locationData.rack,
        shelfCode: locationData.raw,
        locationDisplay: locationData.fullLocation,
        
        status: locationData.isReference ? 'Reference' : 'Available',
        meta: {
            scrapedAt: rawRecord.scraped_at
        }
    };
};

module.exports = { normalizeBook };