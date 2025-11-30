const Book = require('../../models/Book');

const writeBatch = async (processedBooks) => {
    const ops = processedBooks.map(b => {
        // Compatibility: Pick the first location as the "Main" location for the frontend
        const primaryLocation = b.locations.size > 0 
            ? Array.from(b.locations)[0] 
            : 'N/A';

        return {
            updateOne: {
                filter: { title: b.rawTitle, authors: b.rawAuthor },
                update: {
                    $set: {
                        title: b.metaData.title || b.rawTitle,
                        // Ensure "author" is a string for the frontend
                        author: b.metaData.authors?.[0] || b.rawAuthor,
                        authors: b.metaData.authors || [b.rawAuthor], 
                        description: b.metaData.description || 'No description available.',
                        tags: b.tags,
                        publisher: b.metaData.publisher || '',
                        coverImage: b.metaData.imageLinks?.thumbnail || '',
                        status: 'Available', 
                        
                        // CRITICAL: Save the primary location for shelfUtils parsing
                        location: primaryLocation
                    },
                    $addToSet: { locations: { $each: Array.from(b.locations) } },
                    $inc: { count: b.locations.size },
                    $setOnInsert: {
                        meta: { 
                            source: b.source, 
                            originalId: b.originalId 
                        }
                    }
                },
                upsert: true
            }
        };
    });

    if (ops.length > 0) await Book.bulkWrite(ops);
};

module.exports = { writeBatch };