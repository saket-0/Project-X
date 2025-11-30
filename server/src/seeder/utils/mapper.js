/**
 * server/src/seeder/utils/mapper.js
 * Maps CSV columns to the Book model.
 */
const mapCsvToBook = (row) => {
    // Helper: Case-insensitive key lookup (Handle "Title" vs "title")
    const getVal = (key) => {
        if (row[key] !== undefined) return row[key];
        const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? row[foundKey] : '';
    };

    // FIX: Clean the Author field immediately
    let rawAuthor = getVal('Author');
    const cleanAuthor = rawAuthor ? rawAuthor.replace(/^(By:?\s*)/i, '').trim() : 'Unknown Author';

    return {
        title: getVal('Title') || getVal('Book Title') || 'Untitled',
        author: cleanAuthor, // Saved as "SIDDHARTHA K"
        publisher: getVal('Pub') || getVal('Publisher'),
        
        accessionType: getVal('Type') || 'General',
        callNumber: getVal('CallNo'),
        
        // FIX: Map 'location' directly to 'Shelf' as requested
        location: getVal('Shelf') || 'N/A', 
        
        status: getVal('Status') || 'Available',
        description: getVal('Desc') || '',
        isbn: getVal('ISBN') || ''
    };
};

module.exports = { mapCsvToBook };