import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """const openHistoryModal = (masterName) => {
  console.log("Looking for history of:", masterName);"""

new_str = """const openHistoryModal = (masterName) => {
  console.log("Looking for history of:", masterName);
  const activeMenusInGroup = decodedMenus.value.filter(m => m.masterName === masterName || m.name === masterName);
  console.log("Is active version true for any?:", activeMenusInGroup.some(m => m.isActiveVersion));
  console.log("Active menus missing?:", !decodedMenus.value.some(m => (m.masterName === masterName || m.name === masterName) && m.isActiveVersion));
"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Injected console logging")
else:
    print("Could not find insertion point")
