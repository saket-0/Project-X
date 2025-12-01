/**
 * server/src/controllers/bookController.js
 * FIXED: 
 * 1. Exports 'getBooks' and 'getBookById' (matching index.js).
 * 2. 'getBooks': Restores _id for grouped items so clicking works.
 * 3. 'getBookById': Handles both Mongo IDs and Library IDs.
 */
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 
const { groupBooksByTitle } = require('../utils/bookGrouping');
const { rankBooks } = require('../utils/searchEngine'); 

// --- 1. SEARCH & BROWSE CONTROLLER ---
const getBooks = async (req, res) => {
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
        
        // A. BUILD QUERY
        let query = {};
        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }
        
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        if (authors) query.author = { $in: toArray(authors) };
        if (pubs) query.publisher = { $in: toArray(pubs) };
        if (accessionTypes) query.accessionType = { $in: toArray(accessionTypes) };

        // B. FETCH DATA
        let processedResults = [];

        if (cleanSearch) {
            // Check if search is a direct Library ID (Number)
            if (!isNaN(cleanSearch)) {
                // If user types "216496", exact match that ID first
                const idMatch = await Book.findOne({ libraryId: Number(cleanSearch) }).lean();
                if (idMatch) processedResults = [idMatch];
                else {
                    // Fallback to text search
                    const rawBooks = await Book.find(query).select('-parsedLocation').lean();
                    const targetFields = searchFields.split(',').map(f => f.trim()).filter(Boolean);
                    processedResults = rankBooks(rawBooks, cleanSearch, targetFields, isExact);
                }
            } else {
                // Standard Text Search
                const rawBooks = await Book.find(query).select('-parsedLocation').lean();
                const targetFields = searchFields.split(',').map(f => f.trim()).filter(Boolean);
                processedResults = rankBooks(rawBooks, cleanSearch, targetFields, isExact);
            }
        } else {
            // Browse Mode
            processedResults = await Book.find(query)
                .sort({ createdAt: -1 })
                .select('-parsedLocation') // Optimization
                .lean();
            
            processedResults = processedResults.map(b => ({ ...b, relevanceScore: 0, matchedWords: [] }));
        }

        // C. PARSE LOCATIONS
        const booksWithLocation = processedResults.map(book => ({
            ...book,
            parsedLocation: parseShelf(book.location || book.shelf || book.callNumber || 'N/A')
        }));

        // D. FACETS
        const { facets, finalFilteredData } = applyLocationFiltersAndFacets(booksWithLocation, floors, racks, cols);

        // E. GROUPING
        const groupedBooks = groupBooksByTitle(finalFilteredData);

        // F. ID RESTORATION (The Fix for "undefined" clicks)
        const robustData = groupedBooks.map(group => {
            // 1. If the group itself has an ID (single book), use it
            if (group._id) return group;

            // 2. If it's a merged group, grab the ID from the first book in the list
            if (group.books && group.books.length > 0) {
                return { ...group, _id: group.books[0]._id };
            }

            // 3. Fallback
            return { ...group, _id: `temp_${Math.random()}` };
        });

        // G. PAGINATION
        const totalResults = robustData.length;
        const limitNum = parseInt(limit);
        const currentPage = parseInt(page);
        const startIndex = (currentPage - 1) * limitNum;
        
        const paginatedData = robustData.slice(startIndex, startIndex + limitNum);

        res.json({
            meta: {
                totalResults,
                currentPage,
                totalPages: Math.ceil(totalResults / limitNum),
                limit: limitNum
            },
            facets, 
            data: paginatedData
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// --- 2. SINGLE BOOK CONTROLLER ---
const getBookById = async (req, res) => {
    const { id } = req.params;
    console.log(`\n🔎 [Debug] Looking for Book ID: "${id}"`);

    try {
        let book = null;
        let strategy = "";

        // STRATEGY 1: Mongo ObjectID (from click)
        if (mongoose.Types.ObjectId.isValid(id)) {
            strategy = "MongoDB ObjectID";
            book = await Book.findById(id);
        }

        // STRATEGY 2: Numeric Library ID (from search bar URL hack)
        if (!book && !isNaN(id)) {
            strategy = "Numeric Library ID";
            book = await Book.findOne({ libraryId: Number(id) });
        }

        if (!book) {
            console.log(`❌ [Debug] Not Found.`);
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        console.log(`✅ [Debug] Found: "${book.title}" via ${strategy}`);
        
        // Add parsed location for the detail view
        const bookObj = book.toObject();
        bookObj.parsedLocation = parseShelf(bookObj.location || bookObj.shelf || bookObj.callNumber || 'N/A');
        
        res.json({ success: true, data: bookObj });

    } catch (error) {
        console.error("❌ [Debug] Server Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// --- HELPER: FACETS ---
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
        if (selectedFloors.length > 0) {
            if (!book.parsedLocation || !selectedFloors.includes(book.parsedLocation.floor)) return false;
        }
        if (selectedRacks.length > 0) {
            if (!book.parsedLocation || !selectedRacks.includes(String(book.parsedLocation.rack))) return false;
        }

        // Populate Facets
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

module.exports = { getBooks, getBookById };