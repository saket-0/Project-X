/**
 * server/src/seeder/utils/mapper.js
 * Maps CSV columns to the Book model.
 * UPDATED: Now correctly maps the 'Type' column from your CSV (e.g., "Stack").
 */
const mapCsvToBook = (row) => {
    return {
        // Mappings based on your vit_data_bot2.csv headers
        title: row['Title'] || row['Book Title'],
        author: row['Author'],
        publisher: row['Pub'] || row['Publisher'],
        
        // --- FIX: Map the specific "Type" column ---
        // We map the CSV column 'Type' to our database field 'accessionType'
        accessionType: row['Type'] || row['Accession Type'] || 'General',
        
        callNumber: row['CallNo'] || row['Call No'],
        location: row['Lib'] || row['Location'], // 'Lib' seems to contain Institute Name/Location
        shelf: row['Shelf'], // 'Shelf' contains the specific rack info (e.g. IIF-R3-C4-D)
        
        status: row['Status'] || 'Available',
        description: row['Desc'] || '',
        isbn: row['ISBN'] || '',
        
        // Use the 'Shelf' column as the primary location string for parsing later
        // (Since 'Shelf' has the specific floor/rack data)
        location: row['Shelf'] || row['CallNo']
    };
};

module.exports = { mapCsvToBook };