const Book = require('../../models/Book');

const writeBatch = async (processedBooks) => {
    const ops = processedBooks.map(b => ({
        updateOne: {
            filter: { title: b.rawTitle, authors: b.rawAuthor },
            update: {
                $set: {
                    title: b.metaData.title || b.rawTitle,
                    author: b.metaData.authors?.[0] || b.rawAuthor,
                    description: b.metaData.description || 'No description available.',
                    tags: b.tags,
                    publisher: b.metaData.publisher || '',
                    coverImage: b.metaData.imageLinks?.thumbnail || '',
                    status: 'Available' // Default
                },
                $addToSet: { locations: { $each: Array.from(b.locations) } },
                $inc: { count: b.locations.size }
            },
            upsert: true
        }
    }));

    if (ops.length > 0) await Book.bulkWrite(ops);
};

module.exports = { writeBatch };