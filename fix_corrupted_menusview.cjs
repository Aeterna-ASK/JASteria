const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// The block to remove starts with:
//             <!-- CSSベースの美しい縦棒グラフ -->
// and ends right before the second:
//             <!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->

const searchRegex = /<!-- CSSベースの美しい縦棒グラフ -->[\s\S]*?<\/div>\s*<\/div>\s*<!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->/;

const match = c.match(searchRegex);
if (match) {
    // We only want to remove the FIRST instance of the duplicated block.
    // Wait, the corrupted part is:
    // <!-- CSSベースの美しい縦棒グラフ -->
    // ...
    // <option :value="2025">2025年</option>
    // ...
    // <!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->
    // Let's just find the exact corrupted string and remove it.
    
    let corruptedPartMatch = c.match(/<div class="monthly-trend-chart mt-3">\s*<div v-for="\(count, idx\) in getMonthlyServingData\(menu\.id\)" :key="idx" class="chart-bar-col">\s*<div class="chart-bar-wrapper">\s*<option :value="2025">2025年<\/option>\s*<option :value="2024">2024年<\/option>\s*<\/select>\s*<\/div>\s*<\/div>\s*<!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->/);
    
    if (corruptedPartMatch) {
        c = c.replace(corruptedPartMatch[0], '<!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->');
        fs.writeFileSync(targetPath, c, 'utf8');
        console.log('Fixed corrupted block!');
    } else {
        console.log('Could not find exact corrupted block.');
    }
} else {
    console.log('Could not find regex match.');
}
