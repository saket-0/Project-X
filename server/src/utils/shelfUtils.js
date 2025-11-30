/**
 * server/src/utils/shelfUtils.js
 * FIXED: Handles Typos (LLF, LLP) and Flexible Spacing
 * CRASH FIX: Added null checks in comparator to prevent server crash on missing locations
 */

const FLOOR_LABELS = {
    'GD': 'Ground Floor',
    'IF': '1st Floor',
    'IIF': '2nd Floor',
    'IIIF': '3rd Floor',
    'IVF': '4th Floor',
    'STACK': 'Stack Room',
    'REF': 'Reference Section',
    
    // --- FIX FOR DATA TYPOS ---
    'LLF': '2nd Floor',  // Common typo for IIF
    'LLP': '2nd Floor',  // Common typo
    'LIF': '1st Floor',
    '1F': '1st Floor',
    '2F': '2nd Floor'
};

const FLOOR_PRIORITY = {
    'Ground Floor': 0,
    '1st Floor': 1,
    '2nd Floor': 2,
    '3rd Floor': 3,
    '4th Floor': 4,
    'Stack Room': 99,
    'Unknown': 100
};

const parseShelf = (shelfStr) => {
    // Returns NULL if the string is empty or N/A
    if (!shelfStr || shelfStr === 'N/A') return null;

    const cleanStr = shelfStr.trim().toUpperCase();

    // REGEX UPDATE: Allows optional spaces/hyphens
    // Matches: "IIF-R10", "IIF - R10", "LLF R10"
    const regex = /^([A-Z0-9]+)[\s-]*R(\d+)(?:[\s-]*C(\d+))?/;
    const match = cleanStr.match(regex);

    if (match) {
        const rawFloorCode = match[1]; 
        const friendlyFloor = FLOOR_LABELS[rawFloorCode] || 'Unknown'; // Default to Unknown if code not found

        return {
            raw: shelfStr,
            floor: friendlyFloor,
            rack: parseInt(match[2], 10),
            col: match[3] ? parseInt(match[3], 10) : 0,
            floorPriority: FLOOR_PRIORITY[friendlyFloor] || 100
        };
    }

    // Return a valid object even if regex fails (but string exists) to prevent some null errors
    return {
        raw: shelfStr,
        floor: 'Unknown',
        rack: 999,
        col: 0,
        floorPriority: 100
    };
};

/**
 * Comparator to determine which book copy is the "Best" to display.
 * Priority:
 * 1. Status: 'Available' comes before 'Issued'
 * 2. Floor: Ground > 1st > 2nd ...
 * 3. Rack: Lower rack numbers (closer to entrance usually)
 */
const compareBooksByLocation = (a, b) => {
    // 1. Availability Priority
    const isAvailA = a.status && a.status.toLowerCase().includes('available');
    const isAvailB = b.status && b.status.toLowerCase().includes('available');

    if (isAvailA && !isAvailB) return -1; // A comes first
    if (!isAvailA && isAvailB) return 1;  // B comes first

    // 2. Location Parsing (Handle potential NULLs)
    // If parsedLocation exists (from Controller), use it. Otherwise try to parse.
    let locA = a.parsedLocation;
    if (locA === undefined) locA = parseShelf(a.location || a.callNumber);

    let locB = b.parsedLocation;
    if (locB === undefined) locB = parseShelf(b.location || b.callNumber);

    // --- CRASH FIX START --- 
    // If locA is null (no location), push it to the end (B comes first)
    if (!locA && locB) return 1;
    // If locB is null, push it to the end (A comes first)
    if (locA && !locB) return -1;
    // If both are null, they are equal in terms of location
    if (!locA && !locB) return 0;
    // --- CRASH FIX END ---

    // 3. Floor Priority (Lower is better)
    if (locA.floorPriority !== locB.floorPriority) {
        return locA.floorPriority - locB.floorPriority;
    }

    // 4. Rack Priority (Lower is better)
    return locA.rack - locB.rack;
};

module.exports = { parseShelf, compareBooksByLocation, FLOOR_LABELS };