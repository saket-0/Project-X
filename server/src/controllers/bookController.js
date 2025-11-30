/**
 * server/src/controllers/bookController.js
 * FIXED: Aligned property names with shelfUtils and fixed projection
 */
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 

const searchBooks = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '',
            availableOnly,
            authors,
            pubs,
            floors,
            racks,
            cols
        } = req.query;

        // --- 1. BUILD BASE QUERY ---
        let query = {};

        // A. Smart Search
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            query.$or = [
                { title: regex },
                { author: regex },
                { tags: regex }
            ];
        }

        // B. Availability
        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }

        // C. Metadata Filters
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        const filterAuthors = toArray(authors);
        const filterPubs = toArray(pubs);

        if (filterAuthors.length > 0) query.author = { $in: filterAuthors };
        if (filterPubs.length > 0) query.publisher = { $in: filterPubs };

        // --- 2. FETCH ALL MATCHING DOCUMENTS ---
        // Added 'location' and 'status' explicitly to ensure we have data to parse
        const allMatches = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage')
            .lean();

        // --- 3. PROCESS & PARSE LOCATIONS ---
        const processedBooks = allMatches.map(book => {
            // Robust Fallback: Check all possible casing variations found in your legacy data
            const rawLoc = book.location || book.Shelf || book.shelf || book.callNumber || 'N/A';
            return {
                ...book,
                // Attach the parsed object
                parsedLocation: parseShelf(rawLoc)
            };
        });

        // --- 4. CALCULATE FACETS ---
        const facets = {
            authors: new Set(),
            pubs: new Set(),
            floors: new Set(),
            racks: new Set(),
            cols: new Set()
        };

        processedBooks.forEach(b => {
            if (b.author) facets.authors.add(b.author);
            if (b.publisher) facets.pubs.add(b.publisher);
            
            // FIXED: Use 'floor' (from shelfUtils), not 'floorLabel'
            if (b.parsedLocation && b.parsedLocation.floor !== 'N/A') {
                facets.floors.add(b.parsedLocation.floor);
                facets.racks.add(b.parsedLocation.rack);
                facets.cols.add(b.parsedLocation.col);
            }
        });

        // --- 5. APPLY LOCATION FILTERS ---
        const selectedFloors = toArray(floors);
        const selectedRacks = toArray(racks); 
        const selectedCols = toArray(cols);

        const filteredBooks = processedBooks.filter(book => {
            // If no location filters, return true
            if (selectedFloors.length === 0 && selectedRacks.length === 0 && selectedCols.length === 0) return true;

            if (!book.parsedLocation) return false;

            // FIXED: Match against 'floor', not 'floorLabel'
            if (selectedFloors.length > 0 && !selectedFloors.includes(book.parsedLocation.floor)) return false;
            
            // Rack Check (String comparison for safety)
            if (selectedRacks.length > 0 && !selectedRacks.includes(String(book.parsedLocation.rack))) return false;

            return true;
        });

        // --- 6. PAGINATION ---
        const totalResults = filteredBooks.length;
        const currentPage = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (currentPage - 1) * limitNum;
        const paginatedData = filteredBooks.slice(startIndex, startIndex + limitNum);

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
                floors: Array.from(facets.floors).sort(),
                // Filter out the '999' fallback racks
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