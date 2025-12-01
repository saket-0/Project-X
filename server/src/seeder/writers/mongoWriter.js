const Book = require('../../models/Book');

const writeBatch = async (processedBooks) => {
    if (processedBooks.length === 0) return;

    const ops = processedBooks.map(b => ({
        updateOne: {
            filter: { libraryId: b.id }, // Use Library ID as unique key
            update: {
                $set: {
                    libraryId: b.id,
                    title: b.title,
                    author: b.author,
                    publisher: b.publisher,
                    
                    // Location
                    floor: b.floor,
                    row: b.row,
                    rack: b.rack,
                    shelfCode: b.shelfCode,
                    
                    // Classification
                    callNumber: b.callNumber,
                    isbn: b.isbn,
                    category: b.category,
                    
                    // Status
                    status: b.status,
                    derivedStatus: b.derivedStatus,
                    statusColor: b.statusColor,
                    
                    // Meta
                    tags: b.tags,
                    year: b.year,
                    pages: b.pages,
                    vendor: b.vendor,
                    scrapedAt: b.meta?.scrapedAt
                }
            },
            upsert: true
        }
    }));

    try {
        await Book.bulkWrite(ops);
    } catch (error) {
        console.error("❌ Bulk Write Error:", error.message);
    }
};

module.exports = { writeBatch };