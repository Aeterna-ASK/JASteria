const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(filePath, 'utf8');

const tsuboIconsRowStart = c.indexOf('<div class="tsubo-icons-row flex gap-1"');
const tsuboIconsRowEnd = c.indexOf('<!-- 提供実績・年間推移（おもてなしUXアコーディオン） -->');

if (tsuboIconsRowStart > -1 && tsuboIconsRowEnd > -1) {
    const correctTsuboRow = `<div class="tsubo-icons-row flex gap-1" style="display: flex; gap: 0.25rem;">
              <img 
                v-for="n in 4" 
                :key="n" 
                src="/tsubo.png" 
                alt="tsubo" 
                style="width: 20px; height: 24px; object-fit: contain; transition: opacity 0.2s;"
                :style="{ opacity: n <= getTsuboCount(menu.organicRatio) ? 1 : 0.15 }"
              />
            </div>
          </div>

          `;
    c = c.substring(0, tsuboIconsRowStart) + correctTsuboRow + c.substring(tsuboIconsRowEnd);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed the duplicated menu-details block.');
} else {
    console.log('Could not find boundaries.');
}
