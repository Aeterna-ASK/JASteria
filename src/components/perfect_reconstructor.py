import json
import os
import re

log_path = 'C:/Users/dai72/.gemini/antigravity/brain/869edc40-711e-4fac-bb7e-4a0ca2e6235a/.system_generated/logs/transcript.jsonl'
output_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

print("Beginning pristine reconstruction from early session steps...")

if not os.path.exists(log_path):
    print("Error: Log file does not exist!")
    exit(1)

# Dictionary to hold line_number -> line_content
file_lines = {}

# Regex to match line numbers like "  1450: <code_content>"
line_pattern = re.compile(r'^\s*(\d+):\s*(.*)$')

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if 'menusview' in line.lower():
            try:
                step = json.loads(line)
                step_idx = step.get('step_index', 0)
                
                # Check ONLY steps between 600 and 1100 (session start viewer steps)
                # This ensures we get the pristine, perfectly working code thatcompiled successfully.
                if 600 <= step_idx < 1145:
                    output = step.get('content', '') or step.get('output', '')
                    if output and isinstance(output, str):
                        for l in output.splitlines():
                            match = line_pattern.match(l)
                            if match:
                                line_num = int(match.group(1))
                                code_content = match.group(2)
                                
                                # Store the pristine content (don't overwrite once set)
                                if line_num not in file_lines:
                                    file_lines[line_num] = code_content
            except Exception as e:
                pass

print(f"Collected {len(file_lines)} lines of pristine code.")

# Rebuild the file (lines 1 to 3037 or max found)
max_line = max(file_lines.keys()) if file_lines else 3037
print(f"Max line found: {max_line}")

# Find any missing lines
missing = [i for i in range(1, max_line + 1) if i not in file_lines]
print(f"Missing lines: {len(missing)}")
if missing:
    print(f"Missing lines (first 50): {missing[:50]}")

# Rebuild lines list
final_lines = []
for i in range(1, max_line + 1):
    if i in file_lines:
        final_lines.append(file_lines[i])
    else:
        final_lines.append("")

final_text = '\n'.join(final_lines)

# Write to active MenusView.vue
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(final_text)

print(f"Pristine reconstruction complete and written directly to {output_path}!")
