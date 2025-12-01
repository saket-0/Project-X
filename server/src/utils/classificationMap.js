/**
 * classificationMap.js
 * Logic wrapper for the user-provided DDC System.
 * Imports raw codes from 'ddcCodes.js'
 */

const ddcData = require('./ddcCodes'); // Importing your file

const getCategoryDetails = (callNumber) => {
    if (!callNumber) return null;
    
    // 1. Clean the Call Number (e.g., "621.38 DAV" -> "621")
    // We look for the first 3 digits found in the string.
    const match = callNumber.match(/(\d{3})/);
    
    if (!match) return null;
    
    const code = match[1]; // e.g., "621"
    
    // 2. Lookup Strategy
    // Strategy A: Exact Match (e.g., "621")
    if (ddcData[code]) {
        return processResult(ddcData[code]);
    }

    // Strategy B: Decade Match (e.g., "620")
    const decade = code.substring(0, 2) + '0';
    if (ddcData[decade]) {
        return processResult(ddcData[decade]);
    }

    // Strategy C: Century Match (e.g., "600")
    const century = code.substring(0, 1) + '00';
    if (ddcData[century]) {
        return processResult(ddcData[century]);
    }

    return null;
};

// Helper: Your file returns arrays like ["Topic", "Subtopic"].
// We need to pick the best one for a Main Category.
const processResult = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;

    // Usually the first item is the most specific/accurate description
    const primary = dataArray[0];

    // Filter out "Computer Science" if it appears as a duplicate noise (based on your snippet)
    // unless the code actually IS Computer Science (004-006)
    const tags = dataArray.filter(t => t && t.trim() !== '');

    return {
        primaryCategory: primary,
        allTags: tags
    };
};

module.exports = { getCategoryDetails };