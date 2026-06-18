import json
import os
import re

brain_dir = 'C:/Users/dai72/.gemini/antigravity/brain/'
target_pattern = re.compile(r'menusview\.vue', re.IGNORECASE)

print("Scanning all brain directories for any references to menusview.vue (case-insensitive)...")

candidates = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path) or folder.startswith('.'):
        continue
    
    log_path = os.path.join(folder_path, '.system_generated', 'logs', 'transcript.jsonl')
    if not os.path.exists(log_path):
        continue
        
    print(f"Reading log: {folder}...")
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f):
            if target_pattern.search(line):
                # We found a match! Let's parse it
                try:
                    step = json.loads(line)
                    step_type = step.get('type')
                    # Check if there is some file content in the step
                    # (like view_file response or code replacement content)
                    content_str = str(step)
                    length = len(content_str)
                    
                    # We are interested in step index, type and length
                    candidates.append({
                        'folder': folder,
                        'line_num': idx + 1,
                        'step_index': step.get('step_index'),
                        'type': step_type,
                        'length': length,
                        'data': step
                    })
                except Exception as e:
                    pass

print(f"\nFound {len(candidates)} total references to menusview.vue.")

# Sort candidates by length (descending) to find steps containing the full/large file content
candidates.sort(key=lambda x: x['length'], reverse=True)

for i, c in enumerate(candidates[:15]): # Show top 15 largest steps
    print(f"[{i}]: Folder={c['folder']}, Step={c['step_index']}, Type={c['type']}, Length={c['length']}, Line={c['line_num']}")
    
# Let's write the largest candidate content if it looks like a view_file response containing file content
# or if it's a tool call with CodeContent
if candidates:
    best = candidates[0]
    print(f"\nAnalyzing the largest step (Length: {best['length']}) from folder {best['folder']}, step {best['step_index']}...")
    
    # Try to extract content
    data = best['data']
    
    # Look for view_file tool output. In some schemas, tool responses are in 'content' or 'result' or 'output'
    content = ""
    # Let's inspect the keys in the JSON object
    # print("Keys:", data.keys())
    
    # If the step has a tool call, check arguments
    for tc in data.get('tool_calls', []):
        args = tc.get('arguments', {})
        if 'CodeContent' in args:
            content = args['CodeContent']
            print("Found CodeContent in tool_calls!")
            
    # If it's a step response, check if it contains the file content
    if not content:
        # Check standard properties
        for key in ['content', 'output', 'result', 'text']:
            val = data.get(key)
            if val and isinstance(val, str) and len(val) > 20000:
                content = val
                print(f"Found large string content in key '{key}'!")
                
    if content:
        out_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.recovered'
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(content)
        print(f"SUCCESS: Recovered {len(content)} characters to recovered file!")
    else:
        # Let's dump keys and a snippet of the JSON so we can analyze it
        snippet = str(data)[:1000]
        print(f"Could not automatically extract. JSON snippet:\n{snippet}")
