import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = r"【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材（代替品や新規調達品など）が含まれている場合、それらは料理として成立する範囲で積極的に追加（マージ）し、適切な分量を設定してください。"
new_str = r"【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材が含まれている場合、それがこの料理（共通メニュー名）のコンセプトに合う代替品・追加食材であれば必要に応じて追加（マージ）してください。スパゲッティなどの全く無関係な食材を無理に混ぜて別の料理にしないでください。"

if old_str in content:
    content = content.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Prompt fixed successfully")
else:
    print("Could not find prompt string")
