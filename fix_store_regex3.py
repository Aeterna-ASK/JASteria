import re
import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Fix baseName regex to strip version numbers EVEN IF inside parentheses
store_text = re.sub(
    r"const baseName = \(menu\.name \|\| ''\)\.replace\([^;]+;\n",
    r"const baseName = (menu.name || '').replace(/\\s*[\\(（]?(第|No\\.?)\\s*\\d+.*?([\\)）]|$)/g, '').trim();\n",
    store_text
)

# Fix getNum regex
old_getnum = r'''        const getNum = (name) => {
          if (!name) return 1;
          try {
            const match = name.match(/第(\d+)牁ENo\.?\s*(\d+)/i);
            if (match) return parseInt(match[1] || match[2], 10);
          } catch(e) {
            console.error("getNum error on name:", name, e);
          }
          return 1; // Base version is 1
        };'''

new_getnum = r'''        const getNum = (name) => {
          if (!name) return 1;
          try {
            const match = name.match(/[\\(（]?(第(\d+)版|No\.?\s*(\d+))[\\)）]?/i);
            if (match) return parseInt(match[2] || match[3], 10);
          } catch(e) {
            console.error("getNum error on name:", name, e);
          }
          return 1; // Base version is 1
        };'''

store_text = store_text.replace(old_getnum, new_getnum)

# Also fix the one that creates versionName if missing
old_version_name = r'''        // Generate a version name based on the name suffix if not set
        if (!m.versionName) {
          const match = m.name.match(/第(\d+)版|No\.?\s*(\d+)/i);
          if (match) {
            m.versionName = `第${match[1] || match[2]}版`;
          } else {
            m.versionName = '初期版';
          }
          modified = true;
        }'''

new_version_name = r'''        // Generate a version name based on the name suffix if not set
        if (!m.versionName) {
          const match = (m.name || '').match(/[\\(（]?(第(\d+)版|No\.?\s*(\d+))[\\)）]?/i);
          if (match) {
            m.versionName = `第${match[2] || match[3]}版`;
          } else {
            m.versionName = '初期版';
          }
          modified = true;
        }'''

store_text = store_text.replace(old_version_name, new_version_name)


with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

print("Applied final regex fixes.")
