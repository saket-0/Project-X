require('dotenv').config({ path: '../../.env' });
const path = require('path');

module.exports = {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/library_db',
    googleApiKey: process.env.GOOGLE_BOOKS_API_KEY,
    dataFolder: path.join(__dirname, '../../library_data'),
    concurrency: 5,   // How many API calls at once
    batchSize: 50,    // How many records to write to DB at once
    stopWords: new Set([
        'the', 'and', 'of', 'to', 'in', 'a', 'introduction', 'guide', 'handbook', 
        'manual', 'edition', 'volume', 'textbook', 'principles', 'fundamentals'
    ])
};