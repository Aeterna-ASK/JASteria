const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

const state_vars = `
// AIレシピ自動生成用
const showAiRecipeModal = ref(false);
const aiRecipeConfig = ref({
  startDate: '',
  endDate: '',
  targetGrams: 200,
});
const isGeneratingAiRecipe = ref(false);
const aiRecipeError = ref('');

const openAiRecipeModal = () => {
  showAiRecipeModal.value = true;
  aiRecipeError.value = '';
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  aiRecipeConfig.value.startDate = form.value.startDate || nextMonth.toISOString().split('T')[0];
  
  const ed = new Date(aiRecipeConfig.value.startDate);
  ed.setMonth(ed.getMonth() + 1);
  ed.setDate(0);
  aiRecipeConfig.value.endDate = ed.toISOString().split('T')[0];
};

const generateRecipeWithAi = async () => {
  if (!aiRecipeConfig.value.startDate || !aiRecipeConfig.value.endDate) {
    aiRecipeError.value = '対象期間を入力してください。';
    return;
  }
  isGeneratingAiRecipe.value = true;
  aiRecipeError.value = '';
  
  try {
    const sDate = new Date(aiRecipeConfig.value.startDate);
    const eDate = new Date(aiRecipeConfig.value.endDate);
    sDate.setDate(sDate.getDate() - 10);
    eDate.setDate(eDate.getDate() + 10);
    
    const receipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= sDate && d <= eDate;
    });
    
    const availableIngredients = [];
    const usedIds = new Set();
    receipts.forEach(r => {
      if (r.items) {
        r.items.forEach(item => {
          if (item.ingredientId && !usedIds.has(item.ingredientId)) {
            usedIds.add(item.ingredientId);
            const ing = state.ingredients.find(i => i.id === item.ingredientId);
            if (ing) {
              availableIngredients.push({
                id: ing.id,
                name: ing.name,
                type: ing.type
              });
            }
          }
        });
      }
    });
    
    if (availableIngredients.length === 0) {
      throw new Error('指定期間(±10日)内に仕入れられた食材が見つかりませんでした。');
    }
    
    const apiKey = state.restaurantInfo.geminiApiKey;
    if (!apiKey) throw new Error('設定画面でGemini APIキーが設定されていません。');
    
    const isRevision = !!currentId.value;
    const promptText = \`あなたはプロのレストランのシェフ兼メニュー開発者です。
以下の「利用可能な食材リスト」のみを使用して、レシピを一つ考案してください。

【制約条件】
- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）
- レストランのコンセプト上、可能な限り「有機JAS品(type: organic)」の重量割合が95%以上になるように配分してください。ただし料理として成立させるために必要な場合は「一般食品(type: general)」も適宜使用してください。
\${isRevision ? \\\`- 今回は既存レシピの「改定」です。既存の食材の分量を大きく変えすぎないように調整し、期間内に仕入れがなかった食材は除外してください。
既存のレシピ:
\${JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2)}\\\` 
: \\\`- 1食あたりの目標総重量: 約\${aiRecipeConfig.value.targetGrams}g\\\`}

【利用可能な食材リスト】
\${availableIngredients.map(i => \\\`- \${i.name} (ID: \${i.id}, 区分: \${i.type === 'organic' ? '有機JAS品' : '一般食品'})\\\`).join('\\n')}

【出力形式】
必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
{
  "menuName": "考案した料理名",
  "cookingInstructions": "調理手順（簡潔に）",
  "recipe": [
    {
      "ingredientId": "リストにあるID",
      "amount": "1食あたりのグラム数（数字のみ。例: 50）"
    }
  ]
}
\`;

    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    
    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) throw new Error('AIからJSONを抽出できませんでした。');
    const parsed = JSON.parse(jsonMatch[0]);
    
    form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
    
    const newRecipe = [];
    if (parsed.recipe && Array.isArray(parsed.recipe)) {
      parsed.recipe.forEach(pr => {
        const ing = state.ingredients.find(i => i.id === pr.ingredientId);
        if (ing) {
          newRecipe.push({
            ingredientId: ing.id,
            name: ing.name,
            amount: Number(pr.amount) || 0,
            type: ing.type,
            supplier: ing.supplier,
            hasCertificate: ing.hasCertificate,
            hasJasLabelVerified: ing.hasJasLabelVerified
          });
        }
      });
    }
    form.value.recipe = newRecipe;
    
    showAiRecipeModal.value = false;
    alert('AIによるレシピ自動生成が完了しました！内容を確認・調整してください。');
  } catch (err) {
    console.error('AI Recipe Error:', err);
    aiRecipeError.value = 'エラーが発生しました: ' + err.message;
  } finally {
    isGeneratingAiRecipe.value = false;
  }
};
`;

if (!content.includes('const openAiRecipeModal =')) {
  content = content.replace('const saveMenu = async () => {', state_vars + '\nconst saveMenu = async () => {');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Injected missing AI recipe JS functions.');
} else {
  console.log('Functions already injected.');
}
