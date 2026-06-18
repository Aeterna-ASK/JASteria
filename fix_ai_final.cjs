const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// The autohealer replaced lines starting from "const ingredientsText" up to "【絶対条件】..." with:
// if (parsed.changeDetails) {
//   form.value.changeDetails = parsed.changeDetails;
// }

// I will just use a regex to grab the WHOLE `generateRecipeWithAi` block from `const generateRecipeWithAi = async () => {` until `isGeneratingAiRecipe.value = false;\n  }\n};` and rewrite it correctly.
const regex = /const generateRecipeWithAi = async \(\) => \{[\s\S]*?isGeneratingAiRecipe\.value = false;\n  \}\n\};/g;

const newFunc = `const generateRecipeWithAi = async () => {
  console.log("generateRecipeWithAi button clicked!");
  if (!aiRecipeConfig.value.startDate || !aiRecipeConfig.value.endDate) {
    aiRecipeError.value = '対象期間を入力してください。';
    return;
  }
  isGeneratingAiRecipe.value = true;
  aiRecipeError.value = '';
  
  try {
    // 1. Start Ingredients
    const sDate = new Date(aiRecipeConfig.value.startDate);
    const eDateStart = new Date(aiRecipeConfig.value.startDate);
    sDate.setDate(sDate.getDate() - 15);
    
    const startReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= sDate && d <= eDateStart;
    });
    
    const availableIngredients = [];
    const startUsedIds = new Set();
    startReceipts.forEach(r => {
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (id && !startUsedIds.has(id)) {
          startUsedIds.add(id);
          const ing = state.ingredients.find(i => i.id === id);
          if (ing && !ing.name.includes('フローラル豆') && !ing.name.includes('テンメンジャン')) {
            availableIngredients.push({ id: ing.id, name: ing.name, type: ing.type });
          }
        }
      });
    });

    if (availableIngredients.length === 0) {
      throw new Error('開始時点(前15日以内)に仕入れられた食材が見つかりませんでした。');
    }

    // 2. Timeline Analysis
    const fullEndDate = new Date(aiRecipeConfig.value.endDate);
    const timelineReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d > eDateStart && d <= fullEndDate;
    });

    const lastDeliveryMap = {};
    const newIngredientIds = new Set();
    timelineReceipts.forEach(r => {
      const dStr = r.date;
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (!id) return;
        if (!lastDeliveryMap[id] || dStr > lastDeliveryMap[id]) lastDeliveryMap[id] = dStr;
        if (!startUsedIds.has(id)) newIngredientIds.add(id);
      });
    });

    const endedIngredients = [];
    const substituteIngredients = [];
    
    startUsedIds.forEach(id => {
      const lastDel = lastDeliveryMap[id] || eDateStart.toISOString().split('T')[0];
      const lastD = new Date(lastDel);
      const daysDiff = (fullEndDate - lastD) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 14) {
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) endedIngredients.push(\`\${ing.name}\`);
      }
    });

    newIngredientIds.forEach(id => {
      const ing = state.ingredients.find(i => i.id === id);
      if (ing) substituteIngredients.push(ing.name);
    });
    

    const apiKey = state.restaurantInfo.geminiApiKey;
    if (!apiKey) throw new Error('設定画面でGemini APIキーが設定されていません。');
    
    const isRevision = !!currentId.value;
    
    let conditionText = '';
    if (isRevision) {
      const masterNameContext = form.value.masterName ? \`\\n- 【重要】共通メニュー名（集計グループ）は「\${form.value.masterName}」です。この料理の種類から大幅にずれたレシピにならないようにしてください。\` : '';
      conditionText = '- 今回は既存レシピの「改定」です。' + masterNameContext + '\\n- 【重要】指定期間内に仕入れ履歴がなく利用可能な食材リストに存在しない食材は、既存レシピにあっても必ず除外（削除）してください。\\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材が含まれている場合、それがこの料理（共通メニュー名）のコンセプトに合う代替品・追加食材であれば必要に応じて追加（マージ）してください。スパゲッティなどの全く無関係な食材を無理に混ぜて別の料理にしないでください。\\n- 既存の食材の分量を大きく変えすぎないように調整してください。\\n\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    } else {
      const dishConcept = form.value.name || form.value.masterName;
      const conceptText = dishConcept ? \`\\n- 【重要】作成する料理のコンセプト（メニュー名）は「\${dishConcept}」です。この料理の種類から大幅にずれたレシピ（無関係な食材の混ぜ合わせなど）にならないようにしてください。\` : '';
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g' + conceptText;
    }

    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区分: ' + (i.type === 'organic' ? '有機JAS品' : '一般食品')).join('\\n');

    let substituteNotes = '';
    if (endedIngredients.length > 0) {
      substituteNotes = \`\\n- 【重要】以下の食材は提供期間の途中で納品が終了します: \${endedIngredients.join(', ')}。\\nもしこれらの終了予定食材をレシピの「変更内容」として処理する場合、\`changeDetails\`に「※○○は途中で終了するため、以降は[代用食材]で代用します」という注意書きを記述してください。\\n[代用候補食材]: \${substituteIngredients.length > 0 ? substituteIngredients.join(', ') : '他の利用可能な食材'}\`;
    }

    const promptText = \`あなたはプロのレストランのシェフ兼メニュー開発者です。
以下の「利用可能な食材リスト（スタート時に存在する食材）」のみを使用して、レシピを一つ考案してください。

【制約条件】
- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）
- 【絶対条件】「有機フローラル豆」および「有機テンメンジャン」は料理には使用できないため、絶対にレシピに含めないでください。
- レストランのコンセプト上、可能な限り「有機JAS品(type: organic)」の重量割合が95%以上になるよう配慮してください。ただし料理として成立させるために必要な場合は「一般食品(type: general)」も適宜使用してください。\${substituteNotes}
\${conditionText}

【利用可能な食材リスト】
\${ingredientsText}

【出力形式】
必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
{
  "changeDetails": "変更内容（食材の仕入れ終了・代用があればここに簡潔に記載。なければ空文字）",
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
    
    if (parsed.changeDetails) {
      form.value.changeDetails = parsed.changeDetails;
    }
    
    // 自動で期限日と見直し日を設定
    if (aiRecipeConfig.value.endDate) {
      form.value.deadline = aiRecipeConfig.value.endDate;
      const endD = new Date(aiRecipeConfig.value.endDate);
      endD.setDate(endD.getDate() - 5);
      form.value.reviewDate = endD.toISOString().split('T')[0];
    }
    
    const newRecipe = [];
    if (parsed.recipe && Array.isArray(parsed.recipe)) {
      parsed.recipe.forEach(pr => {
        const ing = state.ingredients.find(i => i.id === pr.ingredientId);
        if (ing) {
          newRecipe.push({
            ingredientId: ing.id,
            name: ing.name,
            amount: pr.amount
          });
        }
      });
    }
    form.value.recipe = newRecipe;
    
    showAiRecipeModal.value = false;
    // alert('AIがレシピを提案しました。確認して必要なら微調整してください。');
  } catch (e) {
    console.error(e);
    aiRecipeError.value = 'AIレシピ生成に失敗しました: ' + e.message;
  } finally {
    isGeneratingAiRecipe.value = false;
  }
};`;

content = content.replace(regex, newFunc);
fs.writeFileSync(file, content, 'utf8');
console.log("Successfully fixed generateRecipeWithAi.");
