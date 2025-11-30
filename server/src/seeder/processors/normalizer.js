/**
 * server/src/seeder/processors/normalizer.js
 * REDESIGNED: cleans "By:", "Browse shelf", and standardizes text.
 */
const normalizeBook = (book) => {
    let { title, rawAuthor, publisher, callNumber, location, status } = book;

    // 1. Clean Title
    if (title) {
        title = title.replace(/\s+/g, ' ').trim();
    }

    // 2. Clean Author (Remove "By: " prefix)
    let author = rawAuthor || 'Unknown';
    // Regex removes "By:", "By ", and trailing "(ED)" or similar
    author = author.replace(/^By:\s*/i, '')
                   .replace(/\(ED\)$/i, '')
                   .trim();

    // 3. Clean Publisher
    if (publisher) {
        // Extract just the company name if possible, or keep as is
        // Example: "NEW DELHI, MACMILLAN" -> "MACMILLAN" (Optional, currently keeping full)
        publisher = publisher.replace(/\s+/g, ' ').trim();
    }

    // 4. Clean Call Number (Remove garbage text)
    // Example: "620.17 RYD (Browse shelf(Opens below))" -> "620.17 RYD"
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
        author, // formatted author
        publisher,
        callNumber,
        status,
        // Ensure location is valid
        location: location === 'N/A' ? '' : location
    };
};

module.exports = { normalizeBook };