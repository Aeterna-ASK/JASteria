import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the FIX BARNYA CAUDA DATA block and remove it entirely.
pattern = r'  // --- FIX BARNYA CAUDA DATA ---.*?  // --- END FIX ---'
text = re.sub(pattern, '', text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Removed old onMounted fix logic")
