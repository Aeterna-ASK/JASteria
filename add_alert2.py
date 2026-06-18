import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const generateRecipeWithAi = async () => {',
    'const generateRecipeWithAi = async () => {\n  console.log("generateRecipeWithAi button clicked!");\n  alert("【システム通知】AI生成を開始します");'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alert added to generateRecipeWithAi")
