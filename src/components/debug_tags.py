import re

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()

# Find <template> and </template> boundaries
start_idx = -1
end_idx = -1
for idx, line in enumerate(lines):
    if '<template>' in line:
        start_idx = idx
    if '</template>' in line:
        end_idx = idx

print(f"Template starts at line {start_idx + 1}, ends at line {end_idx + 1}")

template_lines = lines[start_idx:end_idx + 1]

stack = []
tag_pattern = re.compile(r'<(/?[a-zA-Z0-9:-]+)(?:\s+[^>]*?)?>')

for idx, line in enumerate(template_lines):
    line_num = start_idx + 1 + idx
    # Find all tags in this line
    for match in tag_pattern.finditer(line):
        tag = match.group(1)
        full_match_str = match.group(0)
        
        # Skip self-closing tags, meta tags, and component custom tags that might end with "/>"
        if tag.lower() in ['img', 'input', 'br', 'hr', 'meta', 'link']:
            continue
        if full_match_str.endswith('/>'):
            continue
            
        if tag.startswith('/'):
            # Closing tag
            tag_name = tag[1:]
            if stack:
                last_tag, last_line = stack.pop()
                if last_tag != tag_name:
                    print(f"MISMATCH at line {line_num}: Closed </{tag_name}> but expected </{last_tag}> (opened on line {last_line})")
                    # Keep the original on stack to find further issues
                    stack.append((last_tag, last_line))
            else:
                print(f"UNEXPECTED CLOSE at line {line_num}: </{tag_name}> without open tag.")
        else:
            # Opening tag
            stack.append((tag, line_num))

print("\nAnalysis complete.")
if stack:
    print(f"Unclosed tags remaining in stack (total {len(stack)}):")
    for tag, line in stack:
        print(f"  <{tag}> opened on line {line}")
else:
    print("ALL TEMPLATE TAGS ARE PERFECTLY BALANCED!")
