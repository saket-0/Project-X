const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const loadAllCsvs = async (folderPath) => {
    if (!fs.existsSync(folderPath)) throw new Error(`Data folder missing: ${folderPath}`);
    
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.csv'));
    console.log(`📂 Found ${files.length} CSV files.`);

    const allRows = [];
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        await new Promise((resolve) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => allRows.push(row))
                .on('end', resolve);
        });
    }
    return allRows;
};

module.exports = { loadAllCsvs };