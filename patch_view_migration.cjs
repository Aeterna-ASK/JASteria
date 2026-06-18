const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'IngredientsView.vue');
let c = fs.readFileSync(file, 'utf8');

const hookSearch = `onMounted(() => {
  // Ri-Ry-Linkからの自動同期などが必要な場合はここに追加
});`;
const hookReplace = `onMounted(() => {
  // データ移行処理: 有機JAS品 かつ 過去データインポート のものを AGRI KAKUIDA に変更
  let migrated = false;
  restaurantStore.state.ingredients.forEach(ing => {
    if (ing && ing.type === 'organic' && ing.supplier === '過去データインポート') {
      ing.supplier = 'AGRI KAKUIDA';
      migrated = true;
    }
  });
  if (migrated) {
    restaurantStore.saveStore();
    console.log('Migrated past data to AGRI KAKUIDA');
  }
});`;

if (c.includes(hookSearch)) {
  c = c.replace(hookSearch, hookReplace);
}

fs.writeFileSync(file, c, 'utf8');
console.log('Added migration hook to IngredientsView.vue');
