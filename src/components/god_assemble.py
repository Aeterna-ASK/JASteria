import json
import os
import re

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'
broken_repaired_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.broken_repaired'
chunk_1450_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1450'
chunk_1650_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.chunk_1650'
log_path = 'C:/Users/dai72/.gemini/antigravity/brain/869edc40-711e-4fac-bb7e-4a0ca2e6235a/.system_generated/logs/transcript.jsonl'

print("Executing ULTIMATE SURGICAL ASSEMBLY (Log Capped 600-1000 & Repaired Backup Fallback)...")

# 1. Load lines dictionary ONLY from early post-renewal steps (600 to 1000)
# This guarantees no pre-renewal HTML lines from steps 0-500 pollute our code!
file_lines = {}
line_pattern = re.compile(r'^\s*(\d+):\s*(.*)$')

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if 'menusview' in line.lower():
            try:
                step = json.loads(line)
                step_idx = step.get('step_index', 0)
                if 600 <= step_idx < 1000:
                    output = step.get('content', '') or step.get('output', '')
                    if output and isinstance(output, str):
                        for l in output.splitlines():
                            match = line_pattern.match(l)
                            if match:
                                line_num = int(match.group(1))
                                code_content = match.group(2)
                                if line_num not in file_lines:
                                    file_lines[line_num] = code_content
            except Exception as e:
                pass

print(f"Collected {len(file_lines)} lines of pristine post-renewal code from steps 600-1000.")

# 2. Read broken_repaired for modern post-renewal fallback content (100% line-aligned)
with open(broken_repaired_path, 'r', encoding='utf-8') as f:
    broken_lines = f.readlines()

print(f"broken_repaired has {len(broken_lines)} lines.")

# 3. Compile top part (lines 1 to 1449)
top_lines = []
for i in range(1, 1450):
    if i in file_lines:
        top_lines.append(file_lines[i])
    else:
        # Fallback to broken_repaired line (0-indexed)
        # This keeps it perfectly aligned with post-renewal setup, variable definitions and HTML tags!
        if i-1 < len(broken_lines):
            top_lines.append(broken_lines[i-1].rstrip())
        else:
            top_lines.append("")

top_part_text = '\n'.join(top_lines)
print(f"Top part compiled: {len(top_lines)} lines.")
print(f"  First line: {top_lines[0].strip()[:50]}")
print(f"  Last line: {top_lines[-1].strip()[:80]}")

# 4. Load middle HTML chunks from pristine logs
with open(chunk_1450_path, 'r', encoding='utf-8') as f:
    chunk_1450 = f.read()
with open(chunk_1650_path, 'r', encoding='utf-8') as f:
    chunk_1650 = f.read()

middle_part = chunk_1450.strip() + '\n\n' + chunk_1650.strip()
print("Middle HTML part loaded.")

# 5. Extract bottom styles part from broken_repaired past <style scoped>
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

# 6. Final assembly
final_text = top_part_text.rstrip() + '\n\n' + middle_part.strip() + '\n' + ''.join(bottom_part)

# Write to the active MenusView.vue file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_text)

print(f"GOD-TIER RECONSTRUCTION COMPLETE! Written to {file_path}. ({len(final_text)} characters)")
