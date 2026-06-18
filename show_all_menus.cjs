const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const targetStr1 = `    // 過去のアーカイブ（バージョン）は一覧に表示しない
    if (menu.isActiveVersion === false) return false;`;

const targetStr2 = `    if (menu.isActiveVersion === false) return false;`;

if (content.includes(targetStr1)) {
  content = content.replace(targetStr1, `    // 過去のアーカイブ（バージョン）は一覧に表示しない\n    // if (menu.isActiveVersion === false) return false; // 一時的に全件表示`);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully commented out filter (format 1)');
} else if (content.includes(targetStr2)) {
  content = content.replace(targetStr2, `    // if (menu.isActiveVersion === false) return false; // 一時的に全件表示`);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully commented out filter (format 2)');
} else {
  console.log('Could not find the filter line.');
}
