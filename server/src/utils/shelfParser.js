/**
 * shelfParser.js
 * Specialized parser for VIT Library '952' field codes.
 * Extracts Floor, Row, Rack, and Shelf information.
 * Robust: Never returns null.
 */

const parseShelfLocation = (raw952) => {
  // Default Safe Object
  const fallback = {
    raw: 'General Stack',
    floor: 'Unknown',
    row: null,
    rack: null,
    shelf: null,
    fullLocation: 'Check Front Desk',
    isReference: false,
    price: 'N/A'
  };

  // Safety Check: If data is missing or not a string, return default immediately
  if (!raw952 || typeof raw952 !== 'string') {
    return fallback;
  }

  const parts = raw952.split(' ');
  
  // 1. Extract Price & Status
  const isReference = raw952.toLowerCase().includes('not for loan');
  const currencyMatch = raw952.match(/(Rs\.|INR)\s*(\d+(\.\d+)?)/i);
  const price = currencyMatch ? currencyMatch[0] : 'N/A';

  // 2. Extract Location Code (e.g., "IIIF-R9-C6-A")
  const locationRegex = /([IVX]+)F-R(\d+)-C(\d+)-([A-Z0-9]+)/;
  const match = raw952.match(locationRegex);

  if (match) {
    return {
      raw: match[0],
      floor: match[1],         // e.g., "III"
      row: parseInt(match[2]), // e.g., 9
      rack: parseInt(match[3]),// e.g., 6
      shelf: match[4],         // e.g., "A"
      fullLocation: `Floor ${match[1]}, Row ${match[2]}, Rack ${match[3]}`,
      isReference,
      price
    };
  }

  // Return fallback but keep the price/reference info we found
  return {
    ...fallback,
    raw: raw952, // Keep original string for debugging
    isReference,
    price
  };
};

module.exports = { parseShelfLocation };