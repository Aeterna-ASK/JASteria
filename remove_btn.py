import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the button div from the template
button_pattern = r'    <div style="background-color: #ffeaea; padding: 10px; text-align: center; border-bottom: 2px solid red;" class="no-print">\n\s*<button @click="forceRestoreBagnaCauda" style="background: red; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 16px;">\n\s*【緊急】バーニャカウダ完全復旧を実行\n\s*</button>\n\s*</div>\n'
text = re.sub(button_pattern, '', text)

# 2. Remove the forceRestoreBagnaCauda js wrapper
js_pattern = r'const forceRestoreBagnaCauda = async \(\) => \{.*?\n\};'
text = re.sub(js_pattern, '', text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed emergency restore button and script")
