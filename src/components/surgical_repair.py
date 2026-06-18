import re
import os

broken_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.broken_repaired'
target_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

print("Beginning surgical repair on MenusView.vue.broken_repaired...")

if not os.path.exists(broken_path):
    print("Error: broken_repaired backup not found!")
    exit(1)

with open(broken_path, 'r', encoding='utf-8') as f:
    raw_lines = f.readlines()

reconstructed_lines = []
line_no_pattern = re.compile(r'^\s*(\d+):\s*(.*)$')

# Garbage patterns to ignore completely
garbage_patterns = [
    r'The above content does NOT show',
    r'Created At:',
    r'Completed At:',
    r'Total Bytes:',
    r'The following code has been modified to include a line number',
    r'Total Lines:'
]

ignored_count = 0
reconstructed_count = 0

for line in raw_lines:
    # Check if this is a garbage line
    is_garbage = False
    for pattern in garbage_patterns:
        if re.search(pattern, line):
            is_garbage = True
            break
            
    if is_garbage:
        ignored_count += 1
        continue

    # Check if line starts with line number formatting (like "1512: <code>")
    match = line_no_pattern.match(line)
    if match:
        # Strip line number and keep code content
        code_part = match.group(2)
        reconstructed_lines.append(code_part + '\n')
        reconstructed_count += 1
    else:
        # Keep normal lines as is
        reconstructed_lines.append(line)

print(f"Repair process complete.")
print(f"Ignored garbage lines: {ignored_count}")
print(f"Stripped line numbers from {reconstructed_count} lines.")
print(f"Total reconstructed lines: {len(reconstructed_lines)}")

# Write to the active MenusView.vue file
with open(target_path, 'w', encoding='utf-8') as f:
    f.writelines(reconstructed_lines)

print(f"Surgically repaired code successfully written directly to {target_path}!")
