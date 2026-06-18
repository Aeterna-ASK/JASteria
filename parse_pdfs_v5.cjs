const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/dai72/OneDrive/デスクトップ/オーガニック写真';

async function parsePDFs() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        console.log(`\n========== ${file} ==========`);
        try {
            const dataBuffer = fs.readFileSync(path.join(dir, file));
            const uint8 = new Uint8Array(dataBuffer);
            const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
            
            let fullText = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            console.log(fullText);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e.message);
        }
    }
    console.log('\nDone.');
}

parsePDFs();
