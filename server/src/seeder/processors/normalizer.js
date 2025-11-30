/**
 * server/src/seeder/processors/normalizer.js
 * REDESIGNED: Advanced cleaning for Publishers and Authors to ensure consistency.
 */

// List of common cities/locations to strip from Publisher strings
const LOCATION_BLACKLIST = [
    'NEW DELHI', 'DELHI', 'NEWYORK', 'NEW YORK', 'LONDON', 'CHENNAI', 'MUMBAI', 
    'CALCUTTA', 'KOLKATA', 'BANGALORE', 'BENGALURU', 'HYDERABAD', 'PUNE', 
    'NOIDA', 'GURGAON', 'HARYANA', 'USA', 'UK', 'ENGLAND', 'BOSTON', 'CHICAGO', 
    'CALIFORNIA', 'SINGAPORE', 'JODHPUR', 'JAIPUR', 'ALLAHABAD', 'MEERUT', 
    'AHMEDABAD', 'GENEVA', 'NETHERLAND', 'HEIDELBERG', 'BERLIN', 'TOKYO',
    'OXFORD', 'CAMBRIDGE', 'HOUSTON', 'SANFRANCISCO', 'SAN FRANCISCO', 'WOBURN',
    'WASHINGTON', 'EDINBURGH', 'TRICHURE', 'MARGAO'
];

// List of corporate suffixes to remove to normalize names
const CORP_SUFFIXES = [
    'PVT LTD', 'PVT. LTD.', 'PRIVATE LIMITED', 'PRIVATE LTD', 'PVT.', 
    'LTD', 'LIMITED', 'INC', 'INC.', 'LLC', 'CORP', 'CORPORATION', 
    'COMPANY', 'CO.', '& CO', 'AND CO', 'PUBLISHERS', 'PUBLICATIONS', 
    'PUBLISHING', 'BOOKS', 'PRESS', 'DISTRIBUTORS', 'ENTERPRISES',
    'INTERNATIONAL', 'INDIA', 'GROUP', 'ASSOCIATES'
];

/**
 * Helper to clean Publisher strings
 */
const cleanPublisher = (rawPub) => {
    if (!rawPub) return 'Unknown Publisher';

    let pub = rawPub.toUpperCase().trim();

    // 1. Remove Years (e.g. "2010")
    pub = pub.replace(/\d{4}$/, '').trim();
    pub = pub.replace(/,\s*\d{4}/, '').trim();

    // 2. Remove Cities (Iterative approach)
    // We remove them if they appear at start or end, or after comma
    LOCATION_BLACKLIST.forEach(city => {
        // Remove "CITY, " at start
        if (pub.startsWith(city + ',')) pub = pub.substring(city.length + 1).trim();
        if (pub.startsWith(city + ' ')) pub = pub.substring(city.length + 1).trim();
        // Remove ", CITY" at end
        if (pub.endsWith(', ' + city)) pub = pub.substring(0, pub.length - city.length - 2).trim();
    });

    // 3. Remove Corporate Suffixes (Aggressive normalization)
    // We want "WILEY INDIA PVT LTD" -> "WILEY"
    // We want "TATA MCGRAW HILL EDUCATION" -> "TATA MCGRAW HILL"
    
    // Strategy: Tokenize and remove stopwords
    let tokens = pub.split(/[\s,.-]+/);
    tokens = tokens.filter(t => 
        t.length > 1 && !CORP_SUFFIXES.includes(t) && !LOCATION_BLACKLIST.includes(t)
    );

    // Reassemble
    let cleanName = tokens.join(' ');

    // Fallback: If we stripped everything (e.g. "Publications"), revert to original but trimmed
    if (!cleanName) return rawPub.split(',')[0].trim(); // Return text before first comma

    return cleanName;
};

/**
 * Helper to clean Author strings
 */
const cleanAuthor = (rawAuthor) => {
    if (!rawAuthor) return 'Unknown Author';

    let author = rawAuthor;

    // 1. Remove "By:", "By ", prefixes
    author = author.replace(/^By:?\s*/i, '');

    // 2. Remove "(ED)", "(EDS)", "(EDITOR)" suffixes
    author = author.replace(/\(EDs?\)\.?/gi, '');
    author = author.replace(/\(EDITOR\)/gi, '');

    // 3. Remove Titles (Dr., Prof., Mr.)
    author = author.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '');

    // 4. Handle multiple authors? 
    // Requirement: "1 author should be only there". 
    // We will take the FIRST author if multiple are listed with "&" or ";"
    // This ensures unique identity grouping in facets.
    if (author.includes('&')) author = author.split('&')[0];
    if (author.includes(';')) author = author.split(';')[0];
    if (author.includes(' and ')) author = author.split(' and ')[0];

    // 5. Remove extra spaces and punctuation
    author = author.replace(/\s+/g, ' ').trim();
    
    // 6. Format: "SMITH, JOHN" -> "JOHN SMITH" (Optional, but good for consistency)
    // Check if it matches "WORD, WORD"
    if (/^[A-Z]+,\s*[A-Z]+$/i.test(author)) {
        const parts = author.split(',');
        author = `${parts[1].trim()} ${parts[0].trim()}`;
    }

    return author;
};

const normalizeBook = (book) => {
    let { title, author, publisher, callNumber, location, status } = book;

    // 1. Clean Title
    if (title) {
        title = title.replace(/\s+/g, ' ').trim();
    }

    // 2. Normalize Author
    author = cleanAuthor(author);

    // 3. Normalize Publisher
    publisher = cleanPublisher(publisher);

    // 4. Clean Call Number
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
        status,
        location: location === 'N/A' ? '' : location
    };
};

module.exports = { normalizeBook };