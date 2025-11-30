const { getBooks } = require('../models/libraryModel');
const { groupBooksByTitle } = require('../utils/bookGrouping');

const searchBooks = async (req, res) => {
    try {
        const allBooks = await getBooks();
        
        // 1. Filter raw data first
        let { page = 1, limit = 20, search = '' } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const lowerSearch = search.toLowerCase();

        let filteredBooks = allBooks;
        if (search) {
            filteredBooks = allBooks.filter(book => 
                (book.Title && book.Title.toLowerCase().includes(lowerSearch)) ||
                (book.Author && book.Author.toLowerCase().includes(lowerSearch))
            );
        }

        // 2. Apply the Grouping Logic (Modularized)
        // This ensures the frontend only receives unique titles
        const groupedBooks = groupBooksByTitle(filteredBooks);

        // 3. Paginate the *Groups* (not the individual rows)
        const totalResults = groupedBooks.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedGroups = groupedBooks.slice(startIndex, endIndex);

        res.json({
            meta: {
                totalResults,
                currentPage: page,
                totalPages: Math.ceil(totalResults / limit),
                limit
            },
            data: paginatedGroups
        });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };