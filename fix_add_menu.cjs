const fs = require('fs');

// 1. Fix addMenu in restaurantStore.js
let storeCode = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

storeCode = storeCode.replace(
  /name: menu\.name \|\| '新規メニュー',/,
  `name: menu.name || '新規メニュー',
      masterName: menu.masterName || '',
      groupName: menu.groupName || '',`
);

fs.writeFileSync('src/store/restaurantStore.js', storeCode);

// 2. Add 'archived' filter to MenusView.vue
let menusCode = fs.readFileSync('src/components/MenusView.vue', 'utf8');

// Replace filteredMenus logic
menusCode = menusCode.replace(
  /const filteredMenus = computed\(\(\) => \{\s*return decodedMenus\.value\.filter\(menu => \{\s*\/\/ フィルター適用\s*const achieved = isDeadlinePassed\(menu\.deadline\);\s*if \(filterStatus\.value === 'achieved' && !achieved\) return false;\s*if \(filterStatus\.value === 'active' && achieved\) return false;\s*\/\/ 過去のアーカイブ版・旧バージョンは一覧から隠す\s*if \(menu\.isActiveVersion === false\) return false;\s*return true;\s*\}\);\s*\}\);/,
  `const filteredMenus = computed(() => {
    return decodedMenus.value.filter(menu => {
      // アーカイブタブの場合はアーカイブ済みのものだけを表示
      if (filterStatus.value === 'archived') {
        return menu.isActiveVersion === false;
      }
      
      // それ以外のタブではアーカイブ版は隠す
      if (menu.isActiveVersion === false) return false;
      
      // フィルター適用
      const achieved = isDeadlinePassed(menu.deadline);
      if (filterStatus.value === 'achieved' && !achieved) return false;
      if (filterStatus.value === 'active' && achieved) return false;
      
      return true;
    });
  });`
);

// Add 'archived' tab button
menusCode = menusCode.replace(
  /<button \s*@click="filterStatus = 'achieved'"[\s\S]*?>達成完了<\/button>/,
  `$&
            <button 
              @click="filterStatus = 'archived'" 
              :style="filterStatus === 'archived' ? 'background: #f8fafc; font-weight: 600; color: #0f172a;' : 'background: white; color: #64748b;'"
              style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;"
            >アーカイブ(旧版)</button>`
);

// To fix the old data, we add a quick one-time "Restore" button to the history modal, or just let the user edit the archived ones.
// When editing an archived one, they can check "Active" or just clone it.
// Wait, is there a way to restore? 
// If they edit it and click Save, \`updateMenu\` doesn't automatically change \`isActiveVersion\`.
// Let's add a "復元" button next to "削除" in the history modal, and also on the card if it's archived!
menusCode = menusCode.replace(
  /<button class="btn btn-danger btn-xs" @click="deleteMenu\(menu\.id, menu\.name\)" title="削除">/,
  `<button v-if="menu.isActiveVersion === false" class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #e0f2fe; border-color: #bae6fd; color: #0284c7; padding: 0.25rem 0.5rem; margin-right: 0.5rem;" @click="restaurantStore.updateMenu(menu.id, { isActiveVersion: true })" title="このバージョンを復元して表示リストに戻す">
                <Check :size="14" /> 復元
              </button>
              $&`
);

fs.writeFileSync('src/components/MenusView.vue', menusCode);
console.log('Fixed addMenu and added Archived tab');
