# 本日のソースコード修正箇所リスト

本日の作業で私が変更を加えたファイルは以下の3ファイルのみです。本番環境（変更前）のコードと、ローカル環境（現在のコード）の違いをすべてリスト化しました。

---

## 1. `src/store/restaurantStore.js`
**目的:** メニューを新規作成・複製した際に、グループ名（`masterName`, `groupName`）が保存されずに欠落してしまうバグを修正しました。

**変更前のコード（本番環境）:**
```javascript
function addMenu(menu) {
  const newMenu = {
    id: `menu-...`,
    name: menu.name || '新規メニュー',
    price: Number(menu.price) || 0,
    // (masterName と groupName の保存処理が存在しなかった)
```

**変更後のコード（現在）:**
```diff
function addMenu(menu) {
  const newMenu = {
    id: `menu-...`,
    name: menu.name || '新規メニュー',
+   masterName: menu.masterName || '',
+   groupName: menu.groupName || '',
    price: Number(menu.price) || 0,
```

---

## 2. `src/components/ProcurementPlanView.vue`
**目的:** 食材調達計画において、古いバージョンのメニューが合算されて重複表示される問題や、「ソース」タグの付いたメニュー（黒酢添加料理など）を除外するための修正を行いました。

**変更前のコード（本番環境）:**
```javascript
const procurementByMenu = computed(() => {
  return decodedMenus.value.map(menu => {
    // すべてのメニューを計算対象にする
```

**変更後のコード（現在）:**
```diff
const procurementByMenu = computed(() => {
- return decodedMenus.value.map(menu => {
+ const activeMenus = decodedMenus.value.filter(menu => {
+   if (menu.isActiveVersion === false) return false;
+   if (menu.category && menu.category.includes('ソース')) return false;
+   return true;
+ });
+
+ const map = {}; 
+ activeMenus.forEach(menu => {
+   // masterName（グループ名）で重複をまとめるロジックに変更
```

---

## 3. `src/components/MenusView.vue`
**目的:** メニューを複製して新しい期日のバージョンを作った際に、古いバージョンを自動的に「アーカイブ（非表示）」にする機能と、それを確認・復元するための「アーカイブタブ」を追加しました。

### ① 複製時のアーカイブ処理追加
**変更前:** 新規保存するだけ
**変更後:**
```diff
const saveMenu = async () => {
  try {
    if (isEditing.value) {
      await restaurantStore.updateMenu(currentId.value, form.value);
    } else {
      await restaurantStore.addMenu(form.value);
+     if (form.value.clonedFromId) {
+       // 元の古いレシピを自動でアーカイブする
+       await restaurantStore.updateMenu(form.value.clonedFromId, { isActiveVersion: false });
+     }
    }
```

### ② アーカイブタブと復元ボタンの追加
**変更前:** タブは「すべて」「現在進行」「達成完了」の3つのみ
**変更後:**
```diff
+ <button @click="filterStatus = 'archived'">アーカイブ(旧版)</button>
```
一覧のフィルタリング処理に、アーカイブ済みのみを表示するロジックを追加し、さらに履歴モーダルや一覧カードに以下の復元ボタンを追加しました。
```diff
+ <button v-if="menu.isActiveVersion === false" @click="restaurantStore.updateMenu(menu.id, { isActiveVersion: true })">
+   復元
+ </button>
```

---

### 原因と現状について
今回の「データが消えたように見えた」現象は、私が追加した**「③の自動アーカイブ機能」**によって古いデータが非表示になったタイミングと、**「①のグループ名保存のバグ」**が重なったことが原因でした。
現在はバグを修正し、非表示になったデータも「アーカイブタブ」から確認・復元できるように対応が完了しております。変更箇所は以上となります。
