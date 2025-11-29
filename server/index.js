const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = 5000;

// Enable CORS so our React frontend can talk to this server
app.use(cors());

const DATA_FOLDER = path.join(__dirname, 'library_data');

// Helper function to read a single CSV file
const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

// The API Endpoint
app.get('/api/books', async (req, res) => {
    try {
        // 1. Scan the directory
        const files = fs.readdirSync(DATA_FOLDER);
        
        // 2. Filter for CSV files only
        const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
        
        console.log(`Found ${csvFiles.length} CSV files to process.`);

        // 3. Read and merge all files
        let allBooks = [];
        for (const file of csvFiles) {
            const filePath = path.join(DATA_FOLDER, file);
            const fileData = await readCsvFile(filePath);
            allBooks = [...allBooks, ...fileData];
        }

        console.log(`Total books loaded: ${allBooks.length}`);
        res.json({ count: allBooks.length, data: allBooks });

    } catch (error) {
        console.error("Error processing files:", error);
        res.status(500).json({ error: "Failed to load library data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});