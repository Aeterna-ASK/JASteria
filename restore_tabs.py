import re

# File paths
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'
current_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

# Read old file
with open(broken_file, 'r', encoding='utf-8') as f:
    old_text = f.read()

# Read current file
with open(current_file, 'r', encoding='utf-8') as f:
    curr_text = f.read()

# Extract the missing parts from old file
# From `</div>` after `form.description` up to the end of `activeFormTab === 'jas'` div.
# Looking at the old file structure:
match_old = re.search(r'(<div v-if="activeFormTab === \'recipe\'".*?<div class="form-group mb-4" style="margin-bottom: 1rem;">\s*<label style="font-weight: 600; font-size: 0\.85rem; margin-bottom: 0\.25rem; display: block;">.*?<\/label>\s*<textarea v-model="form\.cookingInstructions".*?<\/textarea>\s*<\/div>)', old_text, re.DOTALL)

if match_old:
    missing_content = match_old.group(1)
    
    # We need to apply our previous fixes to missing_content!
    # Fix 1: The dropdown options
    missing_content = re.sub(
        r'<select v-model="item\.ingredientId" class="input-organic select-organic" style="width: 100%;">.*?<\/select>',
        r'''<select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <optgroup label="食材（一般・有機）">
                          <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                            {{ ing.name }} ({{ ing.type === 'organic' ? '有機JAS適合' : (ing.type === 'salt_water' ? '水塩(除外対象)' : '一般材料') }})
                          </option>
                        </optgroup>
                        <optgroup label="自家製（登録済みレシピ）">
                          <option v-for="m in menus" :key="m.id" :value="m.id">
                            {{ m.name }}
                          </option>
                        </optgroup>
                      </select>''',
        missing_content,
        flags=re.DOTALL
    )
    
    # Fix 2: The cookingInstructions button
    missing_content = re.sub(
        r'<div class="form-group mb-4" style="margin-bottom: 1rem;">\s*<label style="font-weight: 600; font-size: 0\.85rem; margin-bottom: 0\.25rem; display: block;">具体的な調理方法（混同・汚染防止を含む詳細手順）<\/label>\s*<textarea v-model="form\.cookingInstructions".*?<\/textarea>\s*<\/div>',
        r'''<div class="form-group mb-4" style="margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0;">具体的な調理方法（混同・汚染防止を含む詳細手順）</label>
                    <button type="button" @click.prevent="generateInstructionsOnlyWithAi" :disabled="isGeneratingInstructions" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-size: 0.75rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 4px;">
                      <Sparkles :size="12" /> {{ isGeneratingInstructions ? '生成中...' : 'AIで手順を再生成' }}
                    </button>
                  </div>
                  <textarea v-model="form.cookingInstructions" rows="3" class="input-organic" @keydown.enter="handleCookingInstructionsKeydown" placeholder="改行すると自動で番号が振られます。"></textarea>
                </div>''',
        missing_content,
        flags=re.DOTALL
    )
    
    # Now, find the corrupted part in current file and replace it.
    # The corrupted part is just the cookingInstructions div that replaced EVERYTHING.
    # We need to find:
    match_curr = re.search(
        r'(<div class="form-group" style="margin-bottom: 1rem;">\s*<label style="font-weight: 600; font-size: 0\.85rem; margin-bottom: 0\.25rem; display: block;">説明文.*?<\/textarea>\s*<\/div>\s*)<div class="form-group mb-4" style="margin-bottom: 1rem;">\s*<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0\.25rem;">\s*<label style="font-weight: 600; font-size: 0\.85rem; display: block; margin-bottom: 0;">具体的な調理方法.*?<\/textarea>\s*<\/div>',
        curr_text,
        re.DOTALL
    )
    
    if match_curr:
        prefix = match_curr.group(1) # description div
        
        # We need to append the missing_content
        replacement = prefix + "              </div>\n\n              <!-- セクション2: レシピ構成 -->\n              " + missing_content
        
        curr_text = curr_text[:match_curr.start()] + replacement + curr_text[match_curr.end():]
        print("Restored missing content!")
        
        with open(current_file, 'w', encoding='utf-8') as f:
            f.write(curr_text)
    else:
        print("Could not find current corrupted block")

else:
    print("Could not find missing content in old file")
