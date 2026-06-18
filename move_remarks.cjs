const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const target = `                </div>
              </div>
              
              <!-- 備考 (移動先) -->
              <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 12px 0 8px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #eab308; display: inline-block;"></span>
                備考
              </h3>
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0.75rem; color: #92400e; min-height: 60px;">
                <div style="white-space: pre-wrap; line-height: 1.5;">{{ selectedMenuForSpec.remarks || '' }}</div>
              </div>

              <!-- 右: 有機サマリー＆写真 -->`;

const replacement = `                </div>
                
                <!-- 備考 (移動先) -->
                <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 12px 0 8px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #eab308; display: inline-block;"></span>
                  備考
                </h3>
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0.75rem; color: #92400e; min-height: 60px;">
                  <div style="white-space: pre-wrap; line-height: 1.5;">{{ selectedMenuForSpec.remarks || '' }}</div>
                </div>
              </div>

              <!-- 右: 有機サマリー＆写真 -->`;

if (content.includes('<!-- 備考 (移動先) -->')) {
    // using regex to match with variable whitespace
    const regex = /<\/div>\s*<\/div>\s*<!-- 備考 \(移動先\) -->\s*<h3[^>]*>[\s\S]*?<\/h3>\s*<div[^>]*>\s*<div[^>]*>\{\{ selectedMenuForSpec\.remarks \|\| '' \}\}<\/div>\s*<\/div>\s*<!-- 右: 有機サマリー＆写真 -->/;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Moved remarks inside left column.');
    } else {
        console.log('Could not match target regex.');
    }
} else {
    console.log('Could not find remarks.');
}
