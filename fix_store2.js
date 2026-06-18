import fs from 'fs';

const p = 'C:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Keep first 100 lines as is, but for the rest, remove `let isFirestoreSyncInitialized = false;` and `let isSyncingFromCloud = false;`
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i > 100 && (line.includes('let isFirestoreSyncInitialized = false;') || line.includes('let isSyncingFromCloud = false;'))) {
        continue;
    }
    newLines.push(line);
}

fs.writeFileSync(p, newLines.join('\n'), 'utf8');
console.log("Fixed restaurantStore.js");
