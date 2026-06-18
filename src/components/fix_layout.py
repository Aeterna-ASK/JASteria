import re

filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('<div class="modern-spec-sheet"')
if start_idx == -1:
    print("Could not find start index")
    exit(1)

end_idx = content.find('<!-- 5. JAS規格フッター -->')
end_idx = content.find('</div>\n            </div>', end_idx) + 26

if end_idx == -1:
    print("Could not find end index")
    exit(1)

fixed_html = """
          <!-- モダンなダッシュボード風/マガジン風 JASスペック帳票デザイン (Vanilla CSS Fix) -->
          <div class="modern-spec-sheet" v-if="selectedMenuSpecData" style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; color: #333; padding: 10px;">
            
            <!-- 1. ヘッダーエリア -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #0d9488; padding-bottom: 16px;">
              <div>
                <span style="font-size: 0.7rem; font-weight: bold; color: #0f766e; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">JAS 0004 ORGANIC SPECIFICATION</span>
                <h1 style="font-size: 2.5rem; font-weight: 900; color: #111827; margin: 0; font-family: 'Hiragino Mincho ProN', serif; letter-spacing: -0.02em;">料理スペック</h1>
              </div>
              
              <div style="display: flex; gap: 16px;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #6b7280; margin-bottom: 4px;">調理責任者承認</span>
                  <div style="width: 56px; height: 56px; border: 1.5px solid #b91c1c; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b91c1c; transform: rotate(-3deg); font-family: serif;">
                    <span style="font-size: 0.55rem; border-bottom: 1px solid #b91c1c; width: 80%; text-align: center; padding-bottom: 1px;">厨房</span>
                    <span style="font-size: 0.5rem; font-family: monospace;">{{ selectedMenuForSpec.reviewDate ? selectedMenuForSpec.reviewDate.substring(2).replace(/-/g, '/') : '06/8/25' }}</span>
                    <span style="font-size: 0.65rem; border-top: 1px solid #b91c1c; width: 80%; text-align: center; padding-top: 1px;">{{ (selectedMenuForSpec.managerApproved || '中村誠治').substring(0, 3) }}</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #6b7280; margin-bottom: 4px;">作成・格付担当</span>
                  <div style="width: 56px; height: 56px; border: 1.5px solid #b91c1c; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b91c1c; transform: rotate(2deg); font-family: serif;">
                    <span style="font-size: 0.55rem; border-bottom: 1px solid #b91c1c; width: 80%; text-align: center; padding-bottom: 1px;">厨房</span>
                    <span style="font-size: 0.5rem; font-family: monospace;">{{ selectedMenuForSpec.targetCreatedDate ? selectedMenuForSpec.targetCreatedDate.substring(2).replace(/-/g, '/') : '06/8/25' }}</span>
                    <span style="font-size: 0.65rem; border-top: 1px solid #b91c1c; width: 80%; text-align: center; padding-top: 1px;">{{ (selectedMenuForSpec.creatorApproved || '田中大輔').substring(0, 3) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. サマリー＆目標カード群 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <!-- 基本情報カード -->
              <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">
                  <span>{{ selectedMenuForSpec.category || '料理' }}</span>
                  <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">No.{{ selectedMenuForSpec.id }}</span>
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; line-height: 1.2;">{{ selectedMenuForSpec.name }}</h2>
                <div style="display: flex; gap: 4px;">
                  <img v-for="n in 4" :key="n" src="/tsubo.png" style="width: 16px; height: 16px; object-fit: contain;" :style="{ opacity: n <= getTsuboCount(selectedMenuForSpec.organicRatio) ? 1 : 0.2, filter: n <= getTsuboCount(selectedMenuForSpec.organicRatio) ? 'none' : 'grayscale(100%)' }" />
                </div>
              </div>

              <!-- スケジュールカード -->
              <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">目標作成日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuSpecData.targetCreatedDateWareki }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">開始予定日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuSpecData.startDateWareki }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">内容見直し日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuSpecData.reviewDateWareki }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">達成期限</span>
                    <span style="color: #374151; font-weight: 600;">{{ selectedMenuForSpec.deadline ? selectedMenuForSpec.deadline + ' (一年間)' : '一年間' }}</span>
                  </div>
                </div>
              </div>

              <!-- 目標・変更カード -->
              <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; border: 1px solid #ccfbf1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">コース目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.9rem;">{{ selectedMenuForSpec.courseTargetNum || '年間3600食' }}</span>
                  </div>
                  <div style="text-align: right;">
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">単品目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.9rem;">{{ selectedMenuForSpec.singleTargetNum || '年間60食' }}</span>
                  </div>
                </div>
                <div>
                  <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 4px;">変更内容</span>
                  <div style="font-size: 0.75rem; color: #134e4a; background: #ffffff; padding: 6px; border-radius: 4px; border: 1px solid #ccfbf1; font-weight: 500;">
                    {{ selectedMenuForSpec.changeDetails || '特になし' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. レシピ＆サマリー -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
              
              <!-- 左: 原材料配合割合 -->
              <div>
                <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #0d9488; display: inline-block;"></span>
                  原材料配合割合 (1食あたり)
                </h3>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
                    <thead>
                      <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                        <th style="padding: 8px; font-weight: 600; text-align: center; width: 40px;">No</th>
                        <th style="padding: 8px; font-weight: 600;">原材料名</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">区分</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">重量</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">割合</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients" :key="idx" style="border-bottom: 1px solid #f3f4f6;">
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
                    <tfoot>
                      <tr style="background: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <td colspan="3" style="padding: 8px; font-weight: bold; color: #1f2937; text-align: center;">合計</td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold; color: #111827;">{{ selectedMenuSpecData.totalWeight }}g</td>
                        <td colspan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <!-- 備考 -->
                <div v-if="selectedMenuForSpec.remarks" style="margin-top: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0.75rem; color: #92400e;">
                  <span style="font-weight: bold; display: block; margin-bottom: 4px; font-size: 0.65rem; color: #b45309;">備考</span>
                  <div style="white-space: pre-wrap; line-height: 1.5;">{{ selectedMenuForSpec.remarks }}</div>
                </div>
              </div>

              <!-- 右: 有機・非有機サマリー -->
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
                    <div style="background: #22c55e; height: 100%; border-radius: 4px;" :style="{ width: `${Math.min(selectedMenuSpecData.organicRatio, 100)}%` }"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: #9ca3af; margin-top: 4px; font-weight: bold;">
                    <span>0%</span>
                    <span>基準 80%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. 手順＆写真 -->
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

              <!-- 右: 写真 -->
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

            <!-- 5. JAS規格フッター -->
            <div>
              <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #6366f1; display: inline-block;"></span>
                有機JAS格付・適合及び表示基準
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #3730a3;">格付表示対象の有無</span>
                  <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 2px 8px; border-radius: 12px; border: 1px solid #e0e7ff;">
                    <span style="width: 6px; height: 6px; border-radius: 50%;" :style="{ background: selectedMenuForSpec.isValidOrganic ? '#22c55e' : '#ef4444' }"></span>
                    <span style="font-size: 0.75rem; font-weight: bold; color: #1f2937;">Yes</span>
                  </div>
                </div>
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #3730a3;">記号による表示</span>
                  <span style="font-size: 0.75rem; font-weight: bold; color: #1f2937;">{{ selectedMenuForSpec.displayStyle || '記号により表示' }}</span>
                </div>
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center;">
                  <span style="font-size: 0.6rem; font-weight: bold; color: #3730a3; margin-bottom: 2px;">適合の表示内容</span>
                  <span style="font-size: 0.7rem; font-weight: bold; color: #1f2937;">期間: {{ selectedMenuForSpec.displayPeriod || '通年' }} / 方法: {{ selectedMenuForSpec.displayMethod || 'メニュー掲載' }}</span>
                </div>
              </div>
            </div>

          </div>
"""

content = content[:start_idx] + fixed_html + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vanilla CSS layout applied successfully.")
