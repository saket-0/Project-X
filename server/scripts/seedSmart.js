require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const natural = require('natural');
const pLimit = require('p-limit');

const Book = require('../src/models/Book');

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 5; // Keep this low for Open Library's sake
const BATCH_SIZE = 50;
const GOOGLE_API_KEY = "AIzaSyC2SArU3AIbcCdLu_35JXJ9whgyREjkzkw"; 

const CSV_FILES = [
    'vit_data_bot1.csv',
    'vit_data_bot2.csv',
    'vit_data_bot3.csv',
    'vit_data_bot4.csv'
];

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
if (!GOOGLE_API_KEY || GOOGLE_API_KEY.includes("PASTE")) {
    console.error("❌ ERROR: Please paste your Google API Key in the script!");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/project-x')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

const tokenizer = new natural.WordTokenizer();
const limit = pLimit(CONCURRENCY_LIMIT);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTELLIGENT TAGGING ENGINE ---
function generateRichTags(bookInfo) {
    const tags = new Set();
    const { title, subtitle, description, categories, publisher, authors, subjects } = bookInfo;

    // 1. Explicit Categories (Google) or Subjects (OpenLibrary)
    // This grabs "Web Development" even if title is just "Advanced JS"
    const cats = [...(categories || []), ...(subjects || [])];
    cats.forEach(cat => {
        // Split hierarchies like "Computers / Web / Design"
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

    // 3. Content Mining (The Core Solution)
    // Combine Title, Subtitle, and API Description for frequency analysis
    let textToScan = `${title} ${subtitle || ''}`;
    
    // Only use description if it's valid and not the default "No description available"
    if (description && !description.toLowerCase().includes('no description available')) {
        textToScan += ` ${description}`;
    }

    const words = tokenizer.tokenize(textToScan);
    const wordFreq = {};

    words.forEach(word => {
        const w = word.toLowerCase();
        // Filter noise: must be > 2 chars, not a stop word, not a number
        if (w.length > 2 && !STOP_WORDS.has(w) && isNaN(w)) {
            wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
    });

    // 4. Convert top frequent words to tags (Top 40 keywords)
    // If "Javascript" appears 5 times in the description, it WILL be a tag now.
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
            // 403 = Daily Limit Exceeded (Stop using Google today)
            if (e.response && e.response.status === 403) {
                GOOGLE_QUOTA_EXHAUSTED = true; 
                return null;
            }
            // 429 = Rate Limit (Just wait a bit)
            if (e.response && e.response.status === 429 && retries > 0) {
                await sleep(2000); 
                return fetchGoogleMetadata(title, author, retries - 1);
            }
        }
    }
    return null;
}

// --- OPEN LIBRARY FETCHER (Fixed "By:" Issue) ---
async function fetchOpenLibraryMetadata(title, author) {
    try {
        // CLEANING: This fixes the "X" error.
        // Removes "By:", "Dr.", special chars before searching.
        const cleanTitle = title.replace(/[^\w\s]/gi, ' ').trim();
        const cleanAuthor = author ? author.replace(/By:|Dr\.|Prof\.|Mr\.|Mrs\./gi, '').replace(/[^\w\s]/gi, ' ').trim() : '';

        const q = `title=${encodeURIComponent(cleanTitle)}&author=${encodeURIComponent(cleanAuthor)}`;
        const url = `https://openlibrary.org/search.json?${q}&limit=1`;
        
        // Increased timeout to 8s because OL is slower than Google
        const res = await axios.get(url, { timeout: 8000 });
        if (res.data.docs && res.data.docs.length > 0) {
            const doc = res.data.docs[0];
            
            return {
                title: doc.title,
                subtitle: doc.subtitle,
                authors: doc.author_name || [],
                publisher: doc.publisher ? doc.publisher[0] : null,
                publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : null,
                subjects: doc.subject || [], // This is crucial for tags!
                description: "", // OL Search usually doesn't give desc, but subjects fill the gap
                source: 'OpenLib'
            };
        }
    } catch (e) { /* ignore */ }
    return null;
}

// --- MAIN LOGIC ---
async function run() {
    
    // 1. READ ALL CSV FILES
    const allRows = [];
    for (const file of CSV_FILES) {
        const filePath = path.join(__dirname, '../library_data', file);
        if (fs.existsSync(filePath)) {
            console.log(`📂 Reading ${file}...`);
            await new Promise((resolve) => {
                fs.createReadStream(filePath)
                  .pipe(csv())
                  .on('data', (row) => allRows.push(row))
                  .on('end', resolve);
            });
        }
    }
    console.log(`📊 Total Records Loaded: ${allRows.length}`);

    // 2. GROUP DUPLICATES
    const uniqueBooksMap = new Map();
    allRows.forEach(row => {
        const title = row.Title || 'Unknown';
        const author = row.Author || '';
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
        if (row.CallNo) uniqueBooksMap.get(key).locations.add(row.CallNo);
    });

    const uniqueBooks = Array.from(uniqueBooksMap.values());
    console.log(`📉 Compressed to ${uniqueBooks.length} unique titles.`);

    // 3. PROCESS QUEUE
    console.log('\n🚀 Starting Intelligent Enrichment (Hybrid Mode)...');
    console.log('---------------------------------------------------------------');
    console.log(' G = Enriched via Google API (Rich Description & Tags)');
    console.log(' O = Enriched via Open Library (Subjects as Tags)');
    console.log(' . = Local Data Only (No match found in APIs)');
    console.log('---------------------------------------------------------------');
    
    let processedCount = 0;
    let googleCount = 0;
    let olCount = 0;
    let batchOps = [];

    const processGroup = async (group) => {
        let apiData = null;
        
        // 1. Try Google
        if (!GOOGLE_QUOTA_EXHAUSTED) {
            apiData = await fetchGoogleMetadata(group.rawTitle, group.rawAuthor);
        }

        // 2. Failover to Open Library (Cleaned Query)
        if (!apiData) {
            apiData = await fetchOpenLibraryMetadata(group.rawTitle, group.rawAuthor);
        }

        // Visual Indicator
        if (apiData && apiData.source === 'Google') {
            process.stdout.write('G');
            googleCount++;
        } else if (apiData && apiData.source === 'OpenLib') {
            process.stdout.write('O');
            olCount++;
        } else {
            process.stdout.write('.');
        }

        // Prepare Data
        const bookInfo = {
            title: apiData?.title || group.rawTitle,
            subtitle: apiData?.subtitle,
            authors: apiData?.authors || [group.rawAuthor],
            // Use API description or fallback text. NEVER use CSV description.
            description: apiData?.description || "No description available.",
            categories: apiData?.categories || [], 
            subjects: apiData?.subjects || [],     
            publisher: apiData?.publisher,
            publishedDate: apiData?.publishedDate || group.localPubDate,
            pageCount: apiData?.pageCount,
            language: apiData?.language,
            averageRating: apiData?.averageRating,
            ratingsCount: apiData?.ratingsCount,
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

        if (batchOps.length >= BATCH_SIZE) {
            const opsToSave = [...batchOps];
            batchOps = []; 
            await Book.bulkWrite(opsToSave);
        }

        if (processedCount % 50 === 0) {
             const percent = ((processedCount / uniqueBooks.length) * 100).toFixed(1);
             console.log(` [${processedCount}] ${percent}% (G:${googleCount} O:${olCount})`);
        }
    }));

    await Promise.all(promises);

    if (batchOps.length > 0) {
        await Book.bulkWrite(batchOps);
    }

    console.log(`\n\n🎉 Seeding Complete!`);
    console.log(`📊 Stats: Google: ${googleCount} | OpenLib: ${olCount} | Local: ${uniqueBooks.length - googleCount - olCount}`);
    process.exit(0);
}

run();