const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Streams a JSONL file and yields parsed objects one by one.
 * Usage: for await (const record of loadJsonl(filePath)) { ... }
 */
async function* loadJsonl(filePath) {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
    }

    const fileStream = fs.createReadStream(absolutePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            yield JSON.parse(line);
        } catch (err) {
            console.warn("Skipping malformed JSON line");
        }
    }
}

module.exports = { loadJsonl };