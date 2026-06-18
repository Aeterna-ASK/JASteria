const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/dai72/OneDrive/デスクトップ/オーガニック写真';
const outputFile = 'C:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/pdf_extracted_text.txt';

async function parsePDFs() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    
    let output = '';
    for (const file of files) {
        output += `\n\n========== ${file} ==========\n`;
        try {
            const dataBuffer = fs.readFileSync(path.join(dir, file));
            const uint8 = new Uint8Array(dataBuffer);
            const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
            
            for (let i = 1; i <= doc.numPages; i++) {
                output += `\n--- Page ${i} ---\n`;
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                output += pageText + '\n';
            }
        } catch (e) {
            output += `Error: ${e.message}\n`;
        }
    }
    fs.writeFileSync(outputFile, output, 'utf8');
    console.log(`Saved to ${outputFile} (${output.length} chars)`);
}

parsePDFs();
