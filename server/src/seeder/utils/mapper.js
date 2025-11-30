/**
 * server/src/seeder/utils/mapper.js
 * REDESIGNED: Strictly maps 'vit_data_bot2.csv' columns to the Schema
 */
const mapCsvToBook = (row) => {
    // 1. Safe Extraction Helper
    const get = (key) => (row[key] ? row[key].trim() : '');

    // 2. Map Fields
    return {
        // Core Identity
        title: get('Title'),
        
        // processing will happen in normalizer.js
        rawAuthor: get('Author'), 
        
        // Map CSV 'Pub' -> Schema 'publisher'
        publisher: get('Pub'), 
        
        // Location Data
        location: get('Shelf'),
        callNumber: get('CallNo'),
        
        // Status & Meta
        status: get('Status'),
        description: get('Desc'), // Using physical description as placeholder
        
        // Technical
        meta: {
            source: 'LocalLibrary',
            originalId: get('BiblioID'),
            barcode: get('Barcode')
        }
    };
};

module.exports = { mapCsvToBook };