const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const regex = /form\.value = \{\s*name: menu\.name \|\| '',\s*masterName: menu\.masterName \|\| '',/;
const replace = `form.value = {
    name: menu.name || '',
    masterName: menu.masterName || '',
    groupName: menu.groupName || '',`;

if (regex.test(content)) {
  content = content.replace(regex, replace);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully fixed openEditModal with regex');
} else {
  console.log('Regex did not match for openEditModal!');
}
