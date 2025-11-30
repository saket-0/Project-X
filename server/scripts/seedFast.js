// server/scripts/seedFast.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pLimit = require('p-limit'); // KEY for speed + safety

// Import your models and modules
const Book = require('../src/models/Book');
const { getEnrichedData } = require('../src/services/metadataFetcher');
const { cleanAndMergeTags } = require('../src/utils/tagEngine');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';
const DATA_FOLDER = path.join(__dirname, '../library_data');

// --- CONFIGURATION ---
// 20 concurrent requests is safe for public IPs. 
// If you have enterprise internet/proxies, you can bump this to 50.
const CONCURRENCY_LIMIT = 20; 

const isValid = (val) => val && val !== 'N/A' && val !== 'null' && val.trim() !== '';

const seedDatabase = async () => {
    const startTime = Date.now();
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const files = fs.readdirSync(DATA_FOLDER).filter(f => f.endsWith('.csv'));
        
        // The Traffic Cop: Limits how many promises run at once
        const limit = pLimit(CONCURRENCY_LIMIT); 

        for (const file of files) {
            console.log(`\n📂 Processing File: ${file}`);
            const rows = [];
            
            // 1. Read CSV into memory first (fast I/O)
            await new Promise((resolve) => {
                fs.createReadStream(path.join(DATA_FOLDER, file))
                    .pipe(csv())
                    .on('data', (data) => rows.push(data))
                    .on('end', resolve);
            });

            console.log(`   Found ${rows.length} books. Launching concurrent enrichment (Limit: ${CONCURRENCY_LIMIT})...`);

            // 2. Map rows to Promises
            const tasks = rows.map((row, index) => {
                return limit(async () => {
                    if (!row.Title) return;

                    const title = row.Title.trim();
                    // Clean "By:" from author if present
                    const author = row.Author ? row.Author.replace(/^By:\s*/i, '').trim() : '';

                    // --- INTELLIGENT FETCHING ---
                    // Only hit APIs if we need tags or missing critical data like Publisher
                    let apiData = { google: {}, openLib: {} };
                    
                    // We ALWAYS fetch to generate Tags (Smart Search), 
                    // but we conditionally use the other data.
                    try {
                        apiData = await getEnrichedData(title, author);
                    } catch (err) {
                        // If fetch fails, we continue with local data. 
                        // The retry logic handles temporary glitches inside fetcher.
                    }

                    // --- DATA RETENTION & MERGING LOGIC ---
                    
                    // 1. Publisher: Trust CSV first, fallback to Google, then OpenLib
                    let finalPublisher = row.Pub;
                    if (!isValid(finalPublisher)) {
                        finalPublisher = apiData.google.publisher || apiData.openLib.publisher || 'Unknown';
                    }

                    // 2. Description: Trust CSV, fallback to Google
                    let finalDesc = row.Desc;
                    if (!isValid(finalDesc)) {
                        finalDesc = apiData.google.description || '';
                    }

                    // 3. Tags: MERGE EVERYTHING
                    // We combine Title keywords, CSV Subject (Subj), and API results
                    const finalTags = cleanAndMergeTags(
                        [title, author],           // Basic search terms
                        row.Subj,                  // CSV Subject (if present)
                        apiData.google.categories, // Google Categories
                        apiData.openLib.subjects   // OpenLibrary Subjects
                    );

                    // --- DB OPERATION ---
                    const bookDoc = {
                        title: title,
                        author: author,
                        callNumber: row.CallNo,
                        sourceId: row.BiblioID,
                        location: row.Lib,
                        status: row.Status,
                        shelf: row.Shelf,
                        
                        // Smart Fields
                        publisher: finalPublisher,
                        description: finalDesc,
                        tags: finalTags,
                        
                        // Metadata for debugging
                        isEnriched: finalTags.length > 3
                    };

                    // Upsert: Updates if BiblioID exists, Inserts if new
                    await Book.updateOne(
                        { sourceId: row.BiblioID }, 
                        { $set: bookDoc }, 
                        { upsert: true }
                    );

                    // Progress Indicator (simple dot every 50 books)
                    if (index % 50 === 0) process.stdout.write('.');
                });
            });

            // 3. Wait for all concurrent tasks to finish
            await Promise.all(tasks);
            console.log(`\n   ✅ File ${file} completed.`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Database Seeded in ${duration} seconds!`);
        process.exit();

    } catch (err) {
        console.error('❌ Fatal Error:', err);
        process.exit(1);
    }
};

seedDatabase();