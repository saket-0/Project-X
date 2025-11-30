require('dotenv').config({ path: '../.env' }); // Load env vars from server root
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const Book = require('../src/models/Book');
const { cleanAndMergeTags } = require('../src/utils/tagEngine'); 

// 1. Connection & Config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY; 
const DATA_FOLDER = path.join(__dirname, '../library_data');

// 2. The Smart Tag Logic (Refactored)
const getSmartTags = async (title, author) => {
    try {
        const query = `${title} ${author || ''}`;
        
        // Securely attach API Key if available
        let url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=1`;
        if (API_KEY) {
            url += `&key=${API_KEY}`;
        }

        const response = await axios.get(url);

        if (response.data.items && response.data.items.length > 0) {
            const info = response.data.items[0].volumeInfo;
            const categories = info.categories || [];
            
            // USE THE TAG ENGINE: Cleans and standardizes categories
            const cleanedTags = cleanAndMergeTags(categories);

            return {
                tags: cleanedTags,
                description: info.description ? info.description.substring(0, 500) + '...' : ''
            };
        }
    } catch (error) {
        // Fail silently - we just won't have smart tags for this book
        // console.log(`  - No internet data for: ${title}`);
    }
    return { tags: [], description: '' };
};

// 3. The Main Process
const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to Local MongoDB');

        // Optional: Clear old data to start fresh
        // await Book.deleteMany({}); 
        // console.log('🗑️  Cleared old data');

        if (!fs.existsSync(DATA_FOLDER)) {
            console.error(`❌ Data folder not found at: ${DATA_FOLDER}`);
            process.exit(1);
        }

        const files = fs.readdirSync(DATA_FOLDER).filter(f => f.endsWith('.csv'));

        for (const file of files) {
            console.log(`\n📂 Processing File: ${file}`);
            const rows = [];
            
            // Read CSV completely first
            await new Promise((resolve) => {
                fs.createReadStream(path.join(DATA_FOLDER, file))
                    .pipe(csv())
                    .on('data', (data) => rows.push(data))
                    .on('end', resolve);
            });

            console.log(`   Found ${rows.length} rows. Enriched insertion starting...`);

            // Insert row by row
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row.Title) continue;

                // Basic cleaning
                const title = row.Title.trim();
                const author = row.Author ? row.Author.replace('By:', '').trim() : '';

                // FETCH SMART DATA
                // We add a tiny delay to prevent rate limits if no API Key is used
                const smartData = await getSmartTags(title, author);
                
                // Save to DB
                await Book.create({
                    title: title,
                    author: author,
                    callNumber: row.CallNo,
                    publisher: row.Pub,
                    sourceId: row.BiblioID,
                    location: row.Lib,
                    status: row.Status,
                    tags: smartData.tags,
                    description: smartData.description
                });

                // Progress log every 10 books
                if (i % 10 === 0) process.stdout.write(`.`); 
            }
        }

        console.log('\n\n🎉 Database Seeding Complete!');
        process.exit();

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

seedDatabase();