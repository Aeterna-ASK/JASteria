const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dir = 'C:/Users/dai72/OneDrive/デスクトップ/オーガニック写真';

async function parsePDFs() {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        console.log(`\n========== ${file} ==========`);
        try {
            const dataBuffer = fs.readFileSync(path.join(dir, file));
            const data = await pdf(dataBuffer);
            console.log(data.text);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
    }
    console.log('\nDone.');
}

parsePDFs();
