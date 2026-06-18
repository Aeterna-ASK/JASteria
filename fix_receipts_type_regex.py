import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    return m.group(1) + "      ingredientType: ing ? ing.type : 'general',\n" + m.group(2)

new_content = re.sub(
    r'(ingredientName: ing \? ing\.name : [^\n]+,\n)(      supplier: ing \? ing\.supplier : \'\',\n)',
    repl,
    content
)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added ingredientType!")
else:
    print("Regex failed.")
