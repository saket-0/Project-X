// src/services/metadataFetcher.js
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

// Resilience: Retry up to 3 times if the API chokes or rate limits (429)
axiosRetry(axios, { 
    retries: 3, 
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
    }
});

const GOOGLE_API = 'https://www.googleapis.com/books/v1/volumes';
const OPENLIB_API = 'https://openlibrary.org/search.json';

// Fetch from Google Books
const fetchGoogleData = async (title, author) => {
    try {
        const query = `intitle:${title} ${author ? '+inauthor:' + author : ''}`;
        const url = `${GOOGLE_API}?q=${encodeURIComponent(query)}&maxResults=1&printType=books`;
        
        const res = await axios.get(url, { timeout: 5000 }); // Fast timeout

        if (res.data.items && res.data.items.length > 0) {
            const info = res.data.items[0].volumeInfo;
            return {
                publisher: info.publisher,
                description: info.description,
                categories: info.categories || [],
                pageCount: info.pageCount,
                thumbnail: info.imageLinks?.thumbnail
            };
        }
    } catch (e) {
        // Fail silently/log debug only
    }
    return null;
};

// Fetch from OpenLibrary
const fetchOpenLibData = async (title, author) => {
    try {
        const query = `${title} ${author || ''}`;
        const url = `${OPENLIB_API}?q=${encodeURIComponent(query)}&limit=1`;
        
        const res = await axios.get(url, { timeout: 8000 }); // Allow slightly longer for OL

        if (res.data.docs && res.data.docs.length > 0) {
            const doc = res.data.docs[0];
            return {
                publisher: doc.publisher ? doc.publisher[0] : null,
                subjects: [...(doc.subject || []), ...(doc.subject_facet || [])],
                publishYear: doc.first_publish_year
            };
        }
    } catch (e) {
        // Fail silently
    }
    return null;
};

/**
 * Aggregates data from multiple sources concurrently
 */
const getEnrichedData = async (title, author) => {
    // PARALLEL EXECUTION for speed
    const [google, openLib] = await Promise.all([
        fetchGoogleData(title, author),
        fetchOpenLibData(title, author)
    ]);

    return {
        google: google || {},
        openLib: openLib || {}
    };
};

module.exports = { getEnrichedData };