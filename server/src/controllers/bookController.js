/**
 * server/src/controllers/bookController.js
 * FIXED: Unifies Search & Browse paths to ensure Facets are always populated.
 */
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 
const { groupBooksByTitle } = require('../utils/bookGrouping');
const { rankBooks } = require('../utils/searchEngine'); 

const searchBooks = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '',
            searchFields = 'title,author', 
            exactMatch = 'false',
            availableOnly,
            authors,
            pubs,
            floors,
            racks,
            cols,
            accessionTypes
        } = req.query;

        const isExact = exactMatch === 'true';
        const cleanSearch = search.trim();
        
        // --- 1. BUILD BASE QUERY (Hard Filters) ---
        let query = {};

        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }
        
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        if (authors) query.author = { $in: toArray(authors) };
        if (pubs) query.publisher = { $in: toArray(pubs) };
        if (accessionTypes) query.accessionType = { $in: toArray(accessionTypes) };

        // --- 2. FETCH DATA ---
        let processedResults = [];

        // CASE A: SEARCH MODE (Use Fuse.js)
        if (cleanSearch) {
            // Fetch broadly to allow Fuzzy Matching to work (e.g. "Practisioner")
            const rawBooks = await Book.find(query)
                .select('title author publisher status location shelf callNumber tags coverImage description accessionType isbn')
                .lean();

            const targetFields = searchFields.split(',').map(f => f.trim()).filter(Boolean);
            processedResults = rankBooks(rawBooks, cleanSearch, targetFields, isExact);
        } 
        // CASE B: BROWSE MODE (Standard DB Fetch)
        else {
            // Fetch everything matching the hard filters (sorted by newest)
            // Note: We fetch all matches here to calculate global facets accurately
            processedResults = await Book.find(query)
                .sort({ createdAt: -1 })
                .select('title author publisher status location shelf callNumber tags coverImage description accessionType isbn')
                .lean();
            
            // Add dummy props for consistency
            processedResults = processedResults.map(b => ({ ...b, relevanceScore: 0, matchedWords: [] }));
        }

        // --- 3. PARSE LOCATIONS ---
        // We parse locations for ALL results to enable the Location Filter Logic
        const booksWithLocation = processedResults.map(book => ({
            ...book,
            parsedLocation: parseShelf(book.location || book.shelf || book.callNumber || 'N/A')
        }));

        // --- 4. APPLY LOCATION FILTERS & GENERATE FACETS ---
        // This is the step that was missing in the "Browse" path previously
        const { facets, finalFilteredData } = applyLocationFiltersAndFacets(booksWithLocation, floors, racks, cols);

        // --- 5. GROUPING (Deduplicate copies) ---
        const groupedBooks = groupBooksByTitle(finalFilteredData);

        // --- 6. PAGINATION ---
        const totalResults = groupedBooks.length;
        const limitNum = parseInt(limit);
        const currentPage = parseInt(page);
        const startIndex = (currentPage - 1) * limitNum;
        
        const paginatedData = groupedBooks.slice(startIndex, startIndex + limitNum);

        // --- 7. RESPONSE ---
        res.json({
            meta: {
                totalResults,
                currentPage,
                totalPages: Math.ceil(totalResults / limitNum),
                limit: limitNum
            },
            facets, // <--- Now correctly populated in both modes
            data: paginatedData
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// --- HELPER: FACET GENERATOR ---
const applyLocationFiltersAndFacets = (books, floors, racks, cols) => {
    const facets = {
        authors: new Set(),
        pubs: new Set(),
        floors: new Set(),
        racks: new Set(),
        cols: new Set(),
        accessionTypes: new Set()
    };
    
    const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
    const selectedFloors = toArray(floors);
    const selectedRacks = toArray(racks);

    const filtered = books.filter(book => {
        // 1. Check Location Filters
        if (selectedFloors.length > 0) {
            if (!book.parsedLocation || !selectedFloors.includes(book.parsedLocation.floor)) return false;
        }
        if (selectedRacks.length > 0) {
            if (!book.parsedLocation || !selectedRacks.includes(String(book.parsedLocation.rack))) return false;
        }

        // 2. Populate Facets (Only for books that passed the filter)
        if (book.author) facets.authors.add(book.author);
        if (book.publisher) facets.pubs.add(book.publisher);
        if (book.accessionType) facets.accessionTypes.add(book.accessionType);
        
        if (book.parsedLocation && book.parsedLocation.floor !== 'Unknown') {
            facets.floors.add(book.parsedLocation.floor);
            facets.racks.add(book.parsedLocation.rack);
            facets.cols.add(book.parsedLocation.col);
        }

        return true;
    });

    return {
        finalFilteredData: filtered,
        facets: {
            authors: Array.from(facets.authors).sort(),
            pubs: Array.from(facets.pubs).sort(),
            accessionTypes: Array.from(facets.accessionTypes).sort(),
            floors: Array.from(facets.floors).sort(),
            racks: Array.from(facets.racks).filter(r => r !== 999).sort((a, b) => a - b),
            cols: Array.from(facets.cols).filter(c => c !== 999).sort((a, b) => a - b)
        }
    };
};

module.exports = { searchBooks };