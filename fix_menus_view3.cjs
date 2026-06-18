const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// 1. Remove form.year HTML
const searchHtml = `<div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">登録年度 <span class="text-red-500 font-bold">*</span></label>
                    <select v-model="form.year" class="input-organic select-organic">
                      <option value="2026">2026年度</option>
                      <option value="2025">2025年度</option>
                      <option value="2024">2024年度</option>
                      <option value="2023">2023年度</option>
                    </select>
                  </div>`;
if (c.includes(searchHtml)) {
    c = c.replace(searchHtml, '');
} else {
    // try a more generic regex if exact match fails
    c = c.replace(/<div class="form-group">\s*<label[^>]*>登録年度[^<]*<span[^>]*>\*<\/span><\/label>\s*<select v-model="form\.year"[\s\S]*?<\/select>\s*<\/div>/g, '');
}

// 2. Add missing fields to openCloneModal
const cloneObjStart = `courseTargetNum: menu.courseTargetNum || '年間3600食',
    singleTargetNum: menu.singleTargetNum || '年間60食',`;
    
const cloneObjEnd = `courseTargetNum: menu.courseTargetNum || '年間3600食',
    singleTargetNum: menu.singleTargetNum || '年間60食',
    displayPeriod: menu.displayPeriod || '通年',
    displayMethod: menu.displayMethod || 'メニューに掲載',
    displayStyle: menu.displayStyle || '記号により表示',
    cookingInstructions: menu.cookingInstructions || '',
    remarks: menu.remarks || '',
    imageUrl: menu.imageUrl || '',
    sampleImageUrl: menu.sampleImageUrl || '',
    imageSeed: menu.imageSeed !== undefined ? menu.imageSeed : null,`;

if (c.includes(cloneObjStart) && !c.includes('displayPeriod: menu.displayPeriod')) {
    c = c.replace(cloneObjStart, cloneObjEnd);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('Fixed cooking instructions and year field.');
