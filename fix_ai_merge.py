import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "const generateRecipeWithAi = async () => {"
start_idx = content.find(start_str)
end_idx = content.find("isGeneratingAiRecipe.value = false;\n  }\n};", start_idx)

if start_idx != -1 and end_idx != -1:
    # 既存の generateRecipeWithAi 関数を完全に置換する
    end_idx += len("isGeneratingAiRecipe.value = false;\n  }\n};")
    
    new_func = """const generateRecipeWithAi = async () => {
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
    
    let conditionText = '';
    if (isRevision) {
      conditionText = '- 今回は既存レシピの「改定」です。\\n- 【重要】指定期間内に仕入れの履歴がない（利用可能な食材リストに存在しない）食材は、既存レシピにあっても必ず除外（削除）してください。\\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材（代替品や新規調達品など）が含まれている場合、それらは料理として成立する範囲で積極的に追加（マージ）し、適切な分量を設定してください。\\n- 既存の食材の分量を大きく変えすぎないように調整してください。\\n\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    } else {
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g';
    }

    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区分: ' + (i.type === 'organic' ? '有機JAS品' : '一般食品')).join('\\n');

    const promptText = `あなたはプロのレストランのシェフ兼メニュー開発者です。
以下の「利用可能な食材リスト」のみを使用して、レシピを一つ考案してください。

【制約条件】
- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）
- レストランのコンセプト上、可能な限り「有機JAS品(type: organic)」の重量割合が95%以上になるように配分してください。ただし料理として成立させるために必要な場合は「一般食品(type: general)」も適宜使用してください。
${conditionText}

【利用可能な食材リスト】
${ingredientsText}

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
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
    
    // AIが取りこぼした新規食材の強制マージ処理（改定時の補完）
    if (isRevision) {
       const existingOriginalIds = new Set(form.value.recipe.map(r => r.ingredientId));
       const aiIncludedIds = new Set(newRecipe.map(r => r.ingredientId));
       
       availableIngredients.forEach(ing => {
         // 元のレシピになく、AIのレシピにも含まれていない食材（＝完全な新規仕入れ食材）を強制追加
         if (!existingOriginalIds.has(ing.id) && !aiIncludedIds.has(ing.id)) {
           newRecipe.push({
              ingredientId: ing.id,
              name: ing.name,
              amount: 0, // 0gで追加しユーザーに気付かせる
              type: ing.type,
              supplier: ing.supplier || '',
              hasCertificate: ing.hasCertificate || false,
              hasJasLabelVerified: ing.hasJasLabelVerified || false
           });
         }
       });
    }

    form.value.recipe = newRecipe;
    
    showAiRecipeModal.value = false;
    alert('AIによるレシピ自動生成が完了しました！新規食材が追加された場合、分量が0gになっていることがありますので調整してください。');
  } catch (err) {
    console.error('AI Recipe Error:', err);
    aiRecipeError.value = 'エラーが発生しました: ' + err.message;
  } finally {
    isGeneratingAiRecipe.value = false;
  }
};"""

    new_content = content[:start_idx] + new_func + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated generateRecipeWithAi with explicit merge logic")
else:
    print("Could not find boundaries for generateRecipeWithAi")

