const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ProcurementPlanView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

const filterSearch = `}).filter(m => m.items.length > 0 && m.annualTarget > 0);`;
const filterReplace = `}).filter(m => {
    // レシピが無い、または目標が0のものは除外
    if (m.items.length === 0 || m.annualTarget <= 0) return false;
    // 選択された1年間（期間内）において、必要量が1gでも存在するか確認
    // （すべてハイフン＝期間外の場合はトータルが0になる）
    const totalRequiredInPeriod = m.items.reduce((sum, item) => sum + item.total, 0);
    return totalRequiredInPeriod > 0; // 期間内のレシピのみ表示
  });`;

if (c.includes(filterSearch)) {
  c = c.replace(filterSearch, filterReplace);
} else {
  console.log("Could not find the target string.");
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('ProcurementPlanView patched to filter out inactive menus.');
