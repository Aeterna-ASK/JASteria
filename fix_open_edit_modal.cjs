const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  form.value = {
    name: menu.name || '',
    masterName: menu.masterName || '',`;

const newStr = `  form.value = {
    name: menu.name || '',
    masterName: menu.masterName || '',
    groupName: menu.groupName || '',`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated openEditModal to include groupName');
} else {
  console.log('Target string not found for openEditModal');
}
