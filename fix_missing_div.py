import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the missing </div>
old_str = """                    <button class="btn btn-primary btn-sm flex items-center gap-1" @click="addRecipeRow">
                    <Plus :size="16" /> 原材料を追加
                  </button>
                </div>

                <div class="designer-recipe-rows">"""

new_str = """                    <button class="btn btn-primary btn-sm flex items-center gap-1" @click="addRecipeRow">
                      <Plus :size="16" /> 原材料を追加
                    </button>
                  </div>
                </div>

                <div class="designer-recipe-rows">"""

if old_str in text:
    text = text.replace(old_str, new_str)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed missing div tag!")
else:
    print("Could not find the target string to replace.")
