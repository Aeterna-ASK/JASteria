const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const brokenPart = `<div style="background: #f0fdfa; padding: 12px; border-radius: 8px; border: 1px solid #ccfbf1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div>
            
            <!-- 3. レシピ (2カラム) -->`;

const fixedPart = `<div style="background: #f0fdfa; padding: 12px; border-radius: 8px; border: 1px solid #ccfbf1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">コース目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.85rem;">{{ selectedMenuForSpec.courseTargetNum || '年間3600食' }}</span>
                  </div>
                  <div style="text-align: right;">
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">単品目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.85rem;">{{ selectedMenuForSpec.singleTargetNum || '年間60食' }}</span>
                  </div>
                </div>
                <div>
                  <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 4px;">変更内容</span>
                  <div style="font-size: 0.75rem; color: #134e4a; background: #ffffff; padding: 6px; border-radius: 4px; border: 1px solid #ccfbf1; font-weight: 500;">
                    {{ selectedMenuForSpec.changeDetails || 'なし' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. レシピ (2カラム) -->`;

content = content.replace(brokenPart, fixedPart);

// Now, remove the old remarks which actually look like this:
const oldRemarksRegex = /<!-- 備考 -->\s*<div v-if="selectedMenuForSpec\.remarks" style="margin-top: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0\.75rem; color: #92400e;">\s*<span style="font-weight: bold; display: block; margin-bottom: 4px; font-size: 0\.65rem; color: #b45309;">備考<\/span>\s*<div style="white-space: pre-wrap; line-height: 1\.5;">\{\{ selectedMenuForSpec\.remarks \}\}<\/div>\s*<\/div>/g;

content = content.replace(oldRemarksRegex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Repaired and removed old remarks.');
