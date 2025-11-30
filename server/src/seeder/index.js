/**
 * server/src/seeder/index.js
 * MASTER SCRIPT: Orchestrates the ingest process
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('../models/Book');
const { loadCsv } = require('./loaders/csvLoader');
const { mapCsvToBook } = require('./utils/mapper');
const { normalizeBook } = require('./processors/normalizer');
const { generateTags } = require('./processors/tagger');
const { enrichBook } = require('./processors/enricher'); // Optional external API

// CONFIG
const CSV_FILE_PATH = './library_data/vit_data_bot2.csv'; 
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';
const BATCH_SIZE = 100;

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🌱 Connected to DB. Clearing old data...');
        
        // Optional: Clear existing books
        await Book.deleteMany({}); 

        console.log(`📂 Loading CSV from ${CSV_FILE_PATH}...`);
        const rawRows = await loadCsv(CSV_FILE_PATH);
        console.log(`📊 Found ${rawRows.length} rows.`);

        let batch = [];
        let count = 0;

        for (const row of rawRows) {
            // 1. Map
            let bookData = mapCsvToBook(row);
            
            // 2. Normalize (Clean strings)
            bookData = normalizeBook(bookData);

            // 3. Tagging (Logic from previous step)
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

            // 4. Add to Batch
            batch.push(bookData);

            if (batch.length >= BATCH_SIZE) {
                await Book.insertMany(batch);
                count += batch.length;
                console.log(`✅ Processed ${count} books...`);
                batch = [];
            }
        }

        // Final Batch
        if (batch.length > 0) {
            await Book.insertMany(batch);
            count += batch.length;
        }

        console.log(`🎉 Seeding Complete! Total Books: ${count}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDatabase();