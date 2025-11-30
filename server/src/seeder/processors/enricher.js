const axios = require('axios');
const config = require('../config');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let googleQuotaExhausted = !config.googleApiKey;

const fetchGoogle = async (title, author, retries = 1) => {
    if (googleQuotaExhausted) return null;
    const q = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${config.googleApiKey}`;

    try {
        const res = await axios.get(url);
        if (res.data.items?.[0]) return { ...res.data.items[0].volumeInfo, source: 'Google' };
    } catch (e) {
        if (e.response?.status === 403) googleQuotaExhausted = true;
        if (e.response?.status === 429 && retries > 0) {
            await sleep(2000);
            return fetchGoogle(title, author, retries - 1);
        }
    }
    return null;
};

const fetchOpenLib = async (title, author) => {
    try {
        const q = `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;
        const res = await axios.get(`https://openlibrary.org/search.json?${q}&limit=1`, { timeout: 5000 });
        const doc = res.data.docs?.[0];
        if (doc) return {
            title: doc.title,
            authors: doc.author_name,
            publisher: doc.publisher?.[0],
            description: "", // OL usually lacks descriptions
            subjects: doc.subject,
            source: 'OpenLib'
        };
    } catch (e) { /* ignore */ }
    return null;
};

const enrichBook = async (book) => {
    let meta = await fetchGoogle(book.rawTitle, book.rawAuthor);
    if (!meta) meta = await fetchOpenLib(book.rawTitle, book.rawAuthor);

    return {
        ...book,
        metaData: meta || {},
        source: meta?.source || 'Local'
    };
};

module.exports = { enrichBook };