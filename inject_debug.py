import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# We want to inject a small console.log to print the menus when the history modal opens
old_str = """const openHistoryModal = (masterName) => {
  historyMenuMasterName.value = masterName;
  showHistoryModal.value = true;
};"""

new_str = """const openHistoryModal = (masterName) => {
  console.log("Looking for history of:", masterName);
  const allRelated = decodedMenus.value.filter(m => (m.masterName || m.name).includes("バーニャカウダ"));
  console.log("All related menus in DB:", allRelated.map(m => ({ name: m.name, masterName: m.masterName, version: m.versionName, id: m.id })));
  
  historyMenuMasterName.value = masterName;
  showHistoryModal.value = true;
};"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Injected console.log successfully")
else:
    print("Could not find openHistoryModal")
