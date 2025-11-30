const fs = require('fs');
const csv = require('csv-parser');

/**
 * Loads a single CSV file into an array of row objects.
 * @param {string} filePath - Path to the .csv file
 * @returns {Promise<Array>}
 */
const loadCsv = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        fs.createReadStream(filePath)
            // FIX: Trim headers and values to prevent mismatches
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim(),
                mapValues: ({ value }) => value ? value.trim() : ''
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

module.exports = { loadCsv };