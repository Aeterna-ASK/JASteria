const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ProcurementPlanView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

const searchItems = `const items = (menu.recipeDetails || []).map(r => {`;
const replaceItems = `const items = (menu.recipeDetails || [])
      .filter(r => r.type === 'organic') // 有機食材のみを対象とする
      .map(r => {`;

if (c.includes(searchItems)) {
  c = c.replace(searchItems, replaceItems);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('Patched ProcurementPlanView.vue to only include organic ingredients');
