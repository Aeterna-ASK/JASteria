import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add image display above the menu title
card_header_pattern = r'(<div class="menu-details">\s*)(<div class="menu-title-row">)'
card_header_replacement = r'''\1<div v-if="menu.imageUrl" style="width: 100%; height: 160px; border-radius: 8px; overflow: hidden; margin-bottom: 0.75rem; background: #f8fafc;">
            <img :src="menu.imageUrl" alt="Menu Image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          \2'''

new_text = re.sub(card_header_pattern, card_header_replacement, text)

# Also add to the version history cards (if applicable)
# It's at: <div class="version-item p-3 border rounded-lg bg-white mb-2 shadow-sm">
version_header_pattern = r'(<div style="flex-grow: 1;">\s*)(<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">)'
version_header_replacement = r'''\1<div v-if="vMenu.imageUrl" style="float: right; width: 60px; height: 60px; border-radius: 6px; overflow: hidden; margin-left: 0.5rem; border: 1px solid #e2e8f0;">
                    <img :src="vMenu.imageUrl" alt="Version Image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                  </div>
                  \2'''

new_text = re.sub(version_header_pattern, version_header_replacement, new_text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Added image display to MenusView cards")
