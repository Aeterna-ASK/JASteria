const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dir = 'C:/Users/dai72/OneDrive/デスクトップ/オーガニック写真';

async function parsePDFs() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    const results = [];
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdf(dataBuffer);
            results.push({
                file,
                text: data.text
            });
            console.log(`Parsed ${file}`);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
    }
    
    fs.writeFileSync('parsed_pdfs.json', JSON.stringify(results, null, 2));
    console.log('Done.');
}

parsePDFs();
