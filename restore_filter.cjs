const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `// if (menu.isActiveVersion === false) return false; // 一時的に全件表示`;
const replaceStr = `if (menu.isActiveVersion === false) return false;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully restored the filter');
} else {
  console.log('Target string not found');
}
