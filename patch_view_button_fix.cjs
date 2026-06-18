const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'IngredientsView.vue');
let c = fs.readFileSync(file, 'utf8');

const buttonToInsert = `
      <div style="background: #fee2e2; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <p style="margin-bottom: 0.5rem; font-weight: bold; color: #b91c1c;">【システムサポート】仕入れ先の一括変換</p>
        <button @click="runMigration" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; border: none; cursor: pointer;">過去データインポートをAGRI KAKUIDAに変換</button>
      </div>
      
      <div class="table-container">
`;

if (!c.includes('【システムサポート】仕入れ先の一括変換')) {
  c = c.replace('<div class="table-container">', buttonToInsert);
}

fs.writeFileSync(file, c, 'utf8');
console.log('Added manual migration button HTML');
