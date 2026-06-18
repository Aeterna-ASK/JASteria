import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_func_start = 'const openAiRecipeModal = () => {'
new_func_start = 'const openAiRecipeModal = () => {\n  alert("【システム通知】ボタンの通信は正常です。\\nもしこのアラートが出てモーダルが開かない場合は、画面の描画エラーです。");\n  console.log("Button clicked! Opening AI Modal.");'

content = content.replace(old_func_start, new_func_start)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alert restored")
