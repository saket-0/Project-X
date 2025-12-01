/**
 * enricher.js
 * Enhances the normalized book data with derived intelligence.
 * Calculates 'Real-time Status', 'Vendor' details, and 'Smart Tags'.
 */

const enrichBook = (book) => {
    const enriched = { ...book };
    const now = new Date();

    // --- 1. Deep Status Logic ---
    // The 952 field often contains a due date like "2025-06-13" if checked out.
    // We look for a date in the future within the raw 952 string.
    const datePattern = /(\d{4}-\d{2}-\d{2})/;
    const datesFound = book.shelfCode.match(new RegExp(datePattern, 'g')) || [];
    
    let isCheckedOut = false;
    let dueDate = null;

    datesFound.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        if (dateObj > now) {
            isCheckedOut = true;
            dueDate = dateStr;
        }
    });

    if (enriched.status === 'Reference') {
        enriched.derivedStatus = 'Reference';
        enriched.statusColor = 'red';
    } else if (isCheckedOut) {
        enriched.derivedStatus = `Due: ${dueDate}`;
        enriched.statusColor = 'orange';
    } else {
        enriched.derivedStatus = 'Available';
        enriched.statusColor = 'green';
    }

    // --- 2. Smart Tagging ---
    enriched.tags = [];
    
    // Tag: New Arrival (if acquired in last 2 years - analyzing accession date if avail)
    // For now, we use the scraped_at or publication year as proxy for "Freshness"
    const pubYear = parseInt(book.year);
    if (pubYear && pubYear >= 2024) {
        enriched.tags.push('New Arrival');
    }

    // Tag: Classic / Vintage
    if (pubYear && pubYear < 1980) {
        enriched.tags.push('Vintage');
    }

    // Tag: Textbook (based on Call Number 600-699 for Engineering/Tech)
    if (book.callNumber.startsWith('6')) {
        enriched.tags.push('Engineering');
    }

    return enriched;
};

module.exports = { enrichBook };