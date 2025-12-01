/**
 * server/src/controllers/bookController.js
 * FIXED: Corrected import from 'shelfUtils' to 'shelfParser'.
 * NOW: Uses 'parseShelfLocation' which actually exists.
 */
const mongoose = require('mongoose');
const Book = require('../models/Book');
// --- FIX: Import from the correct file ---
const { parseShelfLocation } = require('../utils/shelfParser'); 
const { groupBooksByTitle } = require('../utils/bookGrouping');
const { rankBooks } = require('../utils/searchEngine'); 

const getBooks = async (req, res) => {
    try {
        const { 
            page = 1, limit = 50, search = '', 
            availableOnly, authors, pubs, floors, racks, cols, accessionTypes 
        } = req.query;

        // 1. QUERY BUILDER
        let query = {};
        if (availableOnly === 'true') query.status = { $regex: 'available', $options: 'i' };
        
        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        if (authors) query.author = { $in: toArray(authors) };
        if (pubs) query.publisher = { $in: toArray(pubs) };
        if (accessionTypes) query.accessionType = { $in: toArray(accessionTypes) };

        // 2. FETCH DATA
        let processedResults = [];
        const selectFields = '_id libraryId title author publisher status location shelf callNumber tags coverImage description accessionType isbn';

        if (search.trim()) {
            if (!isNaN(search.trim())) {
                const idMatch = await Book.findOne({ libraryId: Number(search.trim()) }).select(selectFields).lean();
                if (idMatch) processedResults = [idMatch];
            }
            if (processedResults.length === 0) {
                const rawBooks = await Book.find(query).select(selectFields).lean();
                processedResults = rankBooks(rawBooks, search.trim(), ['title', 'author'], false);
            }
        } else {
            processedResults = await Book.find(query)
                .sort({ createdAt: -1 })
                .select(selectFields)
                .lean();
            processedResults = processedResults.map(b => ({ ...b, relevanceScore: 0 }));
        }

        // 3. PROCESSING
        const booksWithLocation = processedResults.map(book => ({
            ...book,
            // --- FIX: Use the correct function name ---
            parsedLocation: parseShelfLocation(book.location || book.shelf || book.callNumber || 'N/A')
        }));

        const { facets, finalFilteredData } = applyLocationFiltersAndFacets(booksWithLocation, floors, racks, cols);
        const groupedBooks = groupBooksByTitle(finalFilteredData);

        // 4. ID RESTORATION
        const robustData = groupedBooks.map(group => {
            if (group._id) return group;
            if (group.variants && group.variants.length > 0) return { ...group, _id: group.variants[0]._id };
            return { ...group, _id: `temp_${Math.random().toString(36).substr(2, 9)}` };
        });

        // 5. PAGINATION
        const totalResults = robustData.length;
        const limitNum = parseInt(limit);
        const currentPage = parseInt(page);
        const startIndex = (currentPage - 1) * limitNum;
        const paginatedData = robustData.slice(startIndex, startIndex + limitNum);

        res.json({
            meta: { totalResults, currentPage, totalPages: Math.ceil(totalResults / limitNum) },
            facets, 
            data: paginatedData
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getBookById = async (req, res) => {
    const { id } = req.params;
    try {
        let book = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            book = await Book.findById(id);
        } else if (!isNaN(id)) {
            book = await Book.findOne({ libraryId: Number(id) });
        }

        if (!book) return res.status(404).json({ success: false, message: "Book not found" });

        const bookObj = book.toObject();
        // --- FIX: Use the correct function name ---
        bookObj.parsedLocation = parseShelfLocation(bookObj.location || bookObj.shelf || 'N/A');
        
        res.json({ success: true, data: bookObj });
    } catch (error) {
        console.error("Detail Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const applyLocationFiltersAndFacets = (books, floors, racks, cols) => {
    const facets = { authors: new Set(), pubs: new Set(), floors: new Set(), racks: new Set(), cols: new Set(), accessionTypes: new Set() };
    const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
    const selectedFloors = toArray(floors);
    const selectedRacks = toArray(racks);

    const filtered = books.filter(book => {
        if (selectedFloors.length > 0 && (!book.parsedLocation || !selectedFloors.includes(book.parsedLocation.floor))) return false;
        if (selectedRacks.length > 0 && (!book.parsedLocation || !selectedRacks.includes(String(book.parsedLocation.rack)))) return false;
        
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