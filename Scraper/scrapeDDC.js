const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DDC_URL = 'https://en.wikipedia.org/wiki/List_of_Dewey_Decimal_classes';
// This determines where the file is saved. 
// Ideally, save it to your server/src/utils folder as 'classificationMap.js'
const OUTPUT_PATH = path.join(__dirname, 'classificationMap.js'); 

const scrapeDDC = async () => {
    console.log('🕷️  Scraping Dewey Decimal Classes from Wikipedia...');
    
    try {
        // FIX: Added User-Agent header to avoid 403 Forbidden error
        const { data } = await axios.get(DDC_URL, {
            headers: {
                'User-Agent': 'LibraryProjectScraper/1.0 (educational-project; yourname@example.com)' 
            }
        });

        const $ = cheerio.load(data);
        const ddcMap = {};
        let count = 0;

        // Select all list items in the content area
        $('.mw-parser-output ul li').each((i, elem) => {
            const text = $(elem).text().trim();
            
            // Regex to capture "3 Digits" + "Description"
            // Examples: "624 Civil engineering" or "624 – Civil engineering"
            const match = text.match(/^(\d{3})\s+[-–]?\s*(.*)$/);

            if (match) {
                const code = match[1];
                let rawSubject = match[2];

                // Clean up the text (Remove [notes], (parentheses), and "Unassigned")
                rawSubject = rawSubject
                    .replace(/\[.*?\]/g, '') // Remove wiki citations [1]
                    .replace(/\(.*\)/g, '')  // Remove notes
                    .replace(/Unassigned/gi, '')
                    .trim();

                if (rawSubject && rawSubject.length > 2) {
                    // Split complex subjects: "Engineering & allied operations" -> ["Engineering", "Allied Operations"]
                    const keywords = rawSubject
                        .split(/,|&|\//)
                        .map(s => s.trim())
                        .filter(s => s.length > 2 && !s.toLowerCase().includes('general works'));

                    // Add broad category tag based on the hundreds digit
                    // e.g., 624 -> Add "Technology" (since 600 is Technology)
                    if (code.startsWith('6')) keywords.push('Technology');
                    if (code.startsWith('5')) keywords.push('Science');
                    if (code.startsWith('0')) keywords.push('Computer Science');

                    if (keywords.length > 0) {
                        // Use a Set to remove duplicates
                        ddcMap[code] = [...new Set(keywords)];
                        count++;
                    }
                }
            }
        });

        // Format the output as a CommonJS module
        const fileContent = `/**
 * AUTO-GENERATED MAP
 * Source: Wikipedia DDC List
 * Generated: ${new Date().toISOString()}
 */
module.exports = ${JSON.stringify(ddcMap, null, 4)};
`;

        fs.writeFileSync(OUTPUT_PATH, fileContent);
        console.log(`✅ Success! Scraped ${count} codes.`);
        console.log(`db saved to: ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
};

scrapeDDC();