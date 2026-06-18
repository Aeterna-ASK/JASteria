const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove RAW NAME
const regexRawName = /\s*<div style="font-size: 0\.6rem; color: red;">RAW NAME: \{\{ menu\.name \}\}<\/div>/g;
content = content.replace(regexRawName, '');

// 2. Disable filter again
const targetFilter = `if (menu.isActiveVersion === false) return false;`;
const replaceFilter = `// if (menu.isActiveVersion === false) return false; // 一時的に全件表示`;
if (content.includes(targetFilter)) {
  content = content.replace(targetFilter, replaceFilter);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully disabled filter and removed RAW NAME.');
