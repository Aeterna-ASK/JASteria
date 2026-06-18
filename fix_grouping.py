import re

# 1. Update restaurantStore.js
store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Change flag from excelDataMenuVersionsV1 to excelDataMenuVersionsV2
store_text = store_text.replace('excelDataMenuVersionsV1', 'excelDataMenuVersionsV2')

# Update migrateMenuVersions logic
migrate_pattern = r'const groups = \{\};\s*state\.menus\.forEach\(menu => \{\s*const master = menu\.masterName \|\| menu\.name;\s*// ensure masterName is populated\s*if \(!menu\.masterName\) \{\s*menu\.masterName = master;\s*modified = true;\s*\}\s*if \(!groups\[master\]\) \{\s*groups\[master\] = \[\];\s*\}\s*groups\[master\]\.push\(menu\);\s*\}\);'

# Using a function as repl to avoid escaping issues
def migrate_repl(m):
    return '''const groups = {};
  state.menus.forEach(menu => {
    // ensure masterName is populated
    if (!menu.masterName) {
       menu.masterName = menu.name;
       modified = true;
    }
    
    // Group strictly by base name to avoid merging distinct recipes that share a masterName category
    const baseName = (menu.name || '').replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*\\(.*\\).*/g, '').trim();
    const groupKey = baseName || menu.id;
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(menu);
  });'''

store_text = re.sub(migrate_pattern, migrate_repl, store_text, flags=re.DOTALL)

with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

# 2. Update MenusView.vue
vue_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
with open(vue_file, 'r', encoding='utf-8') as f:
    vue_text = f.read()

# Update getGroupedMenus
grouped_pattern = r'const getGroupedMenus = \(\) => \{\s*if \(!historyMenuMasterName\.value\) return \[\];\s*const target = historyMenuMasterName\.value;\s*// 関連するすべての名前\(masterName, name\)を収集\s*const activeMenusInGroup = decodedMenus\.value\.filter\(m => m\.masterName === target \|\| m\.name === target\);\s*const relatedNames = new Set\(\[target\]\);\s*// 追加の関連名を抽出\(旧バージョンのmasterNameが異なる場合などのリンク付け\)\s*activeMenusInGroup\.forEach\(m => \{\s*if \(m\.masterName\) relatedNames\.add\(m\.masterName\);\s*if \(m\.name\) relatedNames\.add\(m\.name\);\s*\}\);\s*// 名前の一部が一致するものも関連とみなす（バーニャカウダ等）\s*const baseName = target\.replace\(/\\s\*\(第\|No\\\.?\)\\s\*\\d\+.*\|\\s\*\\\(.*\\\).*\*/g, \'\'\)\.trim\(\);\s*return decodedMenus\.value\.filter\(m => \{\s*if \(relatedNames\.has\(m\.masterName\) \|\| relatedNames\.has\(m\.name\)\) return true;\s*// 古い版で名前が少し違うケース\(部分一致\)\s*if \(baseName && m\.name && m\.name\.includes\(baseName\) && \(m\.name\.includes\(\'版\'\) \|\| m\.versionName\)\) return true;\s*if \(baseName && m\.masterName && m\.masterName\.includes\(baseName\)\) return true;\s*return false;\s*\}\)'

def grouped_repl(m):
    return '''const getGroupedMenus = () => {
  if (!historyMenuMasterName.value) return [];
  const targetName = historyMenuMasterName.value; // Actually passed as menu.name
  
  const baseName = targetName.replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*\\(.*\\).*/g, '').trim();

  return decodedMenus.value.filter(m => {
    const mBase = (m.name || '').replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*\\(.*\\).*/g, '').trim();
    return mBase === baseName;
  })'''

vue_text = re.sub(grouped_pattern, grouped_repl, vue_text, flags=re.DOTALL)

# Update openHistoryModal call to pass menu.name instead of masterName
open_history_pattern = r'const openHistoryModal = \(masterName\) => \{\s*historyMenuMasterName\.value = masterName;'
open_history_replacement = r'''const openHistoryModal = (menuName) => {
  historyMenuMasterName.value = menuName;'''
vue_text = re.sub(open_history_pattern, open_history_replacement, vue_text)

# Also find where openHistoryModal is called in template
# It's called like: @click="openHistoryModal(menu.masterName || menu.name)"
call_pattern = r'openHistoryModal\(menu\.masterName \|\| menu\.name\)'
call_replacement = r'openHistoryModal(menu.name)'
vue_text = re.sub(call_pattern, call_replacement, vue_text)

with open(vue_file, 'w', encoding='utf-8') as f:
    f.write(vue_text)

print("Updated grouping logic successfully.")
