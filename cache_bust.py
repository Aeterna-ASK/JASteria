import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change the button text to prove it's the latest version
content = content.replace('AIでレシピ自動生成\n                  </button>', 'AIでレシピ自動生成 (動作テスト中)\n                  </button>')

# Add an alert to the openAiRecipeModal function to bypass console filters
old_func_start = 'const openAiRecipeModal = () => {\n  console.log("Button clicked! Opening AI Modal.");'
new_func_start = 'const openAiRecipeModal = () => {\n  alert("ボタンがクリックされました！");\n  console.log("Button clicked! Opening AI Modal.");'
content = content.replace(old_func_start, new_func_start)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
    
print("Added version indicator to button and alert to function")
