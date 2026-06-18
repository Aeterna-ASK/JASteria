const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'const generateInstructionsOnlyWithAi = async () => {';
const endStr = 'isGeneratingInstructions.value = false;\n  }\n};';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endStr.length);

  const newFunc = `const generateInstructionsOnlyWithAi = async () => {
  if (!form.value.recipe || form.value.recipe.length === 0) {
    alert('まずは食材（レシピ構成）を入力してください。');
    return;
  }
  const apiKey = state.restaurantInfo.geminiApiKey;
  if (!apiKey) {
    alert('設定画面でGemini APIキーを設定してください。');
    return;
  }

  isGeneratingInstructions.value = true;
  try {
    const ingredientsText = form.value.recipe.map(item => {
      let name = '不明';
      if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
        const sm = state.menus.find(m => m.id === item.ingredientId);
        if (sm) name = '[自家製] ' + sm.name;
      } else {
        const ing = state.ingredients.find(i => i.id === item.ingredientId);
        if (ing) name = ing.name;
      }
      return \`- \${name}: \${item.amount}g\`;
    }).join('\\n');

    const promptText = \`あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」と「変更内容」をもとに、「具体的な調理方法（混同・汚染防止を含む詳細手順）」、「備考欄（JAS監査上重要な管理事項）」、「料理名（JAS登録名称）」の3つを提案してください。

【現在の料理名】
\${form.value.name || form.value.masterName || '新規料理'}

【決定済みの食材リスト】
\${ingredientsText}

【変更内容（スペック更新時）】
\${form.value.changeDetails || '特になし'}

【指示】
- 「具体的な調理方法」は、長文にならず、簡潔でシンプルな表現にとどめてください。必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行ってください。
- 「備考欄」には、上記「変更内容」に仕入れ終了や食材変更の記載があれば、それに触れてください（例：「※〇〇は途中で終了するため、以降は△△で代用する」など）。特に変更がなければ空白で構いません。
- 「料理名」には、現在の食材リストにふさわしいJAS登録名称を提案してください（基本は現在の料理名を踏襲しつつ、メイン食材が変わっていれば調整）。
- 出力は必ず以下の形式の厳密なJSONのみを返してください。Markdownの装飾（\\\`\\\`\\\`など）は不要です。
{
  "menuName": "提案する料理名",
  "cookingInstructions": "調理手順（1. 2. のように番号ごとに改行）",
  "remarks": "備考欄のテキスト"
}\`;

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
    form.value.remarks = parsed.remarks || form.value.remarks;

  } catch (e) {
    console.error(e);
    alert('AIによる手順生成に失敗しました: ' + e.message);
  } finally {
    isGeneratingInstructions.value = false;
  }
};`;

  fs.writeFileSync(file, before + newFunc + after, 'utf8');
  console.log("Successfully replaced generateInstructionsOnlyWithAi!");
} else {
  console.log("Could not find start or end index!");
  console.log("Start:", startIndex, "End:", endIndex);
}
