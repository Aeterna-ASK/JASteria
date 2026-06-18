const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/showModal\.value = true;/g, 'showRecipeModal.value = true;');
content = content.replace(/showModal\.value = false;/g, 'showRecipeModal.value = false;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed showModal -> showRecipeModal in MenusView.vue');
