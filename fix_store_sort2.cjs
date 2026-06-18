const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

// The line we want to replace
const target1 = `const numA = getNum(a.name);`;
const replace1 = `const numA = getNum(a.versionName || a.name);`;
content = content.replace(new RegExp(target1.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&'), 'g'), replace1);

const target2 = `const numB = getNum(b.name);`;
const replace2 = `const numB = getNum(b.versionName || b.name);`;
content = content.replace(new RegExp(target2.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&'), 'g'), replace2);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully fixed store sorting to use versionName.");
