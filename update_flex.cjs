const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace the 1fr 1fr grid
let newContent = content.replace(
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">',
    '<div style="display: flex; gap: 24px; align-items: flex-start;">'
);
newContent = newContent.replace(
    /<!-- 左カラム -->\s*<div style="background: #ffffff;/g,
    '<!-- 左カラム -->\n                <div style="flex: 1; min-width: 0; background: #ffffff;'
);
newContent = newContent.replace(
    /<!-- 右カラム -->\s*<div style="background: #ffffff;/g,
    '<!-- 右カラム -->\n                <div style="flex: 1; min-width: 0; background: #ffffff;'
);

// Replace the 2fr 1fr grid
newContent = newContent.replace(
    '<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">',
    '<div style="display: flex; gap: 24px; margin-bottom: 24px; align-items: flex-start;">'
);
newContent = newContent.replace(
    /<!-- 左: 作り方 -->\s*<div>/g,
    '<!-- 左: 作り方 -->\n              <div style="flex: 2; min-width: 0;">'
);
newContent = newContent.replace(
    /<!-- 右: 有機サマリー＆写真 -->\s*<div style="display: flex; flex-direction: column; gap: 24px;">/g,
    '<!-- 右: 有機サマリー＆写真 -->\n              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px;">'
);

fs.writeFileSync(file, newContent, 'utf8');
console.log('Flexbox update applied');
