const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const simulationResultForModal = computed\(\(\) => \{\s*return restaurantStore\.calculateOrganicRatio\(recipeModalForm\.value\.recipe\);\s*\}\);/g,
  `const simulationResult = computed(() => {
  return restaurantStore.calculateOrganicRatio(form.value.recipe);
});`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed simulationResult in MenusView.vue');
