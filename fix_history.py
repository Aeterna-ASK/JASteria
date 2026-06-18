import re

vue_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
with open(vue_file, 'r', encoding='utf-8') as f:
    vue_text = f.read()

# 1. Update historyVersions
history_pattern = r'const historyVersions = computed\(\(\) => \{\s*if \(!historyMenuMasterName\.value\) return \[\];\s*const target = historyMenuMasterName\.value;\s*// 関連するすべての名前\(masterName, name\)を収集\s*const activeMenusInGroup = decodedMenus\.value\.filter\(m => m\.masterName === target \|\| m\.name === target\);\s*const relatedNames = new Set\(\[target\]\);\s*// 追加の関連名を抽出\(旧バージョンのmasterNameが異なる場合などのリンク付け\)\s*activeMenusInGroup\.forEach\(m => \{\s*if \(m\.masterName\) relatedNames\.add\(m\.masterName\);\s*if \(m\.name\) relatedNames\.add\(m\.name\);\s*\}\);\s*// 名前の一部が一致するものも関連とみなす（バーニャカウダ等）\s*const baseName = target\.replace\(/\\s\*\(第\|No\\\.?\)\\s\*\\d\+.*\|\\s\*\\\(.*\\\).*\*/g, \'\'\)\.trim\(\);\s*return decodedMenus\.value\.filter\(m => \{\s*if \(relatedNames\.has\(m\.masterName\) \|\| relatedNames\.has\(m\.name\)\) return true;\s*// 古い版で名前が少し違うケース\(部分一致\)\s*if \(baseName && m\.name && m\.name\.includes\(baseName\) && \(m\.name\.includes\(\'版\'\) \|\| m\.versionName\)\) return true;\s*if \(baseName && m\.masterName && m\.masterName\.includes\(baseName\)\) return true;\s*return false;\s*\}\)'

def history_repl(m):
    return '''const historyVersions = computed(() => {
  if (!historyMenuMasterName.value) return [];
  const targetName = historyMenuMasterName.value;
  
  const getBaseName = (name) => {
    if (!name) return '';
    // Strip version numbers and parentheses (both half and full width)
    return name.replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*[\\(（].*[\\)）].*/g, '').trim();
  };
  
  const baseName = getBaseName(targetName);

  return decodedMenus.value.filter(m => {
    return getBaseName(m.name) === baseName;
  })'''

vue_text = re.sub(history_pattern, history_repl, vue_text, flags=re.DOTALL)

# 2. Update openHistoryModal call in template
call_pattern = r'openHistoryModal\(menu\.masterName \|\| menu\.name\)'
call_replacement = r'openHistoryModal(menu.name)'
vue_text = re.sub(call_pattern, call_replacement, vue_text)

with open(vue_file, 'w', encoding='utf-8') as f:
    f.write(vue_text)

print("Updated MenusView.vue historyVersions successfully.")
