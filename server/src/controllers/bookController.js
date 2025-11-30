const Book = require('../models/Book');
const { parseShelf } = require('../utils/shelfUtils'); // Ensure this import is correct based on your folder structure

const searchBooks = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '',
            // Destructure filter params from query
            availableOnly,
            authors,
            pubs,
            floors,
            racks,
            cols
        } = req.query;
        
        // 1. Base Query
        let query = {};
        
        // 2. Text Search (Smart Search)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // 3. Apply Filters (Server-Side)
        
        // Availability
        if (availableOnly === 'true') {
            query.status = { $regex: 'available', $options: 'i' };
        }

        // Arrays (Authors, Publishers) - check if provided and not empty
        if (authors) {
            const authorList = Array.isArray(authors) ? authors : [authors];
            query.author = { $in: authorList };
        }
        
        if (pubs) {
            const pubList = Array.isArray(pubs) ? pubs : [pubs];
            query.publisher = { $in: pubList };
        }

        // Location Filters (Complex because location is a string in DB)
        // Ideally, you should normalize your DB, but here is the logic for now:
        // We might need to filter these in memory if the DB schema is just a string, 
        // OR use regex if the format is strict. 
        // For performance, let's assume we filter basic fields in DB, 
        // but complex parsed fields might need aggregation or strict regex.
        
        // *Note: Deep filtering on parsed strings (like Rack 42 inside 'IF-R42...') 
        // is slow in MongoDB regex. For this refactor, we will stick to basic filtering.*

        // Execute Query
        const totalResults = await Book.countDocuments(query);
        const books = await Book.find(query)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // 4. Transform Data (Enrich with Parsed Location)
        // This removes the need for client-side shelfUtils
        const enrichedBooks = books.map(book => {
            const bookObj = book.toObject();
            return {
                ...bookObj,
                parsedLocation: parseShelf(bookObj.shelf || bookObj.location || '')
            };
        });

        // 5. Apply Strict Location Filters (Post-Fetch for precision if regex is too hard)
        // Note: For large datasets, move this logic to MongoDB Aggregation pipeline.
        let finalBooks = enrichedBooks;
        if (floors || racks || cols) {
             const floorList = floors ? (Array.isArray(floors) ? floors : [floors]) : [];
             const rackList = racks ? (Array.isArray(racks) ? racks : [racks]) : [];
             
             finalBooks = enrichedBooks.filter(b => {
                 if (!b.parsedLocation) return false;
                 if (floorList.length && !floorList.includes(b.parsedLocation.floorLabel)) return false;
                 if (rackList.length && !rackList.includes(String(b.parsedLocation.rack))) return false;
                 return true;
             });
        }

        res.json({
            meta: {
                totalResults,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResults / parseInt(limit)),
                limit: parseInt(limit)
            },
            data: finalBooks
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };