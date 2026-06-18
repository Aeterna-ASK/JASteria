import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# The missing block starts after `substituteIngredients.push(ing.name);\n    });`
# And before `const resData = await response.json();`

missing_block = """
    const apiKey = state.restaurantInfo.geminiApiKey;
    if (!apiKey) throw new Error('設定画面でGemini APIキーが設定されていません。');
    
    const isRevision = !!currentId.value;
    
    let conditionText = '';
    if (isRevision) {
      const masterNameContext = form.value.masterName ? `\\n- 【重要】共通メニュー名（集計グループ）は「${form.value.masterName}」です。この料理の種類から大幅にずれたレシピにならないようにしてください。` : '';
      conditionText = '- 今回は既存レシピの「改定」です。' + masterNameContext + '\\n- 【重要】指定期間内に仕入れ履歴がない（利用可能な食材リストに存在しない）食材は、既存レシピにあっても必ず除外（削除）してください。\\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材が含まれている場合、それがこの料理（共通メニュー名）のコンセプトに合う代替品・追加食材であれば必要に応じて追加（マージ）してください。スパゲッティなどの全く無関係な食材を無理に混ぜて別の料理にしないでください。\\n- 既存の食材の分量を大きく変えすぎないように調整してください。\\n\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    } else {
      const dishConcept = form.value.name || form.value.masterName;
      const conceptText = dishConcept ? `\\n- 【重要】作成する料理のコンセプト（メニュー名）は「${dishConcept}」です。この料理の種類から大幅にずれたレシピ（無関係な食材の混ぜ合わせなど）にならないようにしてください。` : '';
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g' + conceptText;
    }

    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区分: ' + (i.type === 'organic' ? '有機JAS品' : '一般食品')).join('\\n');

    let substituteNotes = '';
    if (endedIngredients.length > 0) {
      substituteNotes = `\\n- 【重要】以下の食材は提供期間の途中で納品が終了します: ${endedIngredients.join(', ')}。\\nもしこれらの終了予定食材をレシピに使用した場合、必ず\`notes\`（備考）欄に「※○○は途中で終了するため、以降は[代用食材]で代用します」という注意書きを記述してください。\\n[代用候補食材]: ${substituteIngredients.length > 0 ? substituteIngredients.join(', ') : '他の利用可能な食材'}`;
    }

    const promptText = `あなたはプロのレストランのシェフ兼メニュー開発者です。
以下の「利用可能な食材リスト（スタート時に存在する食材）」のみを使用して、レシピを一つ考案してください。

【制約条件】
- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）
- レストランのコンセプト上、可能な限り「有機JAS品(type: organic)」の重量割合が95%以上になるよう配慮してください。ただし料理として成立させるために必要な場合は「一般食品(type: general)」も適宜使用してください。
- 具体的な調理方法（混同・汚染防止を含む詳細手順）を出力する際は、必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行って見やすく出力してください。${substituteNotes}
${conditionText}

【利用可能な食材リスト】
${ingredientsText}

【出力形式】
必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
{
  "menuName": "考案した料理名",
  "cookingInstructions": "調理手順（番号ごとに\\\\nで改行）",
  "notes": "備考（代替食材の案内などがあれば記載）",
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
"""

text = text.replace("    const resData = await response.json();", missing_block + "\n    const resData = await response.json();")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Restored missing block")
