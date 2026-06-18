import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    let conditionText = '';
    if (isRevision) {
      conditionText = '- 今回は既存レシピの「改定」です。\\n- 【重要】指定期間内に仕入れの履歴がない（利用可能な食材リストに存在しない）食材は、既存レシピにあっても必ず除外（削除）してください。\\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材（代替品や新規調達品など）が含まれている場合、それらは料理として成立する範囲で積極的に追加（マージ）し、適切な分量を設定してください。\\n- 既存の食材の分量を大きく変えすぎないように調整してください。\\n\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    }"""

new_code = """    let conditionText = '';
    if (isRevision) {
      const masterNameContext = form.value.masterName ? `\\n- 【重要】共通メニュー名（集計グループ）は「${form.value.masterName}」です。この料理の種類から大幅にずれたレシピにならないようにしてください。` : '';
      conditionText = '- 今回は既存レシピの「改定」です。' + masterNameContext + '\\n- 【重要】指定期間内に仕入れの履歴がない（利用可能な食材リストに存在しない）食材は、既存レシピにあっても必ず除外（削除）してください。\\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材（代替品や新規調達品など）が含まれている場合、それらは料理として成立する範囲で積極的に追加（マージ）し、適切な分量を設定してください。\\n- 既存の食材の分量を大きく変えすぎないように調整してください。\\n\\n既存のレシピ:\\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated masterName condition")
else:
    print("Could not find old code")
