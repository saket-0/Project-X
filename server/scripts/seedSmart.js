require('dotenv').config({ path: '../.env' }); // Load env vars from server root
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const natural = require('natural'); // NLP Library for better tagging
const pLimit = require('p-limit');

const Book = require('../src/models/Book');

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 5; // Keep low to avoid rate limits
const BATCH_SIZE = 50;
const DATA_FOLDER = path.join(__dirname, '../library_data');

// SECURITY FIX: Load Key from Environment
const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// Aggressive Stop Words List to remove library catalog noise
const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'it', 'as', 'was', 'with', 'on', 'by', 
  'an', 'be', 'this', 'which', 'or', 'from', 'at', 'but', 'not', 'are', 'have', 'has', 'had', 
  'introduction', 'guide', 'handbook', 'manual', 'edition', 'volume', 'chapter', 'pages', 
  'published', 'textbook', 'principles', 'fundamentals', 'comprehensive', 'study', 'approach',
  'theory', 'practice', 'application', 'modern', 'basic', 'advanced', 'concepts', 'analysis',
  'description', 'available', 'no', 'text', 'book', 'library', 'catalog', 'title', 'author',
  'isbn', 'issn', 'series', 'call', 'number', 'stack', 'location', 'copyright', 'print',
  'publishers', 'private', 'limited', 'dept', 'department', 'press', 'university', 'company',
  'engineering', 'technology', 'science', 'course', 'first', 'second', 'third', 'year', 'syllabus',
  'students', 'reference', 'topics', 'includes', 'contains', 'using', 'based', 'works', 'general',
  'system', 'systems', 'paper', 'papers', 'level'
]);

// Global flag to switch mode if Google dies
let GOOGLE_QUOTA_EXHAUSTED = false;

// --- INITIALIZATION ---
if (!GOOGLE_API_KEY) {
    console.warn("⚠️  WARNING: No GOOGLE_BOOKS_API_KEY found in .env. Script will run in 'OpenLib Only' mode (slower/less accurate).");
    GOOGLE_QUOTA_EXHAUSTED = true; 
}

// Fix Mongo Connection to use env var
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error("❌ DB Error:", err));

const tokenizer = new natural.WordTokenizer();
const limit = pLimit(CONCURRENCY_LIMIT);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTELLIGENT TAGGING ENGINE ---
function generateRichTags(bookInfo) {
    const tags = new Set();
    const { title, subtitle, description, categories, publisher, authors, subjects } = bookInfo;

    // 1. Explicit Categories (Google) or Subjects (OpenLibrary)
    const cats = [...(categories || []), ...(subjects || [])];
    cats.forEach(cat => {
        cat.toString().split(/[\/|]/).forEach(s => {
            const clean = s.trim();
            if (clean.length > 2 && !STOP_WORDS.has(clean.toLowerCase())) {
                tags.add(clean);
            }
        });
    });

    // 2. Metadata Tags
    if (publisher) {
        const cleanPub = publisher.replace(/ Pvt Ltd| Ltd| Inc| Pub| Co|Press|Publishers|Publications/gi, "").trim();
        if (cleanPub.length > 2) tags.add(cleanPub);
    }
    if (authors) authors.forEach(a => tags.add(a));

    // 3. Content Mining (NLP)
    let textToScan = `${title} ${subtitle || ''}`;
    if (description && !description.toLowerCase().includes('no description available')) {
        textToScan += ` ${description}`;
    }

    const words = tokenizer.tokenize(textToScan);
    const wordFreq = {};

    words.forEach(word => {
        const w = word.toLowerCase();
        if (w.length > 2 && !STOP_WORDS.has(w) && isNaN(w)) {
            wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
    });

    // 4. Extract Top Keywords
    Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 40) 
        .forEach(([word]) => {
            tags.add(word.charAt(0).toUpperCase() + word.slice(1));
        });
    
    return Array.from(tags);
}

// --- GOOGLE BOOKS FETCHER ---
async function fetchGoogleMetadata(title, author, retries = 1) {
    if (GOOGLE_QUOTA_EXHAUSTED) return null;

    const safeTitle = title.replace(/[^\w\s]/gi, ' ').trim();
    const safeAuthor = author ? author.replace(/[^\w\s]/gi, ' ').replace(/By/i, '').trim() : '';
    const lastName = safeAuthor.split(/\s+/).pop();

    const queries = [
        `intitle:${encodeURIComponent(safeTitle)}+inauthor:${encodeURIComponent(safeAuthor)}`,
        `intitle:${encodeURIComponent(safeTitle)}+inauthor:${encodeURIComponent(lastName)}`,
        `intitle:${encodeURIComponent(safeTitle)}`
    ];

    for (const q of queries) {
        if (!q.includes("intitle:")) continue;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${GOOGLE_API_KEY}`;
        
        try {
            const res = await axios.get(url);
            if (res.data.items && res.data.items.length > 0) {
                return { ...res.data.items[0].volumeInfo, source: 'Google' };
            }
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.warn("⚠️  Google API Quota Exceeded. Switching to OpenLibrary...");
                GOOGLE_QUOTA_EXHAUSTED = true; 
                return null;
            }
            if (e.response && e.response.status === 429 && retries > 0) {
                await sleep(2000); 
                return fetchGoogleMetadata(title, author, retries - 1);
            }
        }
    }
    return null;
}

// --- OPEN LIBRARY FETCHER ---
async function fetchOpenLibraryMetadata(title, author) {
    try {
        const cleanTitle = title.replace(/[^\w\s]/gi, ' ').trim();
        const cleanAuthor = author ? author.replace(/By:|Dr\.|Prof\.|Mr\.|Mrs\./gi, '').replace(/[^\w\s]/gi, ' ').trim() : '';

        const q = `title=${encodeURIComponent(cleanTitle)}&author=${encodeURIComponent(cleanAuthor)}`;
        const url = `https://openlibrary.org/search.json?${q}&limit=1`;
        
        const res = await axios.get(url, { timeout: 8000 });
        if (res.data.docs && res.data.docs.length > 0) {
            const doc = res.data.docs[0];
            
            return {
                title: doc.title,
                subtitle: doc.subtitle,
                authors: doc.author_name || [],
                publisher: doc.publisher ? doc.publisher[0] : null,
                publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : null,
                subjects: doc.subject || [],
                description: "", 
                source: 'OpenLib'
            };
        }
    } catch (e) { /* ignore */ }
    return null;
}

// --- MAIN LOGIC ---
async function run() {
    
    // 1. DYNAMIC FILE LOADING (Fixes hardcoded list)
    if (!fs.existsSync(DATA_FOLDER)) {
        console.error(`❌ Data folder not found at: ${DATA_FOLDER}`);
        process.exit(1);
    }
    const csvFiles = fs.readdirSync(DATA_FOLDER).filter(f => f.endsWith('.csv'));
    console.log(`📂 Found ${csvFiles.length} CSV files to process.`);

    const allRows = [];
    for (const file of csvFiles) {
        const filePath = path.join(DATA_FOLDER, file);
        console.log(`   Reading ${file}...`);
        await new Promise((resolve) => {
            fs.createReadStream(filePath)
              .pipe(csv())
              .on('data', (row) => allRows.push(row))
              .on('end', resolve);
        });
    }
    console.log(`📊 Total Records Loaded: ${allRows.length}`);

    // 2. GROUP DUPLICATES
    const uniqueBooksMap = new Map();
    allRows.forEach(row => {
        const title = row.Title || 'Unknown';
        const author = row.Author || '';
        // Normalization Key
        const key = (title + author).toLowerCase().replace(/[^\w]/g, '');

        if (!uniqueBooksMap.has(key)) {
            uniqueBooksMap.set(key, {
                rawTitle: title,
                rawAuthor: author,
                locations: new Set(), 
                originalId: row.BiblioID,
                localPubDate: row.Pub
            });
        }
        // Handle call numbers
        if (row.CallNo) uniqueBooksMap.get(key).locations.add(row.CallNo);
    });

    const uniqueBooks = Array.from(uniqueBooksMap.values());
    console.log(`📉 Compressed to ${uniqueBooks.length} unique titles.`);

    // 3. PROCESS QUEUE
    console.log('\n🚀 Starting Intelligent Enrichment (Hybrid Mode)...');
    console.log('---------------------------------------------------------------');
    
    let processedCount = 0;
    let googleCount = 0;
    let olCount = 0;
    let batchOps = [];

    const processGroup = async (group) => {
        let apiData = null;
        
        // Try Google first
        if (!GOOGLE_QUOTA_EXHAUSTED) {
            apiData = await fetchGoogleMetadata(group.rawTitle, group.rawAuthor);
        }

        // Failover to Open Library
        if (!apiData) {
            apiData = await fetchOpenLibraryMetadata(group.rawTitle, group.rawAuthor);
        }

        // Stats
        if (apiData && apiData.source === 'Google') {
            process.stdout.write('G');
            googleCount++;
        } else if (apiData && apiData.source === 'OpenLib') {
            process.stdout.write('O');
            olCount++;
        } else {
            process.stdout.write('.');
        }

        // Prepare Data Object
        const bookInfo = {
            title: apiData?.title || group.rawTitle,
            subtitle: apiData?.subtitle,
            authors: apiData?.authors || [group.rawAuthor],
            description: apiData?.description || "No description available.",
            categories: apiData?.categories || [], 
            subjects: apiData?.subjects || [],     
            publisher: apiData?.publisher,
            publishedDate: apiData?.publishedDate || group.localPubDate,
            pageCount: apiData?.pageCount,
            language: apiData?.language,
            coverImage: apiData?.imageLinks?.thumbnail || '',
            previewLink: apiData?.previewLink
        };

        const richTags = generateRichTags(bookInfo);

        return {
            updateOne: {
                filter: { title: group.rawTitle, authors: group.rawAuthor },
                update: {
                    $set: { ...bookInfo, tags: richTags },
                    $inc: { count: group.locations.size },
                    $addToSet: { locations: { $each: Array.from(group.locations) } },
                    $setOnInsert: { 
                        meta: { source: apiData ? apiData.source : 'Local', originalId: group.originalId } 
                    }
                },
                upsert: true
            }
        };
    };

    const promises = uniqueBooks.map(group => limit(async () => {
        const op = await processGroup(group);
        batchOps.push(op);
        processedCount++;

        // Batch Write
        if (batchOps.length >= BATCH_SIZE) {
            const opsToSave = [...batchOps];
            batchOps = []; 
            await Book.bulkWrite(opsToSave);
        }

        // Progress Log
        if (processedCount % 50 === 0) {
             const percent = ((processedCount / uniqueBooks.length) * 100).toFixed(1);
             console.log(` [${processedCount}] ${percent}% (G:${googleCount} O:${olCount})`);
        }
    }));

    await Promise.all(promises);

    // Save remaining
    if (batchOps.length > 0) {
        await Book.bulkWrite(batchOps);
    }

    console.log(`\n\n🎉 Seeding Complete!`);
    console.log(`📊 Stats: Google: ${googleCount} | OpenLib: ${olCount} | Local: ${uniqueBooks.length - googleCount - olCount}`);
    process.exit(0);
}

run();