import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the prompt text
old_prompt = """const promptText = `あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」を使って作る料理の「具体的な調理方法（混同・汚染防止を含む詳細手順）」だけを作成してください。"""

new_prompt = """const promptText = `あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」を使って作る料理の「簡素で簡潔な調理方法（混同・汚染防止に配慮）」だけを作成してください。
あまり詳しく書きすぎず、今までのようなシンプルで簡潔な手順で十分です。"""

if old_prompt in text:
    text = text.replace(old_prompt, new_prompt)
    print("Updated prompt instruction part 1")
else:
    print("Could not find old_prompt part 1")

# Also add a constraint to make it concise
old_instruction = """- 手順を出力する際は、必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行って見やすく出力してください。"""
new_instruction = """- 各手順は長文にならず、簡潔でシンプルな表現にとどめてください。
- 手順を出力する際は、必ず「1. 〇〇\\n2. 〇〇」のように番号ごとに改行（\\n）を行って見やすく出力してください。"""

if old_instruction in text:
    text = text.replace(old_instruction, new_instruction)
    print("Updated prompt instruction part 2")
else:
    print("Could not find old_instruction part 2")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
