const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// Update openHistoryModal to receive the full menu object or just use its groupName
const regexOpen = /const openHistoryModal = \(menuName\) => \{[\s\S]*?historyMenuMasterName\.value = menuName;[\s\S]*?\};/;
const replaceOpen = `const openHistoryModal = (menu) => {
  historyMenuMasterName.value = menu.groupName || menu.name;
  showHistoryModal.value = true;
};`;

if (regexOpen.test(content)) {
  content = content.replace(regexOpen, replaceOpen);
  console.log('Fixed openHistoryModal');
}

// Update the computed property historyVersions
const regexHistory = /const historyVersions = computed\(\(\) => \{[\s\S]*?return decodedMenus\.value\.filter[\s\S]*?\}\);/;
const replaceHistory = `const historyVersions = computed(() => {
  if (!historyMenuMasterName.value) return [];
  const targetGroupName = historyMenuMasterName.value;
  
  return decodedMenus.value.filter(m => {
    const gName = m.groupName || m.name;
    return gName === targetGroupName;
  })
  .sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA || b.id.localeCompare(a.id);
  });
});`;

if (regexHistory.test(content)) {
  content = content.replace(regexHistory, replaceHistory);
  console.log('Fixed historyVersions');
}

// Update the template where openHistoryModal is called
const regexTemplateCall = /@click="openHistoryModal\(menu\.name\)"/g;
const replaceTemplateCall = `@click="openHistoryModal(menu)"`;
content = content.replace(regexTemplateCall, replaceTemplateCall);

fs.writeFileSync(file, content, 'utf8');
