const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ReceiptsView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// The exact block to replace
const blockToReplace = `<div class="filter-select-group" style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px;">
            <label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub);">📅 月別表示：</label>
            <select v-model="selectedMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem 2rem 0.35rem 0.75rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer;">
              <option value="">すべての月</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                {{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月
              </option>
            </select>
          </div>`;

const newBlock = `<div class="filter-select-group" style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 300px;">
            <label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub); white-space: nowrap;">🗓 期間表示：</label>
            <div style="display: flex; gap: 0.5rem; flex: 1; min-width: 0;">
              <select v-model="filterStartMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer; min-width: 0;">
                <option value="">開始月</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
              <span style="display: flex; align-items: center; color: var(--text-sub);">〜</span>
              <select v-model="filterEndMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer; min-width: 0;">
                <option value="">終了月</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
            </div>
          </div>`;

if (c.includes('月別表示：')) {
  c = c.replace(blockToReplace, newBlock);
} else {
  console.log('Block not found! Dumping substring around 月別表示');
  const idx = c.indexOf('月別');
  console.log(c.substring(idx - 50, idx + 200));
}

// Since I already changed selectedMonth to filterStartMonth in the script section earlier, I must also make sure I don't leave selectedMonth in the HTML if it exists.
if (c.includes('v-model="selectedMonth"')) {
   c = c.replace(/<select v-model="selectedMonth".*?<\/select>/s, '<!-- REMOVED OLD SELECT -->');
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('HTML patch applied for period filter UI.');
