const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const target = `                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center;">
                  <span style="font-size: 0.6rem; font-weight: bold; color: #3730a3; margin-bottom: 2px;">規定の表示内容</span>
                  <span style="font-size: 0.7rem; font-weight: bold; color: #1f2937;">期間: {{ selectedMenuForSpec.displayPeriod || '通年' }} / 方法: {{ selectedMenuForSpec.displayMethod || 'メニューに掲載' }}</span>
                </div>
              </div>
            </div>

          </div>`;

const replacement = `                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center;">
                  <span style="font-size: 0.6rem; font-weight: bold; color: #3730a3; margin-bottom: 2px;">規定の表示内容</span>
                  <span style="font-size: 0.7rem; font-weight: bold; color: #1f2937;">期間: {{ selectedMenuForSpec.displayPeriod || '通年' }} / 方法: {{ selectedMenuForSpec.displayMethod || 'メニューに掲載' }}</span>
                </div>
              </div>
            </div>
            
            </div></div></div>

          </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Added missing divs.');
