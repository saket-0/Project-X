/**
 * server/src/seeder/writers/mongoWriter.js
 */
const Book = require('../../models/Book');

const writeBatch = async (processedBooks) => {
    const ops = processedBooks.map(b => {
        
        // Logic to determine the best location string
        // If 'shelf' exists (e.g., "IIF-R3-C4-D"), use it. Otherwise fallback.
        const finalLocation = b.shelf || b.location || 'N/A';

        return {
            updateOne: {
                // Filter by Title and Author to avoid duplicates
                filter: { title: b.title, author: b.author },
                update: {
                    $set: {
                        title: b.title,
                        author: b.author, // This matches the Schema and Mapper now
                        publisher: b.publisher,
                        accessionType: b.accessionType,
                        callNumber: b.callNumber,
                        status: b.status,
                        tags: b.tags || [],
                        coverImage: '', // CSV usually doesn't have images
                        description: b.description,
                        location: finalLocation, // Save the rack/shelf location
                        isbn: b.isbn
                    },
                    // If using 'count' logic (optional):
                    // $inc: { count: 1 } 
                },
                upsert: true
            }
        };
    });

    if (ops.length > 0) await Book.bulkWrite(ops);
};

module.exports = { writeBatch };