require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const Book = require('../src/models/Book');

// 1. Connection Config
// Local DB URL. 'library_db' is the name of the database we will create.
const MONGO_URI = 'mongodb://localhost:27017/library_db';
const DATA_FOLDER = path.join(__dirname, '../library_data');
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// 2. The Smart Tag Logic
const getSmartTags = async (title, author) => {
    try {
        // Query Google Books
        const query = `${title} ${author || ''}`;
        const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=1`;
        const response = await axios.get(url);

        if (response.data.items && response.data.items.length > 0) {
            const info = response.data.items[0].volumeInfo;
            const categories = info.categories || [];
            
            // Extract keywords from description
            let keywords = [];
            if (info.description) {
                const desc = info.description.toLowerCase();
                const concepts = ['javascript', 'python', 'physics', 'mechanics', 'history', 'algorithms', 'web', 'data structure'];
                keywords = concepts.filter(c => desc.includes(c));
            }
            
            return {
                tags: [...new Set([...categories, ...keywords])],
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
                // We add a tiny delay to be polite to the API
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