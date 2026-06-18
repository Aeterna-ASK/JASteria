const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const regexAdd = /form\.value = \{\s*name: '',\s*masterName: '',/;
const replaceAdd = `form.value = {
    name: '',
    masterName: '',
    groupName: '',`;

if (regexAdd.test(content)) {
  content = content.replace(regexAdd, replaceAdd);
  console.log('Fixed openAddModal');
}

const regexClone = /form\.value = \{\s*name: menu\.name \+ '（コピー）',\s*masterName: menu\.masterName \|\| '',/;
const replaceClone = `form.value = {
    name: menu.name + '（コピー）',
    masterName: menu.masterName || '',
    groupName: menu.groupName || '',`;

if (regexClone.test(content)) {
  content = content.replace(regexClone, replaceClone);
  console.log('Fixed openCloneModal');
} else {
  // Try another regex if the first failed
  const regexClone2 = /form\.value = \{\s*name: `\$\{menu\.name\}（コピー）`,\s*masterName: menu\.masterName \|\| '',/;
  const replaceClone2 = `form.value = {
    name: \`\${menu.name}（コピー）\`,
    masterName: menu.masterName || '',
    groupName: menu.groupName || '',`;
  if (regexClone2.test(content)) {
    content = content.replace(regexClone2, replaceClone2);
    console.log('Fixed openCloneModal (format 2)');
  } else {
    console.log('Could not find openCloneModal form.value');
  }
}

const regexApply = /form\.value\.masterName = refMenu\.masterName \|\| refMenu\.name \|\| '';/;
const replaceApply = `form.value.masterName = refMenu.masterName || refMenu.name || '';
  form.value.groupName = refMenu.groupName || '';`;

if (regexApply.test(content)) {
  content = content.replace(regexApply, replaceApply);
  console.log('Fixed applyReferenceMenu');
}

fs.writeFileSync(file, content, 'utf8');
