import re

filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace block
start_idx = content.find('<div class="excel-spec-sheet-v2"')
end_idx = content.find('<!-- F. 適合及び表示基準詳細 -->')
end_idx = content.find('</div>\n          </div>', end_idx) + 24

block = content[start_idx:end_idx]

# 1. Borders
block = re.sub(r'border: 1\.5px solid #000;?', 'border: 1px solid #dcd1be;', block)
block = re.sub(r'border: 1px solid #000;?', 'border: 1px solid #dcd1be;', block)
block = re.sub(r'border-bottom: 2px solid #000;?', 'border-bottom: 2px solid #801c15;', block)
block = re.sub(r'border-bottom: 1px solid #000;?', 'border-bottom: 1px solid #dcd1be;', block)
block = re.sub(r'border-right: 1\.5px solid #000;?', 'border-right: 1px solid #dcd1be;', block)
block = re.sub(r'border-right: 1.5px solid #000;?', 'border-right: 1px solid #dcd1be;', block)

# 2. Colors
block = re.sub(r'color: #000;?', 'color: #3e2723;', block)
block = re.sub(r'background: #f8fafc;?', 'background: #faf8f5;', block)
block = re.sub(r'background-color: #f8fafc;?', 'background-color: #faf8f5;', block)
block = re.sub(r'background-color: #f0fdf4;?', 'background-color: #f6fdf9;', block)

# 3. Titles
block = re.sub(r'<div class="sheet-section-title">■ (.*?)</div>', r'<div class="sheet-section-title" style="color: #801c15; border-left: 3px solid #801c15; padding-left: 6px; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">\1</div>', block)
block = re.sub(r'<div class="sheet-section-title mt-4">■ (.*?)</div>', r'<div class="sheet-section-title mt-4" style="color: #801c15; border-left: 3px solid #801c15; padding-left: 6px; font-weight: bold; margin-bottom: 4px; font-size: 0.85rem;">\1</div>', block)

content = content[:start_idx] + block + content[end_idx:]

# Print CSS block
css_start = content.find('.excel-spec-sheet-v2 {')
if css_start != -1:
    css_end = content.find('</style>', css_start)
    css_block = content[css_start:css_end]

    css_block = re.sub(r'border: 1\.5px solid #000000 !important;', 'border: 1px solid #dcd1be !important;', css_block)
    css_block = re.sub(r'background-color: #fffcf0 !important;', 'background-color: #faf8f5 !important; color: #5c3d2e !important;', css_block)
    css_block = re.sub(r'background-color: #ffffff !important;', 'background-color: #ffffff !important; color: #3e2723 !important;', css_block)

    # enforce borders in print
    css_block += """
  .excel-spec-sheet-v2 table { border-collapse: collapse !important; }
  .excel-spec-sheet-v2 th, .excel-spec-sheet-v2 td, .excel-spec-sheet-v2 .photo-box, .excel-spec-sheet-v2 .approval-stamps-table {
    border: 1px solid #dcd1be !important;
  }
  .sheet-section-title { color: #801c15 !important; border-left: 3px solid #801c15 !important; }
"""
    content = content[:css_start] + css_block + content[css_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout design successfully patched.")
