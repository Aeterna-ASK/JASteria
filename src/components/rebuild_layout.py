import re

filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('<div class="excel-spec-sheet-v2"')
end_idx = content.find('<!-- F. 適合及び表示基準詳細 -->')
end_idx = content.find('</div>\n          </div>', end_idx) + 24

if start_idx == -1:
    print("Could not find start index")
    exit(1)

modern_html = """
          <!-- モダンなダッシュボード風/マガジン風 JASスペック帳票デザイン -->
          <div class="modern-spec-sheet" v-if="selectedMenuSpecData">
            
            <!-- 1. ヘッダーエリア -->
            <div class="modern-header flex justify-between items-start mb-6">
              <div class="header-title-container">
                <span class="text-xs font-bold text-teal-700 tracking-widest mb-1 block">JAS 0004 ORGANIC SPECIFICATION</span>
                <h1 class="modern-title text-4xl font-extrabold text-gray-900 tracking-tight" style="font-family: 'Hiragino Mincho ProN', serif;">料理スペック</h1>
              </div>
              
              <div class="modern-stamps flex gap-4">
                <div class="modern-stamp flex flex-col items-center justify-center">
                  <span class="text-[0.65rem] font-bold text-gray-500 mb-1">調理責任者承認</span>
                  <div class="stamp-circle-modern border-[1.5px] border-red-700 rounded-full flex flex-col items-center justify-center text-red-700 font-serif" style="width: 56px; height: 56px; transform: rotate(-3deg);">
                    <span class="text-[0.55rem] border-b border-red-700 w-4/5 text-center pb-[1px] tracking-widest">厨房</span>
                    <span class="text-[0.5rem] font-mono scale-90">{{ selectedMenuForSpec.reviewDate ? selectedMenuForSpec.reviewDate.substring(2).replace(/-/g, '/') : '06/8/25' }}</span>
                    <span class="text-[0.65rem] border-t border-red-700 w-4/5 text-center pt-[1px] tracking-wide">{{ (selectedMenuForSpec.managerApproved || '中村誠治').substring(0, 3) }}</span>
                  </div>
                </div>
                <div class="modern-stamp flex flex-col items-center justify-center">
                  <span class="text-[0.65rem] font-bold text-gray-500 mb-1">作成・格付担当</span>
                  <div class="stamp-circle-modern border-[1.5px] border-red-700 rounded-full flex flex-col items-center justify-center text-red-700 font-serif" style="width: 56px; height: 56px; transform: rotate(2deg);">
                    <span class="text-[0.55rem] border-b border-red-700 w-4/5 text-center pb-[1px] tracking-widest">厨房</span>
                    <span class="text-[0.5rem] font-mono scale-90">{{ selectedMenuForSpec.targetCreatedDate ? selectedMenuForSpec.targetCreatedDate.substring(2).replace(/-/g, '/') : '06/8/25' }}</span>
                    <span class="text-[0.65rem] border-t border-red-700 w-4/5 text-center pt-[1px] tracking-wide">{{ (selectedMenuForSpec.creatorApproved || '田中大輔').substring(0, 3) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. サマリー＆目標カード群 (上段) -->
            <div class="modern-cards-row grid grid-cols-3 gap-4 mb-6">
              <!-- 基本情報カード -->
              <div class="modern-card bg-white p-4 rounded-xl shadow-sm border border-gray-200 print-border">
                <div class="text-xs text-gray-500 font-semibold mb-2 flex justify-between">
                  <span>{{ selectedMenuForSpec.category || '料理' }}</span>
                  <span class="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 print-bg">No.{{ selectedMenuForSpec.id }}</span>
                </div>
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="text-xl font-bold text-gray-900 leading-tight">{{ selectedMenuForSpec.name }}</h2>
                </div>
                <div class="flex gap-1 mt-2">
                  <img v-for="n in 4" :key="n" src="/tsubo.png" class="w-4 h-4 object-contain" :class="n <= getTsuboCount(selectedMenuForSpec.organicRatio) ? 'opacity-100' : 'opacity-20 grayscale'" />
                </div>
              </div>

              <!-- スケジュールカード -->
              <div class="modern-card bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between print-border">
                <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div>
                    <span class="block text-[0.65rem] text-gray-500 font-bold mb-0.5">目標作成日</span>
                    <span class="font-mono text-gray-800">{{ selectedMenuSpecData.targetCreatedDateWareki }}</span>
                  </div>
                  <div>
                    <span class="block text-[0.65rem] text-gray-500 font-bold mb-0.5">開始予定日</span>
                    <span class="font-mono text-gray-800">{{ selectedMenuSpecData.startDateWareki }}</span>
                  </div>
                  <div>
                    <span class="block text-[0.65rem] text-gray-500 font-bold mb-0.5">内容見直し日</span>
                    <span class="font-mono text-gray-800">{{ selectedMenuSpecData.reviewDateWareki }}</span>
                  </div>
                  <div>
                    <span class="block text-[0.65rem] text-gray-500 font-bold mb-0.5">達成期限</span>
                    <span class="text-gray-800 font-semibold">{{ selectedMenuForSpec.deadline ? selectedMenuForSpec.deadline + ' (一年間)' : '一年間' }}</span>
                  </div>
                </div>
              </div>

              <!-- 目標・変更カード -->
              <div class="modern-card bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100 flex flex-col justify-between print-border print-teal-bg">
                <div class="flex justify-between items-center mb-3">
                  <div>
                    <span class="block text-[0.65rem] text-teal-700 font-bold mb-0.5">コース目標</span>
                    <span class="font-bold text-teal-900">{{ selectedMenuForSpec.courseTargetNum || '年間3600食' }}</span>
                  </div>
                  <div class="text-right">
                    <span class="block text-[0.65rem] text-teal-700 font-bold mb-0.5">単品目標</span>
                    <span class="font-bold text-teal-900">{{ selectedMenuForSpec.singleTargetNum || '年間60食' }}</span>
                  </div>
                </div>
                <div>
                  <span class="block text-[0.65rem] text-teal-700 font-bold mb-0.5">変更内容</span>
                  <div class="text-[0.75rem] text-teal-900 bg-white p-2 rounded-lg leading-snug font-medium border border-teal-50">
                    {{ selectedMenuForSpec.changeDetails || '特になし' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. レシピ＆サマリー (中段) -->
            <div class="modern-middle-section grid grid-cols-12 gap-6 mb-6">
              
              <!-- 左: 原材料配合割合 (col-span-8) -->
              <div class="col-span-8 modern-recipe-box">
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-teal-600"></span>
                  原材料配合割合 (1食あたり)
                </h3>
                <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print-border">
                  <table class="w-full text-left text-[0.75rem]">
                    <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase print-bg print-border-b">
                      <tr>
                        <th class="px-3 py-2 font-semibold w-12 text-center">No</th>
                        <th class="px-3 py-2 font-semibold">原材料名</th>
                        <th class="px-3 py-2 font-semibold text-center">区分</th>
                        <th class="px-3 py-2 font-semibold text-right">重量</th>
                        <th class="px-3 py-2 font-semibold text-right">割合</th>
                        <th class="px-3 py-2 font-semibold text-center">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients" :key="idx">
                        <td class="px-3 py-2 font-mono text-gray-500 text-center">{{ idx + 1 }}</td>
                        <td class="px-3 py-2 font-bold text-gray-800">{{ item.name }}</td>
                        <td class="px-3 py-2 text-center">
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold" 
                                :class="item.organicType === 'organic' ? 'bg-green-100 text-green-800' : (item.organicType === 'salt_water' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600')">
                            {{ item.organicType === 'organic' ? '有機JAS' : (item.organicType === 'salt_water' ? '水/塩(除外)' : '一般') }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.amount }}g</td>
                        <td class="px-3 py-2 text-right font-mono font-semibold" :class="item.organicType === 'organic' ? 'text-green-700' : 'text-gray-700'">{{ item.percentage }}%</td>
                        <td class="px-3 py-2 text-center font-bold text-green-700 font-mono">{{ item.symbol }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t border-gray-200 print-bg print-border-t">
                      <tr>
                        <td colspan="3" class="px-3 py-2 font-bold text-gray-800 text-center">合計</td>
                        <td class="px-3 py-2 text-right font-mono font-bold text-gray-900">{{ selectedMenuSpecData.totalWeight }}g</td>
                        <td colspan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <!-- 備考 -->
                <div class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[0.75rem] text-amber-900 print-amber-bg print-border" v-if="selectedMenuForSpec.remarks">
                  <span class="font-bold block mb-1 text-[0.65rem] text-amber-700">備考</span>
                  <div class="whitespace-pre-wrap leading-relaxed">{{ selectedMenuForSpec.remarks }}</div>
                </div>
              </div>

              <!-- 右: 有機・非有機サマリー (col-span-4) -->
              <div class="col-span-4 modern-summary-box flex flex-col gap-3">
                <h3 class="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-green-600"></span>
                  有機JAS 適合集計
                </h3>
                
                <!-- 有機カード -->
                <div class="bg-green-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden print-green-bg">
                  <span class="text-green-100 text-[0.65rem] font-bold tracking-wider uppercase mb-1 block">Organic Ratio</span>
                  <div class="flex items-end justify-between">
                    <span class="text-4xl font-extrabold tracking-tighter">{{ selectedMenuSpecData.organicRatio }}<span class="text-xl font-bold ml-1 opacity-80">%</span></span>
                  </div>
                  <div class="mt-4 pt-3 border-t border-green-500 flex justify-between items-center text-[0.75rem] font-medium">
                    <span class="text-green-100">有機重量</span>
                    <span class="font-mono text-base">{{ selectedMenuSpecData.organicWeight }}g</span>
                  </div>
                </div>

                <!-- 非有機カード -->
                <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center print-border">
                  <span class="text-gray-500 text-[0.65rem] font-bold tracking-wider uppercase mb-1 block">Non-Organic Ratio</span>
                  <div class="flex justify-between items-end mb-2">
                    <span class="text-gray-800 font-bold text-xl">{{ selectedMenuSpecData.generalRatio }}%</span>
                    <span class="font-mono text-gray-600 text-[0.75rem] font-semibold">{{ selectedMenuSpecData.generalWeight }}g</span>
                  </div>
                  <!-- プログレスバー風 -->
                  <div class="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden print-bg">
                    <div class="bg-green-500 h-1.5 rounded-full print-green-bg" :style="{ width: `${Math.min(selectedMenuSpecData.organicRatio, 100)}%` }"></div>
                  </div>
                  <div class="flex justify-between text-[0.55rem] text-gray-400 mt-1 font-bold">
                    <span>0%</span>
                    <span>基準 80%</span>
                    <span>100%</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- 4. 手順＆写真 (下段) -->
            <div class="modern-bottom-section grid grid-cols-12 gap-6 mb-6">
              
              <!-- 左: 作り方 (col-span-8) -->
              <div class="col-span-8 modern-instructions">
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                  調理手順
                </h3>
                <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm print-border">
                  <div class="space-y-3">
                    <div v-for="row in selectedMenuSpecData.instructionRows" :key="row.no" class="flex gap-3 items-start">
                      <div class="flex-shrink-0">
                        <span class="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[0.65rem] font-bold print-orange-bg">{{ row.no }}</span>
                      </div>
                      <p class="text-[0.75rem] text-gray-700 leading-relaxed font-medium whitespace-pre-wrap pt-0.5">{{ row.text }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右: 写真 (col-span-4) -->
              <div class="col-span-4 modern-photo">
                <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  完成写真
                </h3>
                <div class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm h-40 flex items-center justify-center relative print-border">
                  <img v-if="selectedMenuForSpec.imageUrl" :src="selectedMenuForSpec.imageUrl" class="w-full h-full object-cover" />
                  <div v-else class="flex flex-col items-center justify-center text-gray-400">
                    <Camera :size="24" class="mb-1 opacity-50" />
                    <span class="text-[0.65rem] font-bold">[画像未登録]</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. JAS規格フッター -->
            <div class="modern-footer-section">
              <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                有機JAS格付・適合及び表示基準
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between print-indigo-bg print-border">
                  <span class="text-[0.65rem] font-bold text-indigo-800">格付表示対象の有無</span>
                  <div class="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full shadow-sm border border-indigo-50">
                    <span class="w-1.5 h-1.5 rounded-full" :class="selectedMenuForSpec.isValidOrganic ? 'bg-green-500 print-green-bg' : 'bg-red-500'"></span>
                    <span class="text-[0.75rem] font-bold text-gray-800">Yes</span>
                  </div>
                </div>
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between print-indigo-bg print-border">
                  <span class="text-[0.65rem] font-bold text-indigo-800">記号による表示</span>
                  <span class="text-[0.75rem] font-bold text-gray-800">{{ selectedMenuForSpec.displayStyle || '記号により表示' }}</span>
                </div>
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col justify-center print-indigo-bg print-border">
                  <span class="text-[0.6rem] font-bold text-indigo-800 mb-0.5">適合の表示内容</span>
                  <span class="text-[0.7rem] font-bold text-gray-800">期間: {{ selectedMenuForSpec.displayPeriod || '通年' }} / 方法: {{ selectedMenuForSpec.displayMethod || 'メニュー掲載' }}</span>
                </div>
              </div>
            </div>

          </div>
"""

content = content[:start_idx] + modern_html + content[end_idx:]

# Update CSS for .modern-spec-sheet
css_start = content.find('  .excel-spec-sheet-v2 {')
if css_start != -1:
    css_end = content.find('</style>', css_start)
    
    modern_css = """
  /* モダンレイアウト用の印刷ハック */
  .modern-spec-sheet {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 2mm !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-inside: avoid;
    font-family: "Inter", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  }
  .modern-spec-sheet * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @media print {
    .print-border { border: 1px solid #e5e7eb !important; }
    .print-border-b { border-bottom: 1px solid #e5e7eb !important; }
    .print-border-t { border-top: 1px solid #e5e7eb !important; }
    .print-bg { background-color: #f9fafb !important; }
    .print-teal-bg { background-color: #f0fdfa !important; }
    .print-green-bg { background-color: #15803d !important; color: white !important; }
    .print-amber-bg { background-color: #fffbeb !important; }
    .print-orange-bg { background-color: #ffedd5 !important; }
    .print-indigo-bg { background-color: #eef2ff !important; }
    
    .modern-card, .modern-recipe-box table, .modern-summary-box > div, .modern-instructions > div {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
"""
    content = content[:css_start] + modern_css + content[css_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout successfully rebuilt to modern-spec-sheet.")
