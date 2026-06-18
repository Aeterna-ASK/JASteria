const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

const searchStr = `const openAddModal = () => {`;
const replaceStr = `const applyReferenceMenu = () => {
  if (!referenceMenuId.value) return;
  const refMenu = state.menus.find(m => m.id === referenceMenuId.value);
  if (!refMenu) return;
  
  form.value.name = refMenu.name || '';
  form.value.masterName = refMenu.masterName || refMenu.name || '';
  form.value.price = refMenu.price || 0;
  form.value.description = refMenu.description || '';
  form.value.category = refMenu.category || '有機料理スペック';
  form.value.cookingInstructions = refMenu.cookingInstructions || '';
  form.value.recipe = refMenu.recipe ? refMenu.recipe.map(r => ({...r})) : [];
  form.value.isOrganicClaim = refMenu.isOrganicClaim !== undefined ? refMenu.isOrganicClaim : true;
  form.value.changeDetails = refMenu.changeDetails || '';
  form.value.courseTargetNum = refMenu.courseTargetNum || '';
  form.value.singleTargetNum = refMenu.singleTargetNum || '';
  form.value.displayPeriod = refMenu.displayPeriod || '通年';
  form.value.displayMethod = refMenu.displayMethod || 'メニューに掲載';
  form.value.displayStyle = refMenu.displayStyle || '記号により表示';
  form.value.remarks = refMenu.remarks || '';
};

const openAddModal = () => {`;

if (c.includes(searchStr)) {
    c = c.replace(searchStr, replaceStr);
    fs.writeFileSync(targetPath, c, 'utf8');
    console.log('Added applyReferenceMenu function.');
} else {
    console.log('Search string not found in MenusView.vue');
}
