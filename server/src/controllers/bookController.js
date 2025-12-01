/**
 * server/src/controllers/bookController.js
 * CLEAN ARCHITECTURE: Controller delegates Ranking to SearchEngine
 */
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 
const { groupBooksByTitle } = require('../utils/bookGrouping');
const { rankBooks } = require('../utils/searchEngine'); // <--- IMPORT NEW ENGINE

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

        // --- 1. PREPARE PARAMETERS ---
        const targetFields = searchFields.split(',').map(f => f.trim()).filter(Boolean);
        const isExact = exactMatch === 'true';
        const cleanSearch = search.trim();
        
        // --- 2. BUILD BROAD DATABASE QUERY ---
        // Strategy: Fetch broadly (using Regex), then let the Engine refine & rank.
        let query = {};
        
        if (cleanSearch) {
            const regex = new RegExp(cleanSearch, 'i');
            const orConditions = [];

            // If user wants specific fields, only search those. 
            // Otherwise, search broad fields to ensure we don't miss candidates for the fuzzy engine.
            const dbSearchFields = targetFields.length > 0 ? targetFields : ['title', 'author', 'isbn', 'tags'];

            dbSearchFields.forEach(field => {
                orConditions.push({ [field]: regex });
            });

            // "Fuzzy Candidate" Strategy: 
            // Also grab anything that *might* be a typo match (broad regex) if not in Exact Mode.
            // This is optional but helps fetch "Pythen" when searching "Python"
            if (!isExact) {
                const looseRegex = new RegExp(cleanSearch.split('').join('.*'), 'i'); 
                dbSearchFields.forEach(field => {
                     orConditions.push({ [field]: looseRegex });
                });
            }

            if (orConditions.length > 0) query.$or = orConditions;
        }

        // Apply Hard Filters (Status, Location, etc.)
        if (availableOnly === 'true') query.status = { $regex: 'available', $options: 'i' };
        
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        if (authors) query.author = { $in: toArray(authors) };
        if (pubs) query.publisher = { $in: toArray(pubs) };
        if (accessionTypes) query.accessionType = { $in: toArray(accessionTypes) };

        // --- 3. FETCH RAW DATA ---
        // We lean() for performance since we are doing read-only ops
        const rawBooks = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage description accessionType isbn')
            .lean();

        // --- 4. RANKING ENGINE (The new Module) ---
        // The engine adds 'relevanceScore' and sorts the array
        const rankedBooks = rankBooks(rawBooks, cleanSearch, targetFields, isExact);

        // --- 5. POST-PROCESSING (Shelf Parsing & Grouping) ---
        // We only process locations for the filtered results to save CPU
        const processedBooks = rankedBooks.map(book => ({
            ...book,
            parsedLocation: parseShelf(book.location || book.shelf || book.callNumber || 'N/A')
        }));

        // --- 6. DYNAMIC FACETS ---
        // Calculate facets based on the CURRENT ranked result set
        const facets = {
            authors: new Set(),
            pubs: new Set(),
            floors: new Set(),
            racks: new Set(),
            cols: new Set(),
            accessionTypes: new Set()
        };

        const isLocationMatch = (book) => {
            const selectedFloors = toArray(floors);
            const selectedRacks = toArray(racks); 
            
            if (selectedFloors.length === 0 && selectedRacks.length === 0) return true;
            if (!book.parsedLocation) return false;
            
            if (selectedFloors.length > 0 && !selectedFloors.includes(book.parsedLocation.floor)) return false;
            if (selectedRacks.length > 0 && !selectedRacks.includes(String(book.parsedLocation.rack))) return false;
            
            return true;
        };

        const finalFiltered = processedBooks.filter(book => {
            const matchesLoc = isLocationMatch(book);
            if (matchesLoc) {
                // Populate Facets
                if (book.author) facets.authors.add(book.author);
                if (book.publisher) facets.pubs.add(book.publisher);
                if (book.accessionType) facets.accessionTypes.add(book.accessionType);
                if (book.parsedLocation && book.parsedLocation.floor !== 'Unknown') {
                    facets.floors.add(book.parsedLocation.floor);
                    facets.racks.add(book.parsedLocation.rack);
                    facets.cols.add(book.parsedLocation.col);
                }
            }
            return matchesLoc;
        });

        // --- 7. GROUPING ---
        const groupedBooks = groupBooksByTitle(finalFiltered);

        // --- 8. PAGINATION ---
        const totalResults = groupedBooks.length;
        const limitNum = parseInt(limit);
        const currentPage = parseInt(page);
        const startIndex = (currentPage - 1) * limitNum;
        
        const paginatedData = groupedBooks.slice(startIndex, startIndex + limitNum);

        // --- 9. RESPONSE ---
        res.json({
            meta: {
                totalResults,
                currentPage,
                totalPages: Math.ceil(totalResults / limitNum),
                limit: limitNum
            },
            facets: {
                authors: Array.from(facets.authors).sort(),
                pubs: Array.from(facets.pubs).sort(),
                accessionTypes: Array.from(facets.accessionTypes).sort(),
                floors: Array.from(facets.floors).sort(),
                racks: Array.from(facets.racks).filter(r => r !== 999).sort((a, b) => a - b),
                cols: Array.from(facets.cols).filter(c => c !== 999).sort((a, b) => a - b)
            },
            data: paginatedData
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };