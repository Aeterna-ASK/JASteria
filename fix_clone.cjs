const fs = require('fs');

let code = fs.readFileSync('src/components/MenusView.vue', 'utf8');

// Replace openCloneModal to include clonedFromId
code = code.replace(
  /form\.value = \{\s*name: menu\.name \|\| '',\s*masterName: menu\.masterName \|\| menu\.name,/,
  `form.value = {
    clonedFromId: menu.id,
    name: menu.name || '',
    masterName: menu.masterName || menu.name,`
);

// Replace saveMenu to update old menu
code = code.replace(
  /const saveMenu = async \(\) => \{\s*try \{\s*if \(isEditing\.value\) \{\s*await restaurantStore\.updateMenu\(currentId\.value, form\.value\);\s*\} else \{\s*await restaurantStore\.addMenu\(form\.value\);\s*\}/,
  `const saveMenu = async () => {
  try {
    if (isEditing.value) {
      await restaurantStore.updateMenu(currentId.value, form.value);
    } else {
      await restaurantStore.addMenu(form.value);
      if (form.value.clonedFromId) {
        await restaurantStore.updateMenu(form.value.clonedFromId, { isActiveVersion: false });
      }
    }`
);

fs.writeFileSync('src/components/MenusView.vue', code);
console.log('Fixed clone logic to archive the source menu.');
