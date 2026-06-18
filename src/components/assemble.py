import os

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
chunk_1450_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1450'
chunk_1650_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1650'

print("Assembling perfectly reconstructed MenusView.vue file...")

# 1. Read top part of current file (first 1449 lines)
with open(file_path, 'r', encoding='utf-8') as f:
    current_lines = f.readlines()

top_part = current_lines[0:1449]
print(f"Top part extracted: {len(top_part)} lines.")

# 2. Read middle recovered chunks (restoring HTML template)
with open(chunk_1450_path, 'r', encoding='utf-8') as f:
    chunk_1450 = f.read()
with open(chunk_1650_path, 'r', encoding='utf-8') as f:
    chunk_1650 = f.read()

# Make sure there is a single newline separating them
middle_part = chunk_1450.strip() + '\n\n' + chunk_1650.strip()
print(f"Middle part compiled (ends with style scoped).")

# 3. Find the <style scoped> tag inside the current file to extract the bottom styles cleanly
style_scoped_index = -1
for idx, line in enumerate(current_lines):
    # Find the style scoped tag inside the styles section (typically past line 1700)
    if idx > 1500 and '<style scoped>' in line:
        style_scoped_index = idx
        break

if style_scoped_index == -1:
    # Fallback to absolute index if not found
    print("Warning: <style scoped> tag not found beyond line 1500, searching full file...")
    for idx, line in enumerate(current_lines):
        if '<style scoped>' in line:
            style_scoped_index = idx
            break

if style_scoped_index == -1:
    print("Error: Could not locate <style scoped> tag in current MenusView.vue! Assembly halted.")
    exit(1)

print(f"Found <style scoped> in current file at line {style_scoped_index + 1}.")

# Extract all styles after the style scoped tag
bottom_part = current_lines[style_scoped_index + 1:]
print(f"Bottom styles part extracted: {len(bottom_part)} lines.")

# Combine everything
# Note: middle_part already ends with <style scoped>. So we just join top, middle, and bottom.
final_text = ''.join(top_part).rstrip() + '\n\n' + middle_part.strip() + '\n' + ''.join(bottom_part)

# Write output
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_text)

print(f"Assembly successful! Rebuilt file is {len(final_text)} characters.")
