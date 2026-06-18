import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """                  <h4 class="font-bold flex items-center gap-1 text-dark" style="margin: 0; font-weight: 700; color: #1e293b;"><Scale :size="18" /> レシピ原材料配合 (1食あたり)</h4>
                  <button class="btn btn-primary btn-sm flex items-center gap-1" @click="addRecipeRow">"""

new_str = """                  <h4 class="font-bold flex items-center gap-1 text-dark" style="margin: 0; font-weight: 700; color: #1e293b;"><Scale :size="18" /> レシピ原材料配合 (1食あたり)</h4>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" @click.prevent="openAiRecipeModal" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-size: 0.85rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 4px; font-weight: bold;">
                      <Sparkles :size="14" /> AIで配合を自動生成
                    </button>
                    <button class="btn btn-primary btn-sm flex items-center gap-1" @click="addRecipeRow">"""

if old_str in text:
    text = text.replace(old_str, new_str)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Added the AI button back.")
else:
    print("Could not find the target string to replace.")
