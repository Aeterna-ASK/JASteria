const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ReceiptsView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// 1. Script changes
const scriptSearch = `const selectedMonth = ref(''); // すべての月`;
const scriptReplace = `const filterStartMonth = ref('');
const filterEndMonth = ref('');`;
if (c.includes(scriptSearch)) {
  c = c.replace(scriptSearch, scriptReplace);
}

const computedSearch = `const matchesMonth = !selectedMonth.value || (rec.date && rec.date.startsWith(selectedMonth.value));`;
const computedReplace = `    const recMonth = rec.date ? rec.date.substring(0, 7) : '';
    let matchesMonth = true;
    if (filterStartMonth.value && recMonth < filterStartMonth.value) matchesMonth = false;
    if (filterEndMonth.value && recMonth > filterEndMonth.value) matchesMonth = false;`;
if (c.includes(computedSearch)) {
  c = c.replace(computedSearch, computedReplace);
}

// 2. HTML changes
const htmlSearch = `<label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub);">🗓 月別表示:</label>
            <select v-model="selectedMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem 2rem 0.35rem 0.75rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer;">
              <option value="">すべての月</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                {{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月
              </option>
            </select>`;
const htmlReplace = `<label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub);">🗓 期間表示:</label>
            <div style="display: flex; gap: 0.5rem; flex: 1;">
              <select v-model="filterStartMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer;">
                <option value="">開始月（指定なし）</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
              <span style="display: flex; align-items: center; color: var(--text-sub);">〜</span>
              <select v-model="filterEndMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer;">
                <option value="">終了月（指定なし）</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
            </div>`;
if (c.includes(htmlSearch)) {
  c = c.replace(htmlSearch, htmlReplace);
}

const clearBtnIfSearch = `v-if="selectedMonth || selectedSupplier || searchQuery || filterType !== 'all'"`;
const clearBtnIfReplace = `v-if="filterStartMonth || filterEndMonth || selectedSupplier || searchQuery || filterType !== 'all'"`;
if (c.includes(clearBtnIfSearch)) {
  c = c.replace(clearBtnIfSearch, clearBtnIfReplace);
}

const clearBtnClickSearch = `@click="selectedMonth = ''; selectedSupplier = ''; searchQuery = ''; filterType = 'all';"`;
const clearBtnClickReplace = `@click="filterStartMonth = ''; filterEndMonth = ''; selectedSupplier = ''; searchQuery = ''; filterType = 'all';"`;
if (c.includes(clearBtnClickSearch)) {
  c = c.replace(clearBtnClickSearch, clearBtnClickReplace);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('ReceiptsView patched to use period filter.');
