/**
 * server/src/controllers/bookController.js
 * ROBUST ENGINE: Handles Search, Filtering, and Facet Generation
 * FIXED: 'Cross-Reactivity' - Authors/Pubs now react to Location filters
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
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        const filterAuthors = toArray(authors);
        const filterPubs = toArray(pubs);

        if (filterAuthors.length > 0) query.author = { $in: filterAuthors };
        if (filterPubs.length > 0) query.publisher = { $in: filterPubs };

        // --- 2. FETCH ALL MATCHING DOCUMENTS (Lightweight) ---
        const allMatches = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage')
            .lean();

        // --- 3. PROCESS & PARSE LOCATIONS ---
        const processedBooks = allMatches.map(book => {
            const rawLoc = book.location || book.Shelf || book.shelf || book.callNumber || 'N/A';
            return {
                ...book,
                parsedLocation: parseShelf(rawLoc)
            };
        });

        // --- PREPARE LOCATION FILTERS (MOVED UP) ---
        // We define the location matching logic here so we can use it during Facet Generation
        const selectedFloors = toArray(floors);
        const selectedRacks = toArray(racks); 
        const selectedCols = toArray(cols);

        const isLocationMatch = (book) => {
            // If no location filters are active, everything matches
            if (selectedFloors.length === 0 && selectedRacks.length === 0 && selectedCols.length === 0) return true;
            
            if (!book.parsedLocation) return false;

            // Check Floor
            if (selectedFloors.length > 0 && !selectedFloors.includes(book.parsedLocation.floor)) return false;
            
            // Check Rack
            if (selectedRacks.length > 0 && !selectedRacks.includes(String(book.parsedLocation.rack))) return false;

            // Check Col (if needed)
            if (selectedCols.length > 0 && !selectedCols.includes(String(book.parsedLocation.col))) return false;

            return true;
        };

        // --- 4. CALCULATE FACETS (Dynamic Filter Options) ---
        const facets = {
            authors: new Set(),
            pubs: new Set(),
            floors: new Set(),
            racks: new Set(),
            cols: new Set()
        };

        processedBooks.forEach(b => {
            // --- FIX START: REACTIVITY ---
            // Only add Authors and Publishers if the book MATCHES the selected Location.
            // This ensures if you select "Floor 2", you only see Authors on Floor 2.
            if (isLocationMatch(b)) {
                if (b.author) facets.authors.add(b.author);
                if (b.publisher) facets.pubs.add(b.publisher);
            }
            // --- FIX END ---

            // For Locations (Floors/Racks), we generally want to see all options 
            // available within the current Author/Pub search (which is already filtered by DB query).
            // We do NOT restrict this by `isLocationMatch` because we want to see siblings
            // (e.g. if I select Floor 2, I still want to see Floor 1 in the list).
            // Note: The frontend "Sticky Facets" will handle the visual selection state.
            if (b.parsedLocation && 
                b.parsedLocation.floor !== 'N/A' && 
                b.parsedLocation.floor !== 'Unknown') {
                
                facets.floors.add(b.parsedLocation.floor);
                facets.racks.add(b.parsedLocation.rack);
                facets.cols.add(b.parsedLocation.col);
            }
        });

        // --- 5. APPLY LOCATION FILTERS (The "Side Filter" Logic) ---
        const filteredBooks = processedBooks.filter(book => isLocationMatch(book));

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