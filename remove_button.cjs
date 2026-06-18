const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'IngredientsView.vue');
let c = fs.readFileSync(file, 'utf8');

const htmlToRemove = `
      <div style="background: #fee2e2; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
        <p style="margin-bottom: 0.5rem; font-weight: bold; color: #b91c1c;">【システムサポート】仕入れ先の一括変換</p>
        <button @click="runMigration" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; border: none; cursor: pointer;">過去データインポートをAGRI KAKUIDAに変換</button>
      </div>
      
`;
c = c.replace(htmlToRemove, '');

const jsToRemove = `
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
c = c.replace(jsToRemove, '');

const hookToRemove = `onMounted(() => {
  // データ移行処理: 有機JAS品 かつ 過去データインポート のものを AGRI KAKUIDA に変更
  let migrated = false;
  restaurantStore.state.ingredients.forEach(ing => {
    if (ing && ing.type === 'organic' && (ing.supplier === '過去データインポート' || (typeof ing.supplier === 'string' && ing.supplier.includes('過去データインポート')))) {
      ing.supplier = 'AGRI KAKUIDA';
      migrated = true;
    }
  });
  if (migrated) {
    restaurantStore.saveStore();
    console.log('Migrated past data to AGRI KAKUIDA');
  }
});`;
const hookOriginal = `onMounted(() => {
  // Ri-Ry-Linkからの自動同期などが必要な場合はここに追加
});`;
if (c.includes(hookToRemove)) {
  c = c.replace(hookToRemove, hookOriginal);
}

fs.writeFileSync(file, c, 'utf8');
console.log('Removed manual migration button and logic');
