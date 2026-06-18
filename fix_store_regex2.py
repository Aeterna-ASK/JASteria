import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Fix baseName regex to strip version numbers even if they are inside parentheses
# Old: const baseName = (menu.name || '').replace(/\\s*(第|No\\.?)\\s*\\d+.*/g, '').trim();
# New: const baseName = (menu.name || '').replace(/\\s*[\\(（]?(第|No\\.?)\\s*\\d+.*?[\\)）]?/g, '').trim();

# Actually, the old code might have been slightly different because of my previous fixes.
# Let's just find the exact line.
import re
new_text = re.sub(
    r"const baseName = \(menu\.name \|\| ''\)\.replace\([^)]+\)\.trim\(\);",
    r"const baseName = (menu.name || '').replace(/\\s*[\\(（]?(第|No\\.?)\\s*\\d+.*?([\\)）]|$)/g, '').trim();",
    store_text
)

# Also fix getNum to handle parentheses just in case
new_text = re.sub(
    r"const match = name\.match\([^)]+\);",
    r"const match = name.match(/[\\(（]?(第(\\d+)版|No\\.?\\s*(\\d+))[\\)）]?/i);",
    new_text
)

# And fix the version name generation
new_text = re.sub(
    r"const match = m\.name\.match\([^)]+\);",
    r"const match = m.name.match(/[\\(（]?(第(\\d+)版|No\\.?\\s*(\\d+))[\\)）]?/i);",
    new_text
)


with open(store_file, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Fixed regexes.")
