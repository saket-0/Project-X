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

        console.log('\nProcessing Books (Legend: G=Google, O=OpenLib, L=Local)\n' + '-'.repeat(60));

        const tasks = uniqueBooks.map(book => limit(async () => {
            // Step A: Enrich (Fetch Metadata)
            const enriched = await enrichBook(book);
            
            // Step B: Tag (NLP & Keywords)
            enriched.tags = generateTags(book, enriched.metaData);
            
            // Step C: Add to Batch
            batch.push(enriched);
            processed++;

            // VISUAL FEEDBACK: Print source character
            const sourceChar = enriched.source === 'Google' ? 'G' 
                             : enriched.source === 'OpenLib' ? 'O' 
                             : 'L';
            
            process.stdout.write(sourceChar);

            // Step D: Write Batch to DB when full
            if (batch.length >= config.batchSize) {
                await writeBatch(batch);
                batch = []; // Clear batch
                
                // Print progress status on a new line to keep things tidy
                console.log(`  [${processed}/${uniqueBooks.length}]`); 
            }
        }));

        // Wait for all concurrent tasks to finish
        await Promise.all(tasks);

        // Final Batch (Write any remaining books)
        if (batch.length > 0) {
            await writeBatch(batch);
            console.log(`  [${processed}/${uniqueBooks.length}]`); 
        }

        console.log(`\n\n🎉 Seeding Complete! Successfully processed ${processed} books.`);
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Engine Failure:", err);
        process.exit(1);
    }
};

startEngine();