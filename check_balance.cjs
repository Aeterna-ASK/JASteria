const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/<div class="modern-spec-sheet"[^>]*>([\s\S]*?)<!-- 5\. JAS規格フッター -->([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
if (match) {
    const section = match[0];
    const opens = (section.match(/<div(\s|>)/g) || []).length;
    const closes = (section.match(/<\/div>/g) || []).length;
    console.log('Opens:', opens, 'Closes:', closes);
    
    // Find the exact line number of the missing tag by doing a stack trace of divs
    const lines = section.split('\n');
    let depth = 0;
    for (let i=0; i<lines.length; i++) {
        const o = (lines[i].match(/<div(\s|>)/g) || []).length;
        const c = (lines[i].match(/<\/div>/g) || []).length;
        depth += o - c;
        // console.log(i, depth, lines[i].trim());
    }
    console.log('Final depth:', depth);
} else {
    console.log('Match not found');
}
