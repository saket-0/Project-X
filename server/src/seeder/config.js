const path = require('path');
// FIX: Use an absolute path to find .env correctly
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/library_db',
    googleApiKey: process.env.GOOGLE_BOOKS_API_KEY,
    dataFolder: path.join(__dirname, '../../library_data'),
    concurrency: 5,
    batchSize: 50,
    stopWords: new Set([
        'the', 'and', 'of', 'to', 'in', 'a', 'introduction', 'guide', 'handbook', 
        'manual', 'edition', 'volume', 'textbook', 'principles', 'fundamentals'
    ])
};