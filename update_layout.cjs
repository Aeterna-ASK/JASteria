const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const startTag = '<!-- 3. レシピ＆サマリー -->';
const endTag = '<!-- 5. JAS規格フッター -->';
const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = `
            <!-- 3. レシピ (2カラム) -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #0d9488; display: inline-block;"></span>
                原材料配合割合 (1食あたり)
              </h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- 左カラム -->
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
                    <thead>
                      <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                        <th style="padding: 8px; font-weight: 600; text-align: center; width: 30px;">No</th>
                        <th style="padding: 8px; font-weight: 600;">原材料名</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">区分</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">重量</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">割合</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients.slice(0, Math.ceil(selectedMenuSpecData.ingredients.length / 2))" :key="idx" style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 8px; font-family: monospace; color: #6b7280; text-align: center;">{{ idx + 1 }}</td>
                        <td style="padding: 8px; font-weight: bold; color: #1f2937;">{{ item.name }}</td>
                        <td style="padding: 8px; text-align: center;">
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;" 
                                :style="{ background: item.organicType === 'organic' ? '#dcfce7' : (item.organicType === 'salt_water' ? '#dbeafe' : '#f3f4f6'), color: item.organicType === 'organic' ? '#166534' : (item.organicType === 'salt_water' ? '#1e40af' : '#4b5563') }">
                            {{ item.organicType === 'organic' ? '有機JAS' : (item.organicType === 'salt_water' ? '水/塩(除外)' : '一般') }}
                          </span>
                        </td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; color: #374151;">{{ item.amount }}g</td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;" :style="{ color: item.organicType === 'organic' ? '#15803d' : '#374151' }">{{ item.percentage }}%</td>
                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #15803d; font-family: monospace;">{{ item.symbol }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 右カラム -->
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
                    <thead>
                      <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                        <th style="padding: 8px; font-weight: 600; text-align: center; width: 30px;">No</th>
                        <th style="padding: 8px; font-weight: 600;">原材料名</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">区分</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">重量</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">割合</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients.slice(Math.ceil(selectedMenuSpecData.ingredients.length / 2))" :key="idx + Math.ceil(selectedMenuSpecData.ingredients.length / 2)" style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 8px; font-family: monospace; color: #6b7280; text-align: center;">{{ idx + 1 + Math.ceil(selectedMenuSpecData.ingredients.length / 2) }}</td>
                        <td style="padding: 8px; font-weight: bold; color: #1f2937;">{{ item.name }}</td>
                        <td style="padding: 8px; text-align: center;">
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;" 
                                :style="{ background: item.organicType === 'organic' ? '#dcfce7' : (item.organicType === 'salt_water' ? '#dbeafe' : '#f3f4f6'), color: item.organicType === 'organic' ? '#166534' : (item.organicType === 'salt_water' ? '#1e40af' : '#4b5563') }">
                            {{ item.organicType === 'organic' ? '有機JAS' : (item.organicType === 'salt_water' ? '水/塩(除外)' : '一般') }}
                          </span>
                        </td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; color: #374151;">{{ item.amount }}g</td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;" :style="{ color: item.organicType === 'organic' ? '#15803d' : '#374151' }">{{ item.percentage }}%</td>
                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #15803d; font-family: monospace;">{{ item.symbol }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 合計フッター -->
              <div style="margin-top: 12px; display: flex; justify-content: flex-end; align-items: center; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem;">
                <span style="font-weight: bold; color: #1f2937; margin-right: 16px;">合計</span>
                <span style="font-family: monospace; font-weight: bold; color: #111827;">{{ selectedMenuSpecData.totalWeight }}g</span>
              </div>
              
              <!-- 備考 -->
              <div v-if="selectedMenuForSpec.remarks" style="margin-top: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0.75rem; color: #92400e;">
                <span style="font-weight: bold; display: block; margin-bottom: 4px; font-size: 0.65rem; color: #b45309;">備考</span>
                <div style="white-space: pre-wrap; line-height: 1.5;">{{ selectedMenuForSpec.remarks }}</div>
              </div>
            </div>

            <!-- 4. 有機サマリー・手順・写真 -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
              
              <!-- 左: 作り方 -->
              <div>
                <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #f97316; display: inline-block;"></span>
                  調理手順
                </h3>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div v-for="row in selectedMenuSpecData.instructionRows" :key="row.no" style="display: flex; gap: 12px; align-items: flex-start;">
                      <div style="flex-shrink: 0;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #ffedd5; color: #c2410c; font-size: 0.65rem; font-weight: bold;">{{ row.no }}</span>
                      </div>
                      <p style="margin: 0; font-size: 0.75rem; color: #374151; line-height: 1.6; font-weight: 500; white-space: pre-wrap; padding-top: 2px;">{{ row.text }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右: 有機サマリー＆写真 -->
              <div style="display: flex; flex-direction: column; gap: 24px;">
                
                <!-- 有機・非有機サマリー -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
                    有機JAS 適合集計
                  </h3>
                  
                  <!-- 有機カード -->
                  <div style="background: #15803d; border-radius: 12px; padding: 20px; color: white; position: relative;">
                    <span style="color: #bbf7d0; font-size: 0.65rem; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 4px; display: block;">ORGANIC RATIO</span>
                    <div style="display: flex; align-items: baseline; justify-content: space-between;">
                      <span style="font-size: 2.5rem; font-weight: 900; letter-spacing: -0.05em; line-height: 1;">{{ selectedMenuSpecData.organicRatio }}<span style="font-size: 1.25rem; margin-left: 4px;">%</span></span>
                    </div>
                    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                      <span style="color: #bbf7d0;">有機重量合計</span>
                      <span style="font-family: monospace; font-size: 1rem; font-weight: bold;">{{ selectedMenuSpecData.organicWeight }}g</span>
                    </div>
                  </div>

                  <!-- 非有機カード -->
                  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                    <span style="color: #6b7280; font-size: 0.65rem; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 4px; display: block;">NON-ORGANIC RATIO</span>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                      <span style="color: #1f2937; font-weight: bold; font-size: 1.25rem; line-height: 1;">{{ selectedMenuSpecData.generalRatio }}%</span>
                      <span style="font-family: monospace; color: #4b5563; font-size: 0.85rem; font-weight: 600;">{{ selectedMenuSpecData.generalWeight }}g</span>
                    </div>
                    <!-- プログレスバー風 -->
                    <div style="width: 100%; background: #f3f4f6; border-radius: 4px; height: 8px; margin-top: 4px; overflow: hidden;">
                      <div style="background: #22c55e; height: 100%; border-radius: 4px;" :style="{ width: \`\${Math.min(selectedMenuSpecData.organicRatio, 100)}%\` }"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: #9ca3af; margin-top: 4px; font-weight: bold;">
                      <span>0%</span>
                      <span>基準 80%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <!-- 写真 -->
                <div>
                  <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>
                    完成写真
                  </h3>
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; height: 160px; display: flex; align-items: center; justify-content: center;">
                    <img v-if="selectedMenuForSpec.imageUrl" :src="selectedMenuForSpec.imageUrl" style="width: 100%; height: 100%; object-fit: cover;" />
                    <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af;">
                      <Camera :size="24" style="margin-bottom: 4px; opacity: 0.5;" />
                      <span style="font-size: 0.65rem; font-weight: bold;">[画像未登録]</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
`;
    
    let updatedContent = content.substring(0, startIdx) + newContent + "            " + endTag + content.substring(endIdx + endTag.length);
    fs.writeFileSync(file, updatedContent, 'utf8');
    console.log('Success');
} else {
    console.log('Tags not found');
}
