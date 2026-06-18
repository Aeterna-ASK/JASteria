import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# We have TWO definitions of `const forceRestoreBagnaCauda`.
# Let's find them using regex and keep only one.

import re

# Find all occurrences of the function block up to `const saveMenu`
pattern = r'(const forceRestoreBagnaCauda = async \(\) => \{.*?\n\};)\s*(const forceRestoreBagnaCauda = async \(\) => \{)'
text = re.sub(pattern, r'\2', text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed duplicate function")
