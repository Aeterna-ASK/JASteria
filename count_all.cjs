const fs = require('fs');
const { parse } = require('@vue/compiler-sfc');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
const content = fs.readFileSync(file, 'utf8');

let depth = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<template>')) continue;
    if (line.includes('</template>')) break;
    
    // Simple naive count, just to see the trend
    const opens = (line.match(/<div(\s|>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    
    if (depth < 0) {
        console.log(`Negative depth at line ${i + 1}: ${line.trim()}`);
    }
}
console.log('Final depth before </template>:', depth);
