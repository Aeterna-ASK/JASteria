const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ProcurementPlanView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// 1. Add startYear and modify startMonth
const setupSearch = `const startMonth = ref(6);`;
const setupReplace = `const startYear = ref(new Date().getFullYear());
const startMonth = ref(6);

const availableYears = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({length: 10}, (_, i) => current - 3 + i);
});`;

if (c.includes(setupSearch)) {
  c = c.replace(setupSearch, setupReplace);
}

// 2. Modify months computation
const monthsSearch = `const months = computed(() => {
  const m = [];
  for (let i = 0; i < 12; i++) {
    let currentMonth = startMonth.value + i;
    if (currentMonth > 12) currentMonth -= 12;
    m.push(currentMonth);
  }
  return m;
});`;
const monthsReplace = `const months = computed(() => {
  const m = [];
  let y = startYear.value;
  for (let i = 0; i < 12; i++) {
    let currentMonth = startMonth.value + i;
    let currentYear = y;
    if (currentMonth > 12) {
      currentMonth -= 12;
      currentYear++;
    }
    m.push({
      year: currentYear,
      month: currentMonth,
      label: currentMonth === 1 ? \`\${currentYear}年1月\` : \`\${currentMonth}月\`,
      key: \`\${currentYear}-\${currentMonth}\`
    });
  }
  return m;
});`;

if (c.includes(monthsSearch)) {
  c = c.replace(monthsSearch, monthsReplace);
}

// 3. Modify procurementByMenu items generation
const itemsSearch = `      months.value.forEach(month => {
        let amount = 0;
        if (isMenuTargetMonth(menu, month)) {
          amount = Math.round(monthlyTarget * (r.amount || 0)); // グラム
        }
        row.monthly[month] = amount;
        row.total += amount;
      });`;
const itemsReplace = `      months.value.forEach(m => {
        let amount = 0;
        if (isMenuTargetMonth(menu, m.month)) {
          amount = Math.round(monthlyTarget * (r.amount || 0));
        }
        row.monthly[m.key] = amount;
        row.total += amount;
      });`;

if (c.includes(itemsSearch)) {
  c = c.replace(itemsSearch, itemsReplace);
}

// 4. Modify procurementByIngredient items generation
const ingrInitSearch = `months.value.forEach(m => map[key].monthly[m] = 0);`;
const ingrInitReplace = `months.value.forEach(m => map[key].monthly[m.key] = 0);`;

const ingrAddSearch = `      months.value.forEach(m => {
        map[key].monthly[m] += item.monthly[m];
        map[key].total += item.monthly[m];
      });`;
const ingrAddReplace = `      months.value.forEach(m => {
        map[key].monthly[m.key] += item.monthly[m.key];
        map[key].total += item.monthly[m.key];
      });`;

if (c.includes(ingrInitSearch)) c = c.replace(ingrInitSearch, ingrInitReplace);
if (c.includes(ingrAddSearch)) c = c.replace(ingrAddSearch, ingrAddReplace);

// 5. Update template headers and loops
const templateHtmlSearch1 = `<span class="text-sm font-bold text-gray-600">開始月:</span>`;
const templateHtmlReplace1 = `<span class="text-sm font-bold text-gray-600">開始年月:</span>
            <select v-model="startYear" class="input-organic select-organic" style="padding: 0.3rem 0.5rem; font-size: 0.9rem; margin-right: 0.2rem;">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}年</option>
            </select>`;
if (c.includes(templateHtmlSearch1)) c = c.replace(templateHtmlSearch1, templateHtmlReplace1);

// period text
const periodSearch = `<span>期間: {{ months[0] }}月 〜 {{ months[11] }}月</span>`;
const periodReplace = `<span>期間: {{ months[0].year }}年{{ months[0].month }}月 〜 {{ months[11].year }}年{{ months[11].month }}月</span>`;
if (c.includes(periodSearch)) c = c.replace(periodSearch, periodReplace);

// table headers and cells
c = c.replace(/<th v-for="m in months" :key="m">{{ m }}月<\/th>/g, `<th v-for="m in months" :key="m.key">{{ m.label }}</th>`);
c = c.replace(/<td v-for="m in months" :key="m" class="num-cell">\s*\{\{ item\.monthly\[m\] > 0 \? item\.monthly\[m\]\.toLocaleString\(\) \+ 'g' : '-' \}\}\s*<\/td>/g, `<td v-for="m in months" :key="m.key" class="num-cell">\n                  {{ item.monthly[m.key] > 0 ? item.monthly[m.key].toLocaleString() + 'g' : '-' }}\n                </td>`);
c = c.replace(/<td v-for="m in months" :key="m" class="num-cell">\s*\{\{ item\.monthly\[m\] > 0 \? \(item\.monthly\[m\] \/ 1000\)\.toFixed\(1\) \+ 'kg' : '-' \}\}\s*<\/td>/g, `<td v-for="m in months" :key="m.key" class="num-cell">\n                  {{ item.monthly[m.key] > 0 ? (item.monthly[m.key] / 1000).toFixed(1) + 'kg' : '-' }}\n                </td>`);

// 6. Add global print CSS
const cssPrintAddition = `
  @page {
    size: A4 landscape; /* A4横向き */
    margin: 10mm;
  }
}

/* Print Overrides for full document rendering */
@media print {
  body, html, #app, .app-container, .main-content, .content-container {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    overflow-y: visible !important;
    position: static !important;
    display: block !important;
  }
  .sidebar, .header {
    display: none !important;
  }
}
</style>`;
if (c.includes(`@page {\n    size: A4 landscape; /* A4横向き */\n    margin: 10mm;\n  }\n}\n</style>`)) {
  c = c.replace(`@page {\n    size: A4 landscape; /* A4横向き */\n    margin: 10mm;\n  }\n}\n</style>`, cssPrintAddition);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('ProcurementPlanView updated for year and print bug.');
