/**
 * server/src/controllers/bookController.js
 * ROBUST ENGINE: Search > Parse > Filter > GROUP > Paginate
 */
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 
const { groupBooksByTitle } = require('../utils/bookGrouping'); // Import Grouping

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

        if (search) {
            const regex = { $regex: search, $options: 'i' };
            query.$or = [
                { title: regex },
                { author: regex },
                { tags: regex }
            ];
        }

        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }

        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        const filterAuthors = toArray(authors);
        const filterPubs = toArray(pubs);

        if (filterAuthors.length > 0) query.author = { $in: filterAuthors };
        if (filterPubs.length > 0) query.publisher = { $in: filterPubs };

        // --- 2. FETCH DATA ---
        const allMatches = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage description')
            .lean();

        // --- 3. PROCESS LOCATIONS ---
        const processedBooks = allMatches.map(book => {
            const rawLoc = book.location || book.Shelf || book.shelf || book.callNumber || 'N/A';
            return {
                ...book,
                parsedLocation: parseShelf(rawLoc)
            };
        });

        // --- 4. FACETS (Based on processed books) ---
        const facets = {
            authors: new Set(),
            pubs: new Set(),
            floors: new Set(),
            racks: new Set(),
            cols: new Set()
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

        processedBooks.forEach(b => {
            // "Sticky Facets" Logic: Only add Author/Pub if it matches current Location filter
            if (isLocationMatch(b)) {
                if (b.author) facets.authors.add(b.author);
                if (b.publisher) facets.pubs.add(b.publisher);
            }

            // Always show all Floors present in the result set
            if (b.parsedLocation && b.parsedLocation.floor !== 'Unknown') {
                facets.floors.add(b.parsedLocation.floor);
                facets.racks.add(b.parsedLocation.rack);
                facets.cols.add(b.parsedLocation.col);
            }
        });

        // --- 5. FILTER ---
        const filteredBooks = processedBooks.filter(book => isLocationMatch(book));

        // --- 5.5 GROUPING (NEW STEP) ---
        // Combine duplicate copies into single entries
        const groupedBooks = groupBooksByTitle(filteredBooks);

        // --- 6. PAGINATION ---
        const totalResults = groupedBooks.length; // Count Groups, not individual books
        const currentPage = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (currentPage - 1) * limitNum;
        
        // Slice the GROUPED array
        const paginatedData = groupedBooks.slice(startIndex, startIndex + limitNum);

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