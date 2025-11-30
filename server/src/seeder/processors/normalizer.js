/**
 * server/src/seeder/processors/normalizer.js
 */
const normalizeBook = (book) => {
    // FIX: Destructure 'author' directly (not rawAuthor)
    let { title, author, publisher, callNumber, status } = book;

    // 1. Clean Title
    if (title) {
        title = title.replace(/\s+/g, ' ').trim();
    }

    // 2. Ensure Author exists
    if (!author) {
        author = 'Unknown Author';
    }

    // 3. Clean Publisher
    if (publisher) {
        publisher = publisher.replace(/\s+/g, ' ').trim();
    }

    // 4. Clean Call Number (Remove garbage text like "(Browse shelf)")
    if (callNumber) {
        callNumber = callNumber.split('(')[0].trim();
    }

    // 5. Normalize Status
    if (status) {
        status = status.toLowerCase();
    }

    return {
        ...book,
        title,
        author,
        publisher,
        callNumber,
        status
    };
};

module.exports = { normalizeBook };