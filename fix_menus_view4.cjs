const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// The replacement should be done by regex to avoid minor whitespace or encoding issues
const openCloneMatch = c.match(/const openCloneModal = \(menu\) => \{[\s\S]*?showRecipeModal\.value = true;/);

if (openCloneMatch) {
    let block = openCloneMatch[0];
    
    // Add missing properties if they don't exist
    if (!block.includes('cookingInstructions:')) {
        block = block.replace(/singleTargetNum: menu\.singleTargetNum \|\| '[^']*',/, 
            `singleTargetNum: menu.singleTargetNum || '年間60食',
    displayPeriod: menu.displayPeriod || '通年',
    displayMethod: menu.displayMethod || 'メニューに掲載',
    displayStyle: menu.displayStyle || '記号により表示',
    cookingInstructions: menu.cookingInstructions || '',
    remarks: menu.remarks || '',
    imageUrl: menu.imageUrl || '',
    sampleImageUrl: menu.sampleImageUrl || '',
    imageSeed: menu.imageSeed !== undefined ? menu.imageSeed : null,`);
        
        c = c.replace(openCloneMatch[0], block);
        fs.writeFileSync(targetPath, c, 'utf8');
        console.log('Fixed openCloneModal fields!');
    } else {
        console.log('cookingInstructions already exists in openCloneModal.');
    }
} else {
    console.log('openCloneModal not found!');
}
