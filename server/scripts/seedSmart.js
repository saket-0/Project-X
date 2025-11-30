require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const natural = require('natural');
const pLimit = require('p-limit');

const Book = require('../src/models/Book');
const Taxonomy = require('../src/models/Taxonomy');

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 5; // Keep low to be polite to Google
const BATCH_SIZE = 50;       // Save to DB every 50 distinct titles
const GOOGLE_API_KEY = "AIzaSyC2SArU3AIbcCdLu_35JXJ9whgyREjkzkw"; // <--- PASTE KEY HERE

const CSV_FILES = [
    'vit_data_bot1.csv',
    'vit_data_bot2.csv',
    'vit_data_bot3.csv',
    'vit_data_bot4.csv'
];

const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'it', 'as', 'was', 'with', 'on', 'by', 
  'an', 'be', 'this', 'which', 'or', 'from', 'at', 'but', 'not', 'are', 'have', 'has', 'had', 
  'introduction', 'guide', 'handbook', 'manual', 'edition', 'volume', 'chapter', 'pages', 
  'published', 'textbook', 'principles', 'fundamentals', 'comprehensive', 'study', 'approach',
  'theory', 'practice', 'application', 'modern', 'basic', 'advanced', 'concepts', 'analysis'
]);

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
const taxonomyCache = new Map(); 
const newKeywords = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- BRAIN FUNCTIONS ---
async function loadBrain() {
  try {
    const docs = await Taxonomy.find({});
    docs.forEach(d => taxonomyCache.set(d.keyword, d.tags));
    console.log(`🧠 Brain loaded with ${taxonomyCache.size} concepts.`);
  } catch (e) { console.log('⚠️  Could not load brain.'); }
}

async function saveBrain() {
  if (newKeywords.size === 0) return;
  const ops = [];
  for (const [keyword, tags] of newKeywords.entries()) {
    ops.push({
      updateOne: {
        filter: { keyword: keyword },
        update: { $addToSet: { tags: { $each: tags } }, $inc: { frequency: 1 } },
        upsert: true
      }
    });
  }
  if (ops.length > 0) await Taxonomy.bulkWrite(ops);
  newKeywords.clear();
}

// --- TAGGING ENGINE ---
function generateRichTags(bookInfo) {
    const tags = new Set();
    const { title, subtitle, description, categories, publisher, publishedDate, authors } = bookInfo;

    // 1. Explicit Categories
    if (categories) categories.forEach(cat => cat.split('/').forEach(s => tags.add(s.trim())));

    // 2. Metadata
    if (publisher) tags.add(publisher);
    if (publishedDate) tags.add(publishedDate.substring(0, 4));
    if (authors) authors.forEach(a => tags.add(a));

    // 3. Text Mining (Aggressive)
    const textToScan = `${title} ${subtitle || ''} ${description || ''}`;
    const words = tokenizer.tokenize(textToScan);
    
    // Frequency Map for this specific book
    const wordFreq = {};

    words.forEach(word => {
        const w = word.toLowerCase();
        // Filter noise
        if (w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
            
            // A. Check Brain (Shared Knowledge)
            if (taxonomyCache.has(w)) {
                taxonomyCache.get(w).forEach(t => tags.add(t));
                tags.add(w); // Add the keyword itself
            }
            
            // B. Local Frequency (for Description mining)
            wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
    });

    // C. Add top frequent words from description as tags (Self-Learning for this book)
    Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a) // Sort by frequency
        .slice(0, 8) // Take top 8 keywords
        .forEach(([word]) => tags.add(word.charAt(0).toUpperCase() + word.slice(1)));
    
    return Array.from(tags);
}

// --- API FETCHER ---
async function fetchMetadata(title, author, retries = 2) {
  const safeTitle = title.replace(/[^\w\s]/gi, ' ').trim();
  const safeAuthor = author ? author.replace(/[^\w\s]/gi, ' ').replace(/By/i, '').trim() : '';
  
  // Strategy: Specific first, then broad
  const queries = [
      `intitle:${encodeURIComponent(safeTitle)}+inauthor:${encodeURIComponent(safeAuthor)}`,
      `intitle:${encodeURIComponent(safeTitle)}`
  ];

  for (const q of queries) {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${GOOGLE_API_KEY}`;
      try {
        const res = await axios.get(url);
        if (res.data.items && res.data.items.length > 0) {
          return res.data.items[0].volumeInfo;
        }
      } catch (e) {
        if (e.response && e.response.status === 429 && retries > 0) {
            // Hit rate limit? Pause and retry.
            await sleep(2000 * (3 - retries)); 
            return fetchMetadata(title, author, retries - 1);
        }
      }
  }
  return null;
}

// --- MAIN LOGIC ---
async function run() {
    await loadBrain();
    
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

    // 2. GROUP DUPLICATES (The "Pre-Process" Step)
    // This prevents race conditions and ensures we only fetch API once per unique book.
    console.log('🔄 Grouping duplicates...');
    const uniqueBooksMap = new Map();

    allRows.forEach(row => {
        const title = row.Title || 'Unknown';
        const author = row.Author || '';
        const key = (title + author).toLowerCase().trim();

        if (!uniqueBooksMap.has(key)) {
            uniqueBooksMap.set(key, {
                rawTitle: title,
                rawAuthor: author,
                locations: new Set(), // Use Set to avoid duplicate call numbers
                originalId: row.BiblioID,
                pubDate: row.Pub
            });
        }
        // Add location/CallNo to the group
        if (row.CallNo) uniqueBooksMap.get(key).locations.add(row.CallNo);
    });

    const uniqueBooks = Array.from(uniqueBooksMap.values());
    console.log(`📉 Compressed to ${uniqueBooks.length} unique titles.`);

    // 3. PROCESS QUEUE
    console.log('🚀 Starting Intelligent Enrichment...');
    
    let processedCount = 0;
    let batchOps = [];

    const processGroup = async (group) => {
        let apiData = null;
        try {
            apiData = await fetchMetadata(group.rawTitle, group.rawAuthor);
        } catch (e) { /* ignore */ }

        if (apiData) process.stdout.write('.');
        else process.stdout.write('_');

        // Prepare Data
        const bookInfo = {
            title: apiData?.title || group.rawTitle,
            subtitle: apiData?.subtitle,
            authors: apiData?.authors || [group.rawAuthor],
            description: apiData?.description || "No description available.",
            categories: apiData?.categories || [],
            publisher: apiData?.publisher,
            publishedDate: apiData?.publishedDate || group.pubDate,
            pageCount: apiData?.pageCount,
            language: apiData?.language,
            averageRating: apiData?.averageRating,
            ratingsCount: apiData?.ratingsCount,
            coverImage: apiData?.imageLinks?.thumbnail || '',
            previewLink: apiData?.previewLink
        };

        const richTags = generateRichTags(bookInfo);

        // Prepare DB Operation (Upsert)
        // We use "title + authors" as the unique key in DB
        return {
            updateOne: {
                filter: { title: group.rawTitle, authors: group.rawAuthor },
                update: {
                    $set: { ...bookInfo, tags: richTags },
                    $inc: { count: group.locations.size }, // Set count to number of copies
                    $addToSet: { locations: { $each: Array.from(group.locations) } },
                    $setOnInsert: { 
                        meta: { source: apiData ? 'GoogleAPI' : 'Local', originalId: group.originalId } 
                    }
                },
                upsert: true
            }
        };
    };

    // Execute with Concurrency Limit
    const promises = uniqueBooks.map(group => limit(async () => {
        const op = await processGroup(group);
        batchOps.push(op);
        processedCount++;

        if (batchOps.length >= BATCH_SIZE) {
            const opsToSave = [...batchOps];
            batchOps = []; // Clear immediate buffer
            await Book.bulkWrite(opsToSave);
            await saveBrain();
        }

        if (processedCount % 50 === 0) process.stdout.write(` [${processedCount}] `);
    }));

    await Promise.all(promises);

    // Final Flush
    if (batchOps.length > 0) {
        await Book.bulkWrite(batchOps);
        await saveBrain();
    }

    console.log(`\n🎉 Seeding Complete! Processed ${uniqueBooks.length} titles.`);
    process.exit(0);
}

run();