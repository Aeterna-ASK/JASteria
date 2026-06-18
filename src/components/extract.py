import json
import os

pre_prev_log_path = 'C:/Users/dai72/.gemini/antigravity/brain/4e41dcbf-03dc-4922-8b69-e9b830491bfc/.system_generated/logs/transcript.jsonl'

print(f"Scanning pre-previous conversation log: {pre_prev_log_path}...")

if not os.path.exists(pre_prev_log_path):
    print("Error: Pre-previous log file does not exist!")
    exit(1)

matches = []
with open(pre_prev_log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for idx, line in enumerate(f):
        if 'menusview' in line.lower():
            matches.append((idx + 1, line))

print(f"Found {len(matches)} raw text matches in pre-previous log.")

# Find the largest logged step
matches.sort(key=lambda x: len(x[1]), reverse=True)

for i in range(min(5, len(matches))):
    line_num, content = matches[i]
    print(f"[{i}]: Line={line_num}, Length={len(content)}")
    
    try:
        data = json.loads(content)
        print(f"  JSON Type: {data.get('type')}, Keys: {list(data.keys())}")
        
        # Look for large strings in content or output (typically contains full view_file output)
        for k in ['content', 'output', 'result']:
            v = data.get(k)
            if v and isinstance(v, str) and len(v) > 20000:
                out_path = f'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue.recovered_pre_prev_{line_num}_{k}'
                with open(out_path, 'w', encoding='utf-8') as out_f:
                    out_f.write(v)
                print(f"  -> SUCCESS: Recovered to {out_path}!")
    except Exception as e:
        print(f"  JSON parse error: {e}")
