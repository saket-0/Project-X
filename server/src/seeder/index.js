/**
 * server/src/seeder/index.js
 * MASTER SCRIPT: Orchestrates the ingest process
 * UPDATED: Automatically scans 'library_data' folder for ALL .csv files and seeds them.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load shared config (points to .env, data folder, etc.)
const config = require('./config'); 

const Book = require('../models/Book');
const { loadCsv } = require('./loaders/csvLoader');
const { mapCsvToBook } = require('./utils/mapper');
const { normalizeBook } = require('./processors/normalizer');
const { generateTags } = require('./processors/tagger');

// CONFIG
// We use the dataFolder defined in your config.js (usually ../../library_data)
const DATA_FOLDER = config.dataFolder; 
const MONGO_URI = config.mongoUri;
const BATCH_SIZE = 100;

const seedDatabase = async () => {
    try {
        // 1. Connect to DB
        await mongoose.connect(MONGO_URI);
        console.log('🌱 Connected to DB. Clearing old data...');
        
        // 2. Clear existing books (Optional: Remove this if you want to append)
        await Book.deleteMany({}); 
        console.log('🧹 Old data cleared.');

        // 3. Find all CSV files in the data folder
        if (!fs.existsSync(DATA_FOLDER)) {
            throw new Error(`Data folder not found: ${DATA_FOLDER}`);
        }

        const files = fs.readdirSync(DATA_FOLDER).filter(file => file.endsWith('.csv'));
        console.log(`📂 Found ${files.length} CSV files in ${DATA_FOLDER}`);

        let totalBooksSeeded = 0;

        // 4. Loop through each CSV file
        for (const file of files) {
            const filePath = path.join(DATA_FOLDER, file);
            console.log(`\n🚀 Processing File: ${file}...`);

            const rawRows = await loadCsv(filePath);
            console.log(`   📊 Found ${rawRows.length} rows.`);

            let batch = [];
            let fileCount = 0;

            for (const row of rawRows) {
                // A. Map
                let bookData = mapCsvToBook(row);
                
                // B. Normalize (Clean strings)
                bookData = normalizeBook(bookData);

                // C. Tagging
                // Note: We generate tags based on the CLEANED data
                const autoTags = generateTags({
                    locations: [bookData.location], 
                    callNumber: bookData.callNumber,
                    rawTitle: bookData.title
                }, { 
                    description: bookData.description,
                    subjects: [] 
                });

                bookData.tags = autoTags;

                // D. Add to Batch
                batch.push(bookData);

                // E. Insert Batch if full
                if (batch.length >= BATCH_SIZE) {
                    await Book.insertMany(batch);
                    fileCount += batch.length;
                    process.stdout.write(`.`); // minimal progress indicator
                    batch = [];
                }
            }

            // F. Insert Remaining in Batch
            if (batch.length > 0) {
                await Book.insertMany(batch);
                fileCount += batch.length;
            }

            console.log(`\n   ✅ Finished ${file}: ${fileCount} books inserted.`);
            totalBooksSeeded += fileCount;
        }

        console.log(`\n🎉 Seeding Complete! Total Books across all files: ${totalBooksSeeded}`);
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDatabase();