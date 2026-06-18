import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = "          if (ing) availableIngredients.push({ id: ing.id, name: ing.name, type: ing.type });"
new_str = """          if (ing && !ing.name.includes('フローラル豆') && !ing.name.includes('テンメンジャン')) {
            availableIngredients.push({ id: ing.id, name: ing.name, type: ing.type });
          }"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Excluded specific ingredients from AI generation successfully.")
else:
    print("Could not find old string to replace.")
