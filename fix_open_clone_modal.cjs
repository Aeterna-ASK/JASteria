const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const regexClone = /form\.value = \{\s*name: menu\.name \|\| '',\s*masterName: menu\.masterName \|\| menu\.name,/;
const replaceClone = `form.value = {
    name: menu.name || '',
    masterName: menu.masterName || menu.name,
    groupName: menu.groupName || '',`;

if (regexClone.test(content)) {
  content = content.replace(regexClone, replaceClone);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed openCloneModal');
} else {
  console.log('Could not find openCloneModal form.value');
}
