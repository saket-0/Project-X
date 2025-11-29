const { getBooks } = require('../models/libraryModel');

const searchBooks = async (req, res) => {
    try {
        const allBooks = await getBooks();
        
        // Extract query parameters
        let { page = 1, limit = 20, search = '' } = req.query;
        
        page = parseInt(page);
        limit = parseInt(limit);
        const lowerSearch = search.toLowerCase();

        // 1. Filter
        let filteredBooks = allBooks;
        if (search) {
            filteredBooks = allBooks.filter(book => 
                (book.Title && book.Title.toLowerCase().includes(lowerSearch)) ||
                (book.Author && book.Author.toLowerCase().includes(lowerSearch)) ||
                (book.Pub && book.Pub.toLowerCase().includes(lowerSearch))
            );
        }

        // 2. Paginate
        const totalResults = filteredBooks.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

        res.json({
            meta: {
                totalResults,
                currentPage: page,
                totalPages: Math.ceil(totalResults / limit),
                limit
            },
            data: paginatedBooks
        });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };