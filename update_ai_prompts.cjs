const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Modify generateInstructionsOnlyWithAi
const oldPrompt1 = `    const promptText = \`あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」を使って作る料理の「簡素で簡潔な調理方法（混同・汚染防止に配慮）」だけを作成してください。
あまり詳しく書きすぎず、今までのようなシンプルで簡潔な手順で十分です。

【対象の料理】
\$\{form.value.name || form.value.masterName || '新規料理'\}

【決定済みの食材リスト】
\$\{ingredientsText\}

【指示】
- 各手順は長文にならず、簡潔でシンプルな表現にとどめてください。
- 手順を出力する際は、必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行って見やすく出力してください。
- 出力は純粋な手順のテキストのみを返してください。JSONやMarkdownの装飾（\\\`\\\`\\\`など）、前置きの挨拶は不要です。\`;`;

const newPrompt1 = `    const promptText = \`あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」と「変更内容」をもとに、「具体的な調理方法（混同・汚染防止を含む詳細手順）」、「備考欄（JAS監査上重要な管理事項）」、「料理名（JAS登録名称）」の3つを提案してください。

【現在の料理名】
\$\{form.value.name || form.value.masterName || '新規料理'\}

【決定済みの食材リスト】
\$\{ingredientsText\}

【変更内容（スペック更新時）】
\$\{form.value.changeDetails || '特になし'\}

【指示】
- 「具体的な調理方法」は、長文にならず、簡潔でシンプルな表現にとどめてください。必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行ってください。
- 「備考欄」には、上記「変更内容」に仕入れ終了や食材変更の記載があれば、それに触れてください（例：「※〇〇は途中で終了するため、以降は△△で代用する」など）。特に変更がなければ空白で構いません。
- 「料理名」には、現在の食材リストにふさわしいJAS登録名称を提案してください（基本は現在の料理名を踏襲しつつ、メイン食材が変わっていれば調整）。
- 出力は必ず以下の形式の厳密なJSONのみを返してください。Markdownの装飾（\\\`\\\`\\\`など）は不要です。
{
  "menuName": "提案する料理名",
  "cookingInstructions": "調理手順（1. 2. のように番号ごとに改行）",
  "remarks": "備考欄のテキスト"
}\`;`;

content = content.replace(oldPrompt1, newPrompt1);

const oldParse1 = `    form.value.cookingInstructions = responseText.replace(/\\\`\\\`\\\`.*?\\n/g, '').replace(/\\\`\\\`\\\`/g, '').trim();`;
const newParse1 = `    const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) throw new Error('AIからJSONを抽出できませんでした。');
    const parsed = JSON.parse(jsonMatch[0]);
    form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
    form.value.remarks = parsed.remarks || form.value.remarks;`;

content = content.replace(oldParse1, newParse1);

// 2. Modify generateRecipeWithAi
const oldPrompt2Format = `  【出力形式】
  必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
  {
    "menuName": "立案した料理名",
    "cookingInstructions": "調理手順（番号ごとに\\nで改行）",
    "notes": "備考（代替食材の案内などがあれば記載）",
    "recipe": [
      {
        "ingredientId": "リストにあるID",
        "amount": "1食あたりのグラム数（数字のみ。例: 50）"
      }
    ]
  }`;

const newPrompt2Format = `  【出力形式】
  必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
  {
    "changeDetails": "変更内容（食材の仕入れ終了・代用があればここに簡潔に記載。なければ空文字）",
    "recipe": [
      {
        "ingredientId": "リストにあるID",
        "amount": "1食あたりのグラム数（数字のみ。例: 50）"
      }
    ]
  }`;

content = content.replace(oldPrompt2Format, newPrompt2Format);

const oldParse2 = `      form.value.name = parsed.menuName || form.value.name;
      form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
      if (parsed.notes) {
        form.value.remarks = (form.value.remarks ? form.value.remarks + '\\n\\n' : '') + parsed.notes;
      }`;

const newParse2 = `      if (parsed.changeDetails) {
        form.value.changeDetails = parsed.changeDetails;
      }`;

content = content.replace(oldParse2, newParse2);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully updated MenusView.vue AI generation logic.");
