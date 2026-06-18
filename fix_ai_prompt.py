import re
from datetime import datetime, timedelta

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the AI Prompt Logic
old_prompt_block = """    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区刁E ' + (i.type === 'organic' ? '有機JAS品E : '一般食品')).join('\\n');

    const promptText = `あなたEプロのレストランのシェフEメニュー開発老Eす、E
以下E「利用可能な食材リスト」Eみを使用して、レシピを一つ老Eしてください、E

【制紁E件、E
- 「利用可能な食材リスト」に含まれる食材以外E絶対に使用しなぁEください。（水・塩などは例外として使用可ですが極力リストE食材で成立させてくださいEE
- レストランのコンセプト上、可能な限り「有機JAS品Etype: organic)」E重量割合が95%以上になるよぁE配Eしてください。ただし料琁Eして成立させるために忁Eな場合E「一般食品(type: general)」も適宜使用してください、E
${conditionText}

【利用可能な食材リスト、E
${ingredientsText}

【E力形式、E
忁E以下E形式E厳寁EJSONのみをE力してください、EarkdownブロチEなどは付けずに、純粋なJSON斁EEだけを返してください、E
{
  "menuName": "老Eした料琁E",
  "cookingInstructions": "調琁E頁E簡潔にEE,
  "recipe": [
    {
      "ingredientId": "リストにあるID",
      "amount": "1食あたりのグラム数EE数字Eみ。侁E 50EE
    }
  ]
}
`;"""

# Let's use regex to replace this whole block because of Mojibake.
# I'll find from "const ingredientsText" up to "`;" just before "const response = await fetch"
pattern_prompt = re.compile(
    r"const ingredientsText = availableIngredients.*?\}\n`;",
    re.DOTALL
)

new_prompt_logic = """    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区分: ' + (i.type === 'organic' ? '有機JAS品' : '一般食品')).join('\\n');

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
  "cookingInstructions": "調理手順（番号ごとに\\nで改行）",
  "notes": "備考（代替食材の案内などがあれば記載）",
  "recipe": [
    {
      "ingredientId": "リストにあるID",
      "amount": "1食あたりのグラム数（数字のみ。例: 50）"
    }
  ]
}
`;"""

text = pattern_prompt.sub(new_prompt_logic, text)

# 2. Update form application logic
pattern_form_apply = re.compile(
    r"form\.value\.name = parsed\.menuName \|\| form\.value\.name;\s*form\.value\.cookingInstructions = parsed\.cookingInstructions \|\| form\.value\.cookingInstructions;\s*form\.value\.recipe = parsed\.recipe \|\| \[\];"
)

new_form_apply = """form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
    if (parsed.notes) {
      form.value.notes = (form.value.notes ? form.value.notes + '\\n\\n' : '') + parsed.notes;
    }
    form.value.recipe = parsed.recipe || [];
    
    // 自動で期限日と見直し日を設定
    if (aiRecipeConfig.value.endDate) {
      form.value.deadline = aiRecipeConfig.value.endDate;
      const endD = new Date(aiRecipeConfig.value.endDate);
      endD.setDate(endD.getDate() - 5);
      form.value.reviewDate = endD.toISOString().split('T')[0];
    }"""

text = pattern_form_apply.sub(new_form_apply, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated prompt and form apply logic")
