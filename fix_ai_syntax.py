import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the entire generateRecipeWithAi function.
# Let's find its start and end.
start_str = "const generateRecipeWithAi = async () => {"
if start_str in content:
    start_idx = content.find(start_str)
    # Find the matching closing bracket for generateRecipeWithAi
    end_idx = content.find("};\n", start_idx)
    
    if end_idx != -1:
        # The new function without nested template literals
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
      conditionText = '- 今回は既存レシピの「改定」です。既存の食材の分量を大きく変えすぎないように調整し、期間内に仕入れがなかった食材は除外してください。\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
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
    form.value.recipe = newRecipe;
    
    showAiRecipeModal.value = false;
    alert('AIによるレシピ自動生成が完了しました！内容を確認・調整してください。');
  } catch (err) {
    console.error('AI Recipe Error:', err);
    aiRecipeError.value = 'エラーが発生しました: ' + err.message;
  } finally {
    isGeneratingAiRecipe.value = false;
  }
}"""
        
        # Replace the old function with the new one
        new_content = content[:start_idx] + new_func + content[end_idx+1:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Fixed syntax error in generateRecipeWithAi")
    else:
        print("End of generateRecipeWithAi not found")
else:
    print("generateRecipeWithAi function not found")

