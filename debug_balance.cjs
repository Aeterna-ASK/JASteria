const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/<div class="modern-spec-sheet"[^>]*>([\s\S]*?)<!-- 5\. JAS規格フッター -->([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
if (match) {
    const section = match[0];
    const lines = section.split('\n');
    let depth = 0;
    let output = '';
    for (let i=0; i<lines.length; i++) {
        const line = lines[i];
        const o = (line.match(/<div(\s|>)/g) || []).length;
        const c = (line.match(/<\/div>/g) || []).length;
        depth += o - c;
        output += `${i.toString().padStart(3)} | ${depth.toString().padStart(2)} | ${line.trim()}\n`;
    }
    fs.writeFileSync('debug.txt', output, 'utf8');
}
