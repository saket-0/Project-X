const mongoose = require('mongoose');
const pLimit = require('p-limit');
const config = require('./config');
const { loadAllCsvs } = require('./loaders/csvLoader');
const { normalizeData } = require('./processors/normalizer');
const { enrichBook } = require('./processors/enricher');
const { generateTags } = require('./processors/tagger');
const { writeBatch } = require('./writers/mongoWriter');

const startEngine = async () => {
    console.log("🚀 Starting Seeding Engine...");
    
    try {
        await mongoose.connect(config.mongoUri);
        console.log("✅ DB Connected.");

        // 1. EXTRACT
        const rawData = await loadAllCsvs(config.dataFolder);
        
        // 2. TRANSFORM (Normalize)
        const uniqueBooks = normalizeData(rawData);

        // 3. TRANSFORM (Enrich & Tag) + LOAD (Concurrent Batches)
        const limit = pLimit(config.concurrency);
        let processed = 0;
        let batch = [];

        const tasks = uniqueBooks.map(book => limit(async () => {
            // Enrich
            const enriched = await enrichBook(book);
            // Tag
            enriched.tags = generateTags(book, enriched.metaData);
            
            batch.push(enriched);
            processed++;

            // Write Batch
            if (batch.length >= config.batchSize) {
                await writeBatch(batch);
                batch = []; // Clear batch
                process.stdout.write(`\r [${processed}/${uniqueBooks.length}] Books Processed...`);
            }
        }));

        await Promise.all(tasks);

        // Final Batch
        if (batch.length > 0) await writeBatch(batch);

        console.log(`\n\n🎉 Seeding Complete! Processed ${processed} books.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Engine Failure:", err);
        process.exit(1);
    }
};

startEngine();