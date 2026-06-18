with open('src/components/MenusView.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = ["brewery", "ブルワリー", "beer", "ビール", "壺", "ツボ", "sake", "酒", "料理酒"]
out = []

for kw in keywords:
    out.append(f"=== Search for: {kw} ===")
    found = False
    for idx, line in enumerate(lines):
        if kw.lower() in line.lower():
            out.append(f"Line {idx+1}: {line.strip()}")
            found = True
    if not found:
        out.append("No matches")
    out.append("")

with open('C:\\Users\\dai72\\.gemini\\antigravity\\brain\\4e41dcbf-03dc-4922-8b69-e9b830491bfc\\scratch\\search_menus_results.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))
print("Done")
