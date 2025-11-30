const Book = require('../models/Book'); // Import your new model

const searchBooks = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        
        let query = {};
        
        // The Smart Search Logic
        if (search) {
            query = { 
                $or: [
                    // Standard: Search Title
                    { title: { $regex: search, $options: 'i' } },
                    // Standard: Search Author
                    { author: { $regex: search, $options: 'i' } },
                    // SMART: Search the TAGS array we just generated
                    { tags: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Execute Query on MongoDB
        const books = await Book.find(query)
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const totalResults = await Book.countDocuments(query);

        res.json({
            meta: {
                totalResults,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResults / parseInt(limit)),
                limit: parseInt(limit)
            },
            data: books
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { searchBooks };