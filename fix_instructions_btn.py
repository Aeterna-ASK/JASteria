import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the UI
old_ui = """                <div class="form-group mb-4" style="margin-bottom: 1rem;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">具体的な調理方法（混同・汚染防止を含む詳細手順）</label>
                  <textarea v-model="form.cookingInstructions" rows="3" class="input-organic" @keydown.enter="handleCookingInstructionsKeydown" placeholder="改行で自動で番号が振られます。"></textarea>
                </div>"""

# Because of potential mojibake, using regex
ui_pattern = re.compile(
    r'<div class="form-group mb-4" style="margin-bottom: 1rem;">\s*<label style="font-weight: 600; font-size: 0\.85rem; margin-bottom: 0\.25rem; display: block;">.*?<\/label>\s*<textarea v-model="form\.cookingInstructions".*?<\/textarea>\s*<\/div>',
    re.DOTALL
)

new_ui = """                <div class="form-group mb-4" style="margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0;">具体的な調理方法（混同・汚染防止を含む詳細手順）</label>
                    <button type="button" @click.prevent="generateInstructionsOnlyWithAi" :disabled="isGeneratingInstructions" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-size: 0.75rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 4px;">
                      <Sparkles :size="12" /> {{ isGeneratingInstructions ? '生成中...' : 'AIで手順を再生成' }}
                    </button>
                  </div>
                  <textarea v-model="form.cookingInstructions" rows="3" class="input-organic" @keydown.enter="handleCookingInstructionsKeydown" placeholder="改行で自動で番号が振られます。"></textarea>
                </div>"""

if ui_pattern.search(text):
    text = ui_pattern.sub(new_ui, text)
    print("Updated UI")
else:
    print("Could not find UI pattern")


# 2. Add `isGeneratingInstructions` and `generateInstructionsOnlyWithAi`
logic_to_insert = """const isGeneratingInstructions = ref(false);

const generateInstructionsOnlyWithAi = async () => {
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
      return `- ${name}: ${item.amount}g`;
    }).join('\\n');

    const promptText = `あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」を使って作る料理の「具体的な調理方法（混同・汚染防止を含む詳細手順）」だけを作成してください。

【対象の料理】
${form.value.name || form.value.masterName || '新規料理'}

【決定済みの食材リスト】
${ingredientsText}

【指示】
- 手順を出力する際は、必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行って見やすく出力してください。
- 出力は純粋な手順のテキストのみを返してください。JSONやMarkdownの装飾（\`\`\`など）、前置きの挨拶は不要です。`;

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
    
    form.value.cookingInstructions = responseText.replace(/```.*?\\n/g, '').replace(/```/g, '').trim();

  } catch (e) {
    console.error(e);
    alert('AIによる手順生成に失敗しました: ' + e.message);
  } finally {
    isGeneratingInstructions.value = false;
  }
};
"""

# Insert right before `const handleCookingInstructionsKeydown`
if "const handleCookingInstructionsKeydown" in text:
    text = text.replace("const handleCookingInstructionsKeydown", logic_to_insert + "\nconst handleCookingInstructionsKeydown")
    print("Added generateInstructionsOnlyWithAi")
else:
    print("Could not find insertion point")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
