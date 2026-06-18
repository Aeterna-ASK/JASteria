import os

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
v120_bak_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.v1.2.0.bak'
broken_repaired_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.broken_repaired'
chunk_1450_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1450'
chunk_1650_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1650'

print("Performing ULTIMATE surgical assembly using clean v1.2.0.bak header...")

# 1. Read clean header from v1.2.0.bak (lines 1 to 1449)
if not os.path.exists(v120_bak_path):
    print(f"Error: {v120_bak_path} does not exist!")
    exit(1)

with open(v120_bak_path, 'r', encoding='utf-8') as f:
    v120_lines = f.readlines()

print(f"v1.2.0.bak has {len(v120_lines)} lines.")

# Slices 1 to 1449.
# Let's inspect what line 1449 is in v1.2.0.bak.
# It should end exactly at the Teleport spec modal opening
top_part = v120_lines[0:1449]
print(f"Top part: {len(top_part)} lines.")
print(f"  First line: {top_part[0].strip()[:50]}")
print(f"  Last line: {top_part[-1].strip()[:80]}")

# 2. Read middle HTML chunks from pristine logs (completely free of diagnostic headers)
with open(chunk_1450_path, 'r', encoding='utf-8') as f:
    chunk_1450 = f.read()
with open(chunk_1650_path, 'r', encoding='utf-8') as f:
    chunk_1650 = f.read()

# Stitch pristine HTML chunks.
middle_part = chunk_1450.strip() + '\n\n' + chunk_1650.strip()
print("Middle pristine HTML part loaded.")

# 3. Extract bottom styles part from broken_repaired past <style scoped>
with open(broken_repaired_path, 'r', encoding='utf-8') as f:
    broken_lines = f.readlines()

style_scoped_index = -1
for idx, line in enumerate(broken_lines):
    if idx > 1400 and '<style scoped>' in line:
        style_scoped_index = idx
        break

if style_scoped_index == -1:
    print("Error: Could not locate <style scoped> in repaired backup!")
    exit(1)

print(f"Found <style scoped> at line {style_scoped_index + 1} in repaired backup.")

# Get everything *after* the <style scoped> tag
bottom_part = broken_lines[style_scoped_index + 1:]
print(f"Bottom styles part: {len(bottom_part)} lines.")
print(f"  First style line: {bottom_part[0].strip()[:50] if bottom_part else 'EMPTY'}")

# 4. Final assembly
# Combine top + middle + bottom
final_text = ''.join(top_part).rstrip() + '\n\n' + middle_part.strip() + '\n' + ''.join(bottom_part)

# Write to the active MenusView.vue file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_text)

print(f"ULTIMATE RECONSTRUCTION SUCCESSFUL! Rebuilt file written to {file_path}. ({len(final_text)} characters)")
