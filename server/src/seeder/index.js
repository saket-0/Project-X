require('dotenv').config(); // Ensure env vars are loaded
const path = require('path');
const mongoose = require('mongoose');
const { loadJsonl } = require('./loaders/jsonlLoader');
const { normalizeBook } = require('./processors/normalizer');
const { enrichBook } = require('./processors/enricher');
const { tagBook } = require('./processors/tagger');
const { writeBatch } = require('./writers/mongoWriter');

// Config
const INPUT_FILE = path.join(__dirname, '../../library_data/vit_library_master.jsonl');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';
const BATCH_SIZE = 1000;

const runSeeder = async () => {
    console.time("Pipeline Duration");
    console.log(`🚀 Connecting to MongoDB...`);
    
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected. Starting Pipeline...`);

    let batch = [];
    let count = 0;

    try {
        for await (const rawRecord of loadJsonl(INPUT_FILE)) {
            // Process
            let book = normalizeBook(rawRecord);
            book = enrichBook(book);
            book = tagBook(book);
            
            // Add to Batch
            batch.push(book);

            // Write when batch is full
            if (batch.length >= BATCH_SIZE) {
                await writeBatch(batch);
                count += batch.length;
                process.stdout.write(`\r💾 Processed: ${count} books`);
                batch = []; // Clear batch
            }
        }

        // Write remaining
        if (batch.length > 0) {
            await writeBatch(batch);
            count += batch.length;
        }

        console.log(`\n✅ Pipeline Complete. ${count} records synced to MongoDB.`);
        console.timeEnd("Pipeline Duration");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Pipeline Failed:", error);
        process.exit(1);
    }
};

if (require.main === module) {
    runSeeder();
}

module.exports = { runSeeder };