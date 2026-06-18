const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace menusByYear computed
const oldMenusByYear = `const menusByYear = computed(() => {
  const grouped = {};
  decodedMenus.value.forEach(menu => {
    // tB^[Kp
    const achieved = isDeadlinePassed(menu.deadline);
    if (filterStatus.value === 'achieved' && !achieved) return;
    if (filterStatus.value === 'active' && achieved) return;
    
    // ߋ̃A[JCuŁio[Wj͈ꗗB
    if (menu.isActiveVersion === false) return;

    const year = menu.year || 'o^NxȂ';
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(menu);
  });
  // ~Ń\[giVNxɗj
  return Object.fromEntries(Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])));
});`;

const newMenusList = `const filteredMenus = computed(() => {
  return decodedMenus.value.filter(menu => {
    // フィルター適用
    const achieved = isDeadlinePassed(menu.deadline);
    if (filterStatus.value === 'achieved' && !achieved) return false;
    if (filterStatus.value === 'active' && achieved) return false;
    
    // 過去のアーカイブ版（旧バージョン）は一覧から隠す
    if (menu.isActiveVersion === false) return false;
    
    return true;
  });
});`;

// We use regex to replace menusByYear in a more stable way.
content = content.replace(/const menusByYear = computed\(\(\) => \{[\s\S]*?\}\);\s*/, newMenusList + '\n\n');

// Also remove `expandedYears`, `isYearExpanded`, `toggleYearFolder`
content = content.replace(/\/\/ 年度ごとのフォルダ開閉状態[\s\S]*?toggleYearFolder = [\s\S]*?\}\n\};\n/, '');

// Replace `watch(menusByYear, ...)` with `watch(filteredMenus, ...)` if exists, or remove.
content = content.replace(/watch\(menusByYear, \(\) => \{\}, \{ immediate: true \}\);\s*/, '');

// Now replace the template structure.
const oldTemplate = `<div v-for="(menus, year) in menusByYear" :key="year" class="year-section mb-6" style="background: white; border: 1.5px solid #ebdcd0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
      <!-- フォルダヘッダー (クリックで開閉) -->
      <div 
        @click="toggleYearFolder(year)" 
        class="year-folder-header flex items-center justify-between no-print" 
        style="background: linear-gradient(to right, #faf8f5, #f5f0e8); padding: 0.85rem 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: background 0.2s; border-bottom: 1px solid #ebdcd0;"
      >
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.6rem; line-height: 1;">{{ isYearExpanded(year) ? '📂' : '📁' }}</span>
          <div style="display: flex; flex-direction: column; text-align: left;">
            <h3 class="year-header font-bold" style="margin: 0; font-size: 1.05rem; font-weight: bold; color: #5c3d2e; border: none; padding: 0;">
              {{ year === '登録年度なし' ? '登録年度なし' : \`\${year}年度\` }} のスペック管理票
            </h3>
            <span style="font-size: 0.725rem; color: #8c786c; font-weight: 500; margin-top: 2px;">合計: {{ menus.length }}件の有機メニューが格納されています</span>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; font-size: 0.8rem; color: #801c15;">
          <span>{{ isYearExpanded(year) ? 'フォルダを閉じる ➖' : 'フォルダを開く ➕' }}</span>
        </div>
      </div>

      <div v-show="isYearExpanded(year)" class="menu-grid mb-6 no-print" style="padding: 1.25rem; background: #faf9f6; margin-bottom: 0 !important; gap: 1.25rem;">
        <div
          v-for="menu in menus"`;

const newTemplate = `<div class="menu-grid mb-6 no-print" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
        <div
          v-for="menu in filteredMenus"`;

// Since there is a chance the encoding characters are messed up in the regex, we will use a more robust regex.
content = content.replace(/<div v-for="\(menus, year\) in menusByYear"[\s\S]*?<div\s+v-for="menu in menus"/, newTemplate);

// Need to remove the two closing div tags that were part of the year-section.
// Let's do it manually via regex: find `</div>\n      </div>\n    </div>` right before `<!-- 統合型`
content = content.replace(/<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<!-- 統合型/, '</div>\n\n    <!-- 統合型');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed year folders from MenusView.vue');
