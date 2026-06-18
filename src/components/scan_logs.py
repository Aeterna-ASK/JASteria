import json
import os
import re

log_path = 'C:/Users/dai72/.gemini/antigravity/brain/869edc40-711e-4fac-bb7e-4a0ca2e6235a/.system_generated/logs/transcript.jsonl'
output_dir = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components'

print("Starting deep scan of transcript.jsonl...")

if not os.path.exists(log_path):
    print("Error: Log file not found at " + log_path)
    exit(1)

count = 0
found_candidates = []

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if 'menusview.vue' in line.lower():
            try:
                data = json.loads(line)
                step_index = data.get('step_index', 'unknown')
                step_type = data.get('type', 'unknown')
                
                # Check for tool calls (e.g. write_to_file or replace_file_content)
                tool_calls = data.get('tool_calls', [])
                for tc in tool_calls:
                    method = tc.get('method', '') or tc.get('name', '')
                    args = tc.get('arguments', {}) or tc.get('args', {})
                    # Look for CodeContent or ReplacementContent or any large value
                    for key, val in args.items():
                        if isinstance(val, str) and len(val) > 30000:
                            found_candidates.append({
                                'step': step_index,
                                'type': f"tool_call:{method}:{key}",
                                'length': len(val),
                                'content': val
                            })
                
                # Check for tool outputs (e.g. view_file output)
                # In some logs, the tool outputs are inside step content or output
                for key in ['output', 'content', 'result', 'text']:
                    val = data.get(key)
                    if val and isinstance(val, str) and len(val) > 30000:
                        # Clean up any potential json encoding or lines formatting if needed
                        found_candidates.append({
                            'step': step_index,
                            'type': f"output:{key}",
                            'length': len(val),
                            'content': val
                        })
            except Exception as e:
                pass

print(f"Scan complete. Found {len(found_candidates)} large candidates (>30KB).")

# Sort by length descending
found_candidates.sort(key=lambda x: x['length'], reverse=True)

for i, cand in enumerate(found_candidates[:10]):
    print(f"[{i}] Step: {cand['step']}, Type: {cand['type']}, Length: {cand['length']}")
    
    # Save the largest candidate to a file
    if i == 0:
        target_path = os.path.join(output_dir, 'MenusView.vue.scanned_perfect')
        with open(target_path, 'w', encoding='utf-8') as out_f:
            out_f.write(cand['content'])
        print(f"--> Saved candidate [0] ({cand['length']} chars) to {target_path}!")
