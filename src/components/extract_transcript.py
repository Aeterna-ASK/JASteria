import json
import os
import re

brain_dir = 'C:/Users/dai72/.gemini/antigravity/brain/'
target_pattern = re.compile(r'menusview\.vue', re.IGNORECASE)

print("Scanning for all references...")
candidates = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path) or folder.startswith('.'):
        continue
    
    log_path = os.path.join(folder_path, '.system_generated', 'logs', 'transcript.jsonl')
    if not os.path.exists(log_path):
        continue
        
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f):
            if 'selectedMenuForSpec' in line and len(line) > 50000:
                try:
                    step = json.loads(line)
                    candidates.append({
                        'folder': folder,
                        'step_index': step.get('step_index'),
                        'type': step.get('type'),
                        'length': len(line),
                        'data': step
                    })
                except:
                    pass

print(f"Found {len(candidates)} candidates.")
candidates.sort(key=lambda x: x['length'], reverse=True)

for i, c in enumerate(candidates[:5]):
    print(f"[{i}]: Folder={c['folder']}, Step={c['step_index']}, Type={c['type']}, Length={c['length']}")

if candidates:
    best = candidates[0]
    data = best['data']
    
    # Extract file content from tool response or content
    content = ""
    # Check tool outputs
    for tc in data.get('tool_calls', []):
        args = tc.get('arguments', {})
        if 'CodeContent' in args:
            content = args['CodeContent']
            print("Found in CodeContent!")
    
    if not content:
        # Check standard properties
        for key in ['content', 'output', 'result', 'text']:
            val = data.get(key)
            if val and isinstance(val, str) and len(val) > 50000:
                content = val
                print(f"Found in key '{key}'!")
                
    if not content:
        # Check tool responses in the transcript line
        # sometimes it's nested under another key
        content = str(data)
        
    out_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.extracted_perfect'
    with open(out_path, 'w', encoding='utf-8') as out_f:
        out_f.write(content)
    print(f"DUMPED candidate content to extracted_perfect!")
