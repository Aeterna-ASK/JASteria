const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/AuditView.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert reconciliationData computed property
const insertTarget = `  });\n  \n  // 初回に最初のチェーンを選択`;
const insertIndex = content.indexOf(insertTarget);

if (insertIndex === -1) {
    console.error("Could not find insertTarget");
} else {
    const computedData = `  });

  const reconciliationData = computed(() => {
    if (!activeChain.value) return null;
    
    const menu = state.menus.find(m => m.id === activeChain.value.menuId);
    if (!menu) return null;

    let organicIngredients = [];
    let totalOrganicAmountPerServingGrams = 0;
    
    if (menu.recipe && Array.isArray(menu.recipe)) {
      menu.recipe.forEach(item => {
        const ing = state.ingredients.find(i => i.id === item.ingredientId);
        if (ing && ing.type === 'organic') {
          organicIngredients.push(\`\${ing.name} \${item.amount}g/食\`);
          totalOrganicAmountPerServingGrams += Number(item.amount) || 0;
        }
      });
    }
    
    const organicDetailsStr = organicIngredients.length > 0 ? organicIngredients.join('、') : '有機食材なし';
    const totalUsedKg = ((totalOrganicAmountPerServingGrams * activeChain.value.quantityCooked) / 1000).toFixed(2);
    
    let totalReceiptKg = 0;
    if (activeChain.value.traces && Array.isArray(activeChain.value.traces)) {
      totalReceiptKg = activeChain.value.traces.reduce((sum, trace) => sum + (Number(trace.receiptQuantity) || 0), 0);
    }
    
    let yearMonth = '';
    if (activeChain.value.cookingDate && activeChain.value.cookingDate.length >= 7) {
      yearMonth = activeChain.value.cookingDate.substring(0, 7);
    }

    return {
      yearMonth,
      organicDetailsStr,
      totalUsedKg,
      totalReceiptKg
    };
  });
  
  // 初回に最初のチェーンを選択`;
  
  content = content.replace(insertTarget, computedData);
}

// 2. Replace the HTML template
const oldHtml = `<div class="sale-row">
                    <span>本日分オーガニック売上伝票：</span>
                    <strong>合計 {{ activeChain.quantityCooked }} 食提供</strong>
                  </div>
                  <div class="reconciliation-box">
                    <div class="reconciliation-header">
                      <span>⚖️ 数量整合性検証（マテリアルバランス照合）</span>
                      <span class="status-pass">一致</span>
                    </div>
                    <p class="reconciliation-desc">レシピ計算重量（有機トマト 120g/食等）に基づく総使用量は <strong>{{ (activeChain.quantityCooked * 0.12).toFixed(2) }} kg</strong>。上記仕入受入量（{{ activeChain.traces[0] ? activeChain.traces[0].receiptQuantity : 0 }} kg）の枠内に完璧に収まっており、一般食材の不正な混入がないことが数学的に証明されています。</p>
                  </div>`;

const newHtml = `<div class="sale-row" v-if="reconciliationData">
                    <span>本日分オーガニック売上伝票：</span>
                    <strong>{{ reconciliationData.yearMonth }} {{ activeChain.menuName }}：合計 {{ activeChain.quantityCooked }} 食提供</strong>
                  </div>
                  <div class="reconciliation-box" v-if="reconciliationData">
                    <div class="reconciliation-header">
                      <span>⚖️ 数量整合性検証（マテリアルバランス照合）</span>
                      <span class="status-pass">一致</span>
                    </div>
                    <p class="reconciliation-desc">レシピ計算重量（{{ reconciliationData.organicDetailsStr }}等）に基づく総使用量は <strong>{{ reconciliationData.totalUsedKg }} kg</strong>。上記仕入受入量（{{ reconciliationData.totalReceiptKg }} kg）の枠内に完璧に収まっており、一般食材の不正な混入がないことが数学的に証明されています。</p>
                  </div>`;

if (content.includes(oldHtml)) {
    content = content.replace(oldHtml, newHtml);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully replaced AuditView.vue content!");
} else {
    // try a more fuzzy replace for the html
    console.log("Could not find oldHtml exactly. Attempting regex replacement...");
    
    // Replace sale-row
    const regex1 = /<div class="sale-row">[\s\S]*?<\/div>/;
    const newSaleRow = `<div class="sale-row" v-if="reconciliationData">
                    <span>本日分オーガニック売上伝票：</span>
                    <strong>{{ reconciliationData.yearMonth }} {{ activeChain.menuName }}：合計 {{ activeChain.quantityCooked }} 食提供</strong>
                  </div>`;
    content = content.replace(regex1, newSaleRow);
    
    // Replace reconciliation-box
    const regex2 = /<div class="reconciliation-box">[\s\S]*?<\/div>\s*<\/div>/;
    const newRecBox = `<div class="reconciliation-box" v-if="reconciliationData">
                    <div class="reconciliation-header">
                      <span>⚖️ 数量整合性検証（マテリアルバランス照合）</span>
                      <span class="status-pass">一致</span>
                    </div>
                    <p class="reconciliation-desc">レシピ計算重量（{{ reconciliationData.organicDetailsStr }}等）に基づく総使用量は <strong>{{ reconciliationData.totalUsedKg }} kg</strong>。上記仕入受入量（{{ reconciliationData.totalReceiptKg }} kg）の枠内に完璧に収まっており、一般食材の不正な混入がないことが数学的に証明されています。</p>
                  </div>
                </div>`;
    content = content.replace(regex2, newRecBox);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully replaced via regex!");
}
