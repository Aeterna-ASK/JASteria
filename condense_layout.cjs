const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// Find the start of the modern-spec-sheet block
const startIndex = content.indexOf('<div class="modern-spec-sheet"');
if (startIndex !== -1) {
    const endIndex = content.indexOf('<!-- 5. JAS規格フッター -->', startIndex) + 2000;
    
    let before = content.substring(0, startIndex);
    let target = content.substring(startIndex, endIndex);
    let after = content.substring(endIndex);
    
    // In target block, apply size reductions
    // 1. margin-bottoms
    target = target.replace(/margin-bottom: 24px;/g, 'margin-bottom: 16px;');
    target = target.replace(/margin-bottom: 16px;/g, 'margin-bottom: 12px;'); // catch cases that just changed or existing
    target = target.replace(/margin-bottom: 12px;/g, 'margin-bottom: 8px;');
    
    // 2. padding inside cards
    target = target.replace(/padding: 16px;/g, 'padding: 12px;');
    target = target.replace(/padding: 20px;/g, 'padding: 16px;');
    
    // 3. gaps
    target = target.replace(/gap: 24px;/g, 'gap: 16px;');
    target = target.replace(/gap: 16px;/g, 'gap: 12px;');
    
    // 4. photo height
    target = target.replace(/height: 160px;/g, 'height: 120px;');
    
    // 5. specific elements
    target = target.replace(/padding-bottom: 16px;/g, 'padding-bottom: 8px;');
    target = target.replace(/margin: 0 0 12px 0;/g, 'margin: 0 0 8px 0;');
    target = target.replace(/margin-top: 12px;/g, 'margin-top: 8px;');
    target = target.replace(/margin-top: 16px;/g, 'margin-top: 12px;');
    target = target.replace(/padding-top: 12px;/g, 'padding-top: 8px;');
    
    // 6. Header font sizes
    target = target.replace(/font-size: 2.5rem;/g, 'font-size: 2rem;');
    
    content = before + target + after;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully condensed the layout.');
} else {
    console.log('Could not find modern-spec-sheet');
}
