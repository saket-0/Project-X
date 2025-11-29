const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Store data in memory (Acts as a temporary database)
let libraryCache = [];

const DATA_FOLDER = path.join(__dirname, '../../library_data'); // Adjusted path based on new structure

const loadLibraryData = () => {
    return new Promise((resolve, reject) => {
        if (libraryCache.length > 0) {
            resolve(libraryCache);
            return;
        }

        const results = [];
        try {
            if (!fs.existsSync(DATA_FOLDER)) {
                console.warn(`Data folder not found at: ${DATA_FOLDER}`);
                return resolve([]);
            }

            const files = fs.readdirSync(DATA_FOLDER).filter(file => file.toLowerCase().endsWith('.csv'));
            console.log(`Loading ${files.length} CSV files into memory...`);

            let filesProcessed = 0;

            if (files.length === 0) resolve([]);

            files.forEach(file => {
                fs.createReadStream(path.join(DATA_FOLDER, file))
                    .pipe(csv())
                    .on('data', (data) => {
                        // Basic sanitization
                        if (data.Title) results.push(data);
                    })
                    .on('end', () => {
                        filesProcessed++;
                        if (filesProcessed === files.length) {
                            libraryCache = results;
                            console.log(`✅ Data loaded: ${libraryCache.length} books ready.`);
                            resolve(libraryCache);
                        }
                    })
                    .on('error', (err) => reject(err));
            });
        } catch (error) {
            reject(error);
        }
    });
};

const getBooks = async () => {
    if (libraryCache.length === 0) await loadLibraryData();
    return libraryCache;
};

module.exports = { loadLibraryData, getBooks };