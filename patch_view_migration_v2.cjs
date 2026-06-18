const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'IngredientsView.vue');
let c = fs.readFileSync(file, 'utf8');

const hookSearch = `ing.supplier === '過去データインポート'`;
const hookReplace = `(ing.supplier === '過去データインポート' || (typeof ing.supplier === 'string' && ing.supplier.includes('過去データインポート')))`;

if (c.includes(hookSearch)) {
  c = c.replace(hookSearch, hookReplace);
}

fs.writeFileSync(file, c, 'utf8');
console.log('Updated migration hook');
