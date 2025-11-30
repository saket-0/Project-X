const mongoose = require('mongoose');
const pLimit = require('p-limit'); // Ensure this is installed
const config = require('./config');
const { loadAllCsvs } = require('./loaders/csvLoader');
const { normalizeData } = require('./processors/normalizer');
const { enrichBook } = require('./processors/enricher');
const { generateTags } = require('./processors/tagger');
const { mapToStandardBook } = require('./utils/mapper');
const Book = require('../models/Book');

const startEngine = async () => {
    console.log("🚀 Starting Turbo Seeder Engine...");

    // 1. DIAGNOSTICS: Check API Key
    if (config.googleApiKey) {
        console.log(`✅ Google API Key Detected. (Target: Google -> OpenLib -> Local)`);
    } else {
        console.log(`⚠️  NO Google API Key found! Defaulting to OpenLibrary. (Expect 'O' output)`);
    }

    try {
        await mongoose.connect(config.mongoUri);
        console.log("✅ DB Connected.");

        // 2. LOAD & NORMALIZE
        const rawRows = await loadAllCsvs(config.dataFolder);
        const allNormalizedBooks = normalizeData(rawRows);

        console.log(`\n🔍 Checking Database for existing records...`);
        
        // 3. RESUME LOGIC (The "Memory")
        // Get a Set of all existing Title+Author keys from DB
        const existingBooks = await Book.find({}, 'title author').lean();
        const existingSet = new Set(existingBooks.map(b => 
            (b.title + b.author).toLowerCase().replace(/[^\w]/g, '')
        ));

        // 4. FILTER
        const pendingBooks = allNormalizedBooks.filter(book => {
            const key = (book.rawTitle + book.rawAuthor).toLowerCase().replace(/[^\w]/g, '');
            return !existingSet.has(key);
        });

        console.log(`📊 Analysis:
          - Total in CSVs: ${allNormalizedBooks.length}
          - Already in DB: ${existingSet.size}
          - New to Seed:   ${pendingBooks.length}
        `);

        if (pendingBooks.length === 0) {
            console.log("🎉 Nothing new to seed. System up to date!");
            process.exit(0);
        }

        // 5. CONCURRENT BATCH PROCESSING
        // Strategy: We process a batch of 50 books in PARALLEL.
        // Once the whole batch is done, we save it. 
        // This gives you Speed (Concurrency) + Safety (Batch Saves).
        
        const BATCH_SIZE = 50;  // Save to DB every 50 books
        const CONCURRENCY = 10; // Run 10 network requests at the same time
        const limit = pLimit(CONCURRENCY);

        for (let i = 0; i < pendingBooks.length; i += BATCH_SIZE) {
            const batch = pendingBooks.slice(i, i + BATCH_SIZE);
            const batchNum = Math.ceil((i + 1) / BATCH_SIZE);
            
            // A. Create Parallel Tasks
            const tasks = batch.map(book => limit(async () => {
                try {
                    // Enrich (Network Call)
                    const enrichedRaw = await enrichBook(book);
                    
                    // Map (Strict Schema)
                    const standardBook = mapToStandardBook(book, enrichedRaw.metaData);

                    // Tag (CPU Bound)
                    standardBook.tags = generateTags(book, enrichedRaw.metaData);

                    // Print Status
                    const source = standardBook.meta.source === 'Google' ? 'G' 
                                 : standardBook.meta.source === 'OpenLib' ? 'O' 
                                 : 'L';
                    process.stdout.write(source);

                    return {
                        updateOne: {
                            filter: { title: standardBook.title, author: standardBook.author },
                            update: { $set: standardBook },
                            upsert: true
                        }
                    };
                } catch (err) {
                    process.stdout.write('X'); // Error marker
                    return null;
                }
            }));

            // B. Wait for Concurrency to Finish (Speed!)
            const results = await Promise.all(tasks);

            // C. Filter Failures & Save
            const validOps = results.filter(op => op !== null);
            
            if (validOps.length > 0) {
                await Book.bulkWrite(validOps);
            }

            // Optional: New line after batch for readability
             console.log(`  [Batch ${batchNum} Saved]`);
        }

        console.log(`\n\n✅ Seeding Complete!`);
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Fatal Error:", err);
        process.exit(1);
    }
};

startEngine();