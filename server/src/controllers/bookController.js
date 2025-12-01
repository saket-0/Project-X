/**
 * server/src/controllers/bookController.js
 */
const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); 
const { groupBooksByTitle } = require('../utils/bookGrouping');

// ... (Levenshtein Helper remains the same) ...
const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
};

const searchBooks = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '',
            searchFields = 'title,author,isbn', // UPDATED: Default is multi-field
            exactMatch = 'false',
            availableOnly,
            authors,
            pubs,
            floors,
            racks,
            cols,
            accessionTypes 
        } = req.query;

        // --- 1. BUILD BASE QUERY ---
        let query = {};
        const isExact = exactMatch === 'true';
        const cleanSearch = search.trim();
        const searchRegex = new RegExp(cleanSearch, 'i');
        
        // Convert "title,author" string -> ['title', 'author']
        const targetFields = searchFields.split(',').map(f => f.trim()).filter(Boolean);

        if (cleanSearch) {
            // Construct dynamic $or array based on selected fields
            const orConditions = [];

            targetFields.forEach(field => {
                if (field === 'tags') {
                     orConditions.push({ tags: searchRegex });
                } else if (['title', 'author', 'publisher', 'isbn'].includes(field)) {
                    if (isExact) {
                        orConditions.push({ [field]: cleanSearch });
                    } else {
                        orConditions.push({ [field]: searchRegex });
                    }
                }
            });

            // If user selects nothing, or 'all', or just fallback
            if (orConditions.length > 0) {
                query.$or = orConditions;
            } else {
                // Fallback: Search everywhere
                query.$or = [
                    { title: searchRegex },
                    { author: searchRegex },
                    { isbn: searchRegex }
                ];
            }
        }

        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }

        const toArray = (val) => val ? (Array.isArray(val) ? val : [val]) : [];
        const filterAuthors = toArray(authors);
        const filterPubs = toArray(pubs);
        const filterTypes = toArray(accessionTypes);

        if (filterAuthors.length > 0) query.author = { $in: filterAuthors };
        if (filterPubs.length > 0) query.publisher = { $in: filterPubs };
        if (filterTypes.length > 0) query.accessionType = { $in: filterTypes };

        // --- 2. FETCH DATA ---
        const allMatches = await Book.find(query)
            .select('title author publisher status location shelf callNumber tags coverImage description accessionType isbn')
            .lean();

        // --- 3. PROCESS & RANKING ---
        let processedBooks = allMatches.map(book => {
            const rawLoc = book.location || book.Shelf || book.shelf || book.callNumber || 'N/A';
            
            // Calculate Score
            let score = 0;
            if (cleanSearch && !isExact) {
                const term = cleanSearch.toLowerCase();
                
                // Check match across ALL selected fields to boost score
                targetFields.forEach(field => {
                    let targetVal = '';
                    if (field === 'tags') targetVal = (book.tags || []).join(' ');
                    else targetVal = (book[field] || '').toString();
                    
                    const target = targetVal.toLowerCase();

                    if (target === term) score += 100;
                    else if (target.startsWith(term)) score += 80;
                    else if (target.includes(" " + term + " ")) score += 60;
                    else if (target.includes(term)) score += 40;
                    else if (Math.abs(target.length - term.length) < 3) {
                         const dist = getLevenshteinDistance(target, term);
                         if (dist <= 2) score += 30;
                    }
                });
            }

            return {
                ...book,
                parsedLocation: parseShelf(rawLoc),
                relevanceScore: score
            };
        });

        // SORT BY RANK
        if (cleanSearch && !isExact) {
            processedBooks.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        // --- 4. FACETS ---
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

        processedBooks.forEach(b => {
            if (isLocationMatch(b)) {
                if (b.author) facets.authors.add(b.author);
                if (b.publisher) facets.pubs.add(b.publisher);
                if (b.accessionType) facets.accessionTypes.add(b.accessionType);
            }
            if (b.parsedLocation && b.parsedLocation.floor !== 'Unknown') {
                facets.floors.add(b.parsedLocation.floor);
                facets.racks.add(b.parsedLocation.rack);
                facets.cols.add(b.parsedLocation.col);
            }
        });

        // --- 5. FILTER ---
        const filteredBooks = processedBooks.filter(book => isLocationMatch(book));

        // --- 5.5 GROUPING ---
        const groupedBooks = groupBooksByTitle(filteredBooks);

        // --- 6. PAGINATION ---
        const totalResults = groupedBooks.length;
        const currentPage = parseInt(page);
        const limitNum = parseInt(limit);
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