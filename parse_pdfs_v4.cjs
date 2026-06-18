const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/dai72/OneDrive/デスクトップ/オーガニック写真';

async function parsePDFs() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        console.log(`\n========== ${file} ==========`);
        try {
            const dataBuffer = fs.readFileSync(path.join(dir, file));
            const parser = new PDFParse();
            const result = await parser.parseBuffer(dataBuffer);
            // Try to get text
            if (result && result.text) {
                console.log(result.text);
            } else if (result && result.pages) {
                for (const page of result.pages) {
                    console.log(page.text || JSON.stringify(page));
                }
            } else {
                console.log('Result keys:', Object.keys(result));
                console.log(JSON.stringify(result).substring(0, 500));
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
    }
    console.log('\nDone.');
}

parsePDFs();
