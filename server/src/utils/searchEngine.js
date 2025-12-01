const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/books_db.json');
let MEMORY_CACHE = null;

const loadData = () => {
    if (MEMORY_CACHE) return MEMORY_CACHE;
    try {
        if (!fs.existsSync(DB_PATH)) return [];
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        MEMORY_CACHE = JSON.parse(raw);
        return MEMORY_CACHE;
    } catch (e) {
        console.error("Failed to load DB:", e);
        return [];
    }
};

const searchBooks = ({ query, filters = {}, page = 1, limit = 50 }) => {
    const books = loadData();
    const q = query ? query.toLowerCase() : '';

    // 1. Filter
    let results = books.filter(book => {
        // --- Explicit ID Filter (New: for Direct Lookup) ---
        if (filters.id && String(book.id) !== String(filters.id)) {
            return false;
        }

        // --- Text Search (Updated) ---
        // Now checks Title, Author, CallNumber, AND ID/ISBN
        const matchesText = !q || 
            book.title.toLowerCase().includes(q) || 
            book.author.toLowerCase().includes(q) ||
            book.callNumber.toLowerCase().includes(q) ||
            String(book.id).includes(q) ||         // <--- Allow searching by ID
            (book.isbn && book.isbn.includes(q));  // <--- Allow searching by ISBN

        if (!matchesText) return false;

        // Faceted Filters
        if (filters.floor && book.floor !== filters.floor) return false;
        if (filters.status && book.status !== filters.status) return false;
        if (filters.category && book.category !== filters.category) return false;

        return true;
    });

    // 2. Pagination
    const total = results.length;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + parseInt(limit));

    // 3. Facets
    const facets = {
        floors: [...new Set(results.map(b => b.floor).filter(Boolean))].sort(),
        categories: [...new Set(results.map(b => b.category).filter(Boolean))].slice(0, 20)
    };

    return {
        data: paginated,
        meta: { total, page: parseInt(page), totalPages: Math.ceil(total / limit), facets }
    };
};

module.exports = { searchBooks };