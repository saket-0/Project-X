/**
 * server/src/controllers/bookController.js
 * ROBUST ENGINE: Handles Search, Filtering, and Facet Generation
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

        // --- 1. BUILD BASE QUERY (Search & Metadata) ---
        // We filter by Text, Availability, Author, Publisher FIRST.
        // We DO NOT filter by Location yet, so we can generate Facets for ALL locations.
        let query = {};

        // A. Smart Search (Title, Author, Tags)
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

        // C. Metadata Filters (Exact Match)
        // Helper to handle array vs string params
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        const filterAuthors = toArray(authors);
        const filterPubs = toArray(pubs);

        if (filterAuthors.length > 0) query.author = { $in: filterAuthors };
        if (filterPubs.length > 0) query.publisher = { $in: filterPubs };

        // --- 2. FETCH ALL MATCHING DOCUMENTS (Lightweight) ---
        // We fetch ALL matches (not just page 1) to build accurate Facets.
        // We only fetch fields needed for filtering to keep it fast.
        const allMatches = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage')
            .lean();

        // --- 3. PROCESS & PARSE LOCATIONS ---
        const processedBooks = allMatches.map(book => {
            // Robust Fallback: Try 'location' -> 'Shelf' -> 'callNumber'
            const rawLoc = book.location || book.Shelf || book.callNumber || '';
            return {
                ...book,
                // Attach the parsed object (floorLabel, rack, etc.)
                parsedLocation: parseShelf(rawLoc)
            };
        });

        // --- 4. CALCULATE FACETS (Dynamic Filter Options) ---
        // This generates the options for the sidebar based on the Search Results
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
            if (b.parsedLocation) {
                facets.floors.add(b.parsedLocation.floorLabel);
                // Store simple numbers/strings for racks
                facets.racks.add(b.parsedLocation.rack);
                facets.cols.add(b.parsedLocation.col);
            }
        });

        // --- 5. APPLY LOCATION FILTERS (The "Side Filter" Logic) ---
        const selectedFloors = toArray(floors);
        const selectedRacks = toArray(racks); // These come as strings from query
        const selectedCols = toArray(cols);

        const filteredBooks = processedBooks.filter(book => {
            // If no location filters are set, keep everything
            if (selectedFloors.length === 0 && selectedRacks.length === 0 && selectedCols.length === 0) return true;

            // If filters are set but book has no location, drop it
            if (!book.parsedLocation) return false;

            // Check Floor
            if (selectedFloors.length > 0 && !selectedFloors.includes(book.parsedLocation.floorLabel)) return false;
            
            // Check Rack (Compare as String to be safe)
            if (selectedRacks.length > 0 && !selectedRacks.includes(String(book.parsedLocation.rack))) return false;

            return true;
        });

        // --- 6. PAGINATION ---
        const totalResults = filteredBooks.length;
        const currentPage = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (currentPage - 1) * limitNum;
        const paginatedData = filteredBooks.slice(startIndex, startIndex + limitNum);

        // --- 7. RESPONSE ---
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
                racks: Array.from(facets.racks).sort((a, b) => a - b), // Numeric Sort
                cols: Array.from(facets.cols).sort((a, b) => a - b)
            },
            data: paginatedData
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };