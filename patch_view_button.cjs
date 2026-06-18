const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'IngredientsView.vue');
let c = fs.readFileSync(file, 'utf8');

const buttonToInsert = `
      <div style="background: #fee2e2; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <p style="margin-bottom: 0.5rem; font-weight: bold; color: #b91c1c;">【システムサポート】仕入れ先の一括変換</p>
        <button @click="runMigration" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold;">過去データインポートをAGRI KAKUIDAに変換</button>
      </div>
      
      <div class="table-container card">
`;

if (!c.includes('runMigration')) {
  c = c.replace('<div class="table-container card">', buttonToInsert);
  
  const functionToInsert = `
const runMigration = () => {
  let count = 0;
  state.ingredients.forEach(ing => {
    if (ing.type === 'organic' && typeof ing.supplier === 'string' && ing.supplier.includes('過去データインポート')) {
      restaurantStore.updateIngredient(ing.id, { supplier: 'AGRI KAKUIDA' });
      count++;
    }
  });
  alert(count + '件のデータを変換しました。');
};
`;
  c = c.replace('const isAuthenticating = ref(false);', 'const isAuthenticating = ref(false);\n' + functionToInsert);
}

fs.writeFileSync(file, c, 'utf8');
console.log('Added manual migration button');
