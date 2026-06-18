import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDtW1Xrpf_jcDKd12IyB88AjiVDRe7e0SE",
  authDomain: "organiclog-2f6c7.firebaseapp.com",
  projectId: "organiclog-2f6c7",
  storageBucket: "organiclog-2f6c7.firebasestorage.app",
  messagingSenderId: "267681135810",
  appId: "1:267681135810:web:5e62b67eb2d4145a4b8f5b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generated from the PDFs
const recoveredIngredients = [
  { id: 'ing-r-1', name: 'ぬか床', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-2', name: '有機野菜（人参）', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-3', name: '食前酢', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-4', name: 'コーヒー', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-5', name: '有機豆乳のポタージュ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-6', name: '有機野菜のサルサソース', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-7', name: '有機野菜サラダ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-8', name: '有機野菜ピクルス', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-9', name: '有機野菜のバーニャカウダ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-10', name: '食前酢（非有機）', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-11', name: 'サルサソース（非有機）', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-12', name: '小鉢', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-13', name: 'デザート', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-14', name: 'ごはん', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-15', name: 'メイン', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-16', name: 'コリンキー', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-17', name: 'ピーマン', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-18', name: '人参', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-19', name: 'ミント', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-20', name: '黒酢', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-21', name: '醤油', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-22', name: 'グラニュー糖', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-23', name: 'オリーブオイル', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-24', name: 'カリフラワー', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-25', name: 'はつか大根', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-26', name: '菜花', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-27', name: 'カラシナ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-28', name: 'たまねぎ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-29', name: 'カブ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-30', name: 'ビーツ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-31', name: 'ズッキーニ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-32', name: 'イタリアンパセリ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-33', name: '有機豆乳', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-34', name: 'スパイス', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-35', name: '有機黒酢', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-36', name: '有機ローズマリー', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-37', name: 'ブルーベリー抽出物', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-38', name: '有機グラニュー糖', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-39', name: 'パセリ刻み', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-40', name: 'キュウリ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-41', name: 'パッションフルーツ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-42', name: 'プチドリップ', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-43', name: 'ブラックペッパー', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-44', name: 'ジャガイモ', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-45', name: 'ナス', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-46', name: '里芋', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-47', name: 'その他食材', isOrganic: false, defaultUnit: 'g' },
  { id: 'ing-r-48', name: '有機コーヒー', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-49', name: '有機野菜', isOrganic: true, defaultUnit: 'g' },
  { id: 'ing-r-50', name: '玉ねぎ', isOrganic: true, defaultUnit: 'g' }
];

const recoveredMenus = [
  {
    id: 'menu-r-nuka',
    name: '有機ぬか漬け',
    category: '料理',
    monthlyTarget: 60,
    ingredients: [
      { ingredientId: 'ing-r-1', quantity: 200 },
      { ingredientId: 'ing-r-2', quantity: 100 }
    ],
    recipe: '1 野菜に少々塩をふり手で全体にこする\n2 ぬか床に漬け込む、空気に触れないようにする\n3 1日～2日で取り出し、完成。\n4 ぬか床か毎日かき混ぜる。',
    notes: '有機ぬか漬け №1、№2'
  },
  {
    id: 'menu-r-course1',
    name: 'オーガニックコース №1',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-3', quantity: 11 },
      { ingredientId: 'ing-r-4', quantity: 7 },
      { ingredientId: 'ing-r-5', quantity: 215 },
      { ingredientId: 'ing-r-6', quantity: 200 },
      { ingredientId: 'ing-r-7', quantity: 119 },
      { ingredientId: 'ing-r-8', quantity: 30 },
      { ingredientId: 'ing-r-9', quantity: 40 },
      { ingredientId: 'ing-r-10', quantity: 0.5 },
      { ingredientId: 'ing-r-11', quantity: 5 },
      { ingredientId: 'ing-r-12', quantity: 60 },
      { ingredientId: 'ing-r-13', quantity: 70 },
      { ingredientId: 'ing-r-14', quantity: 150 },
      { ingredientId: 'ing-r-15', quantity: 300 }
    ],
    recipe: '1 各種有機料理はスペックで対応する。\n2 小鉢・ごはん・デザートは、通常営業通り提供\n3 メイン料理はオーダー時作成\n4 セットを組み提供する',
    notes: 'コース目標数 年間3600食'
  },
  {
    id: 'menu-r-salad1',
    name: '有機野菜サラダ 前年引継ぎ',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-16', quantity: 30 },
      { ingredientId: 'ing-r-17', quantity: 20 },
      { ingredientId: 'ing-r-18', quantity: 20 },
      { ingredientId: 'ing-r-19', quantity: 1 },
      { ingredientId: 'ing-r-18', quantity: 2.5 },
      { ingredientId: 'ing-r-20', quantity: 3.5 },
      { ingredientId: 'ing-r-21', quantity: 3 },
      { ingredientId: 'ing-r-22', quantity: 2 },
      { ingredientId: 'ing-r-23', quantity: 2.8 }
    ],
    recipe: '1 有機野菜をカット\n2 人参・コリンキー塩もみする\n3 皿に盛りつける\n4 ドレッシング調合\n5 サラダにかける\n6 完成',
    notes: '有機サラダ'
  },
  {
    id: 'menu-r-salad2',
    name: '有機野菜サラダ №2',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-24', quantity: 30 },
      { ingredientId: 'ing-r-25', quantity: 20 },
      { ingredientId: 'ing-r-18', quantity: 20 },
      { ingredientId: 'ing-r-26', quantity: 5 },
      { ingredientId: 'ing-r-18', quantity: 2.5 },
      { ingredientId: 'ing-r-20', quantity: 3.5 },
      { ingredientId: 'ing-r-21', quantity: 3 },
      { ingredientId: 'ing-r-22', quantity: 2 },
      { ingredientId: 'ing-r-23', quantity: 2.8 }
    ],
    recipe: '1 有機野菜をカット\n2 人参を塩もみする,カリフラワー・菜の花はボイル\n3 皿に盛りつける\n4 ドレッシング調合\n5 サラダにかける\n6 完成',
    notes: '有機サラダ'
  },
  {
    id: 'menu-r-salad3',
    name: '有機野菜サラダ №3',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-27', quantity: 30 },
      { ingredientId: 'ing-r-28', quantity: 20 },
      { ingredientId: 'ing-r-29', quantity: 20 },
      { ingredientId: 'ing-r-30', quantity: 5 },
      { ingredientId: 'ing-r-18', quantity: 2.5 },
      { ingredientId: 'ing-r-20', quantity: 3.5 },
      { ingredientId: 'ing-r-21', quantity: 3 },
      { ingredientId: 'ing-r-22', quantity: 2 },
      { ingredientId: 'ing-r-23', quantity: 2.8 }
    ],
    recipe: '1 有機野菜をカット\n2 ビーツを塩もみする\n3 皿に盛りつける\n4 ドレッシング調合\n5 サラダにかける\n6 完成',
    notes: '有機サラダ'
  },
  {
    id: 'menu-r-salad4',
    name: '有機野菜サラダ №4',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-31', quantity: 30 },
      { ingredientId: 'ing-r-28', quantity: 20 },
      { ingredientId: 'ing-r-29', quantity: 20 },
      { ingredientId: 'ing-r-30', quantity: 5 },
      { ingredientId: 'ing-r-19', quantity: 2 },
      { ingredientId: 'ing-r-18', quantity: 2.5 },
      { ingredientId: 'ing-r-20', quantity: 3.5 },
      { ingredientId: 'ing-r-21', quantity: 3 },
      { ingredientId: 'ing-r-22', quantity: 2 },
      { ingredientId: 'ing-r-23', quantity: 2.8 }
    ],
    recipe: '1 有機野菜をカット\n2 ビーツを塩もみする\n3 皿に盛りつける\n4 ドレッシング調合\n5 サラダにかける\n6 完成',
    notes: '有機サラダ'
  },
  {
    id: 'menu-r-bagna',
    name: '有機野菜のバーニャカウダ',
    category: '料理',
    monthlyTarget: 60,
    ingredients: [
      { ingredientId: 'ing-r-28', quantity: 20 },
      { ingredientId: 'ing-r-29', quantity: 20 },
      { ingredientId: 'ing-r-18', quantity: 30 },
      { ingredientId: 'ing-r-32', quantity: 10 },
      { ingredientId: 'ing-r-35', quantity: 5 },
      { ingredientId: 'ing-r-22', quantity: 5 },
      { ingredientId: 'ing-r-33', quantity: 50 },
      { ingredientId: 'ing-r-23', quantity: 20 },
      { ingredientId: 'ing-r-34', quantity: 0.2 }
    ],
    recipe: '1 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\n2 有機野菜をカット・ボイルする。\n3 皿に盛り付け、ソースを添えて完成',
    notes: '有機バーニャカウダ №4'
  },
  {
    id: 'menu-r-pickles',
    name: '有機ピクルス',
    category: '料理',
    monthlyTarget: 50,
    ingredients: [
      { ingredientId: 'ing-r-35', quantity: 200 },
      { ingredientId: 'ing-r-22', quantity: 40 },
      { ingredientId: 'ing-r-36', quantity: 3 },
      { ingredientId: 'ing-r-2', quantity: 100 }
    ],
    recipe: '1 野菜を食べやすい大きさにカットし、塩をふる\n2 ピクルス液に漬け込み、冷蔵庫で2日ほど漬け込む\n3 取り出し完成',
    notes: '有機ピクルス №1'
  },
  {
    id: 'menu-r-blueberry',
    name: 'ブルーベリー酢',
    category: 'ドリンク',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-20', quantity: 7 },
      { ingredientId: 'ing-r-22', quantity: 4 },
      { ingredientId: 'ing-r-37', quantity: 0.5 }
    ],
    recipe: '1 オーガニック用ブルーベリー酢を水で割る\n2 冷やして完成',
    notes: '有機食前酢 №1'
  },
  {
    id: 'menu-r-potage',
    name: '有機豆乳のポタージュ',
    category: '料理',
    monthlyTarget: 80,
    ingredients: [
      { ingredientId: 'ing-r-35', quantity: 5 },
      { ingredientId: 'ing-r-38', quantity: 10 },
      { ingredientId: 'ing-r-33', quantity: 150 },
      { ingredientId: 'ing-r-49', quantity: 50 },
      { ingredientId: 'ing-r-39', quantity: 2 }
    ],
    recipe: '1 有機人参をスライスし、蒸す。\n2 蒸した有機野菜をフードプロセッサーでペーストにする\n3 鍋に豆乳・水・塩・砂糖・有機野菜を入れ80℃まで加熱\n4 仕上げに黒酢を入れ完成\n5 器に盛りつける',
    notes: '有機豆乳のポタージュ №1'
  },
  {
    id: 'menu-r-salsa1',
    name: '有機野菜とサルサソース',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-16', quantity: 20 },
      { ingredientId: 'ing-r-18', quantity: 20 },
      { ingredientId: 'ing-r-40', quantity: 30 },
      { ingredientId: 'ing-r-41', quantity: 10 },
      { ingredientId: 'ing-r-50', quantity: 4 },
      { ingredientId: 'ing-r-20', quantity: 20 },
      { ingredientId: 'ing-r-21', quantity: 15 },
      { ingredientId: 'ing-r-42', quantity: 1 },
      { ingredientId: 'ing-r-23', quantity: 10 },
      { ingredientId: 'ing-r-22', quantity: 5 },
      { ingredientId: 'ing-r-43', quantity: 0.2 }
    ],
    recipe: '1 玉ねぎを刻む ※サルサソース\n2 有機醤油と有機黒酢を加える ※サルサソース\n3 有機野菜を一口大に切る・ボイルする\n4 一口大に切った有機野菜を器に盛り付ける\n5 サルサソースをかける\n6 完成',
    notes: '前年引継ぎ'
  },
  {
    id: 'menu-r-salsa2',
    name: '有機野菜とサルサソース №2',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-24', quantity: 20 },
      { ingredientId: 'ing-r-29', quantity: 20 },
      { ingredientId: 'ing-r-25', quantity: 30 },
      { ingredientId: 'ing-r-27', quantity: 10 },
      { ingredientId: 'ing-r-50', quantity: 4 },
      { ingredientId: 'ing-r-20', quantity: 20 },
      { ingredientId: 'ing-r-21', quantity: 15 },
      { ingredientId: 'ing-r-42', quantity: 1 },
      { ingredientId: 'ing-r-23', quantity: 10 },
      { ingredientId: 'ing-r-22', quantity: 5 },
      { ingredientId: 'ing-r-43', quantity: 0.2 },
      { ingredientId: 'ing-r-18', quantity: 10 }
    ],
    recipe: '1 玉ねぎを刻む ※サルサソース\n2 有機醤油と有機黒酢を加える ※サルサソース\n3 有機野菜を一口大に切る・ボイルする\n4 一口大に切った有機野菜を器に盛り付ける\n5 サルサソースをかける\n6 完成',
    notes: '有機野菜とサルサソース №2'
  },
  {
    id: 'menu-r-other1',
    name: '黒酢添加料理',
    category: '料理',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-35', quantity: 1 },
      { ingredientId: 'ing-r-47', quantity: 99 }
    ],
    recipe: '黒酢ランチコース、黒酢もろみ黒毛和牛のステーキコース、市場直送 まぐろづくしコースの内容です。\n黒酢の郷桷志田では、すべての料理に有機黒酢を使用しております。よって、すべての料理は1％以上50％未満です。使用食材のg数は仮で記入しています。',
    notes: '各コースに分類'
  },
  {
    id: 'menu-r-coffee',
    name: '有機コーヒー',
    category: 'ドリンク',
    monthlyTarget: 3600,
    ingredients: [
      { ingredientId: 'ing-r-48', quantity: 7 }
    ],
    recipe: '1 豆をミルで挽く\n2 コーヒーメーカーで抽出する\n3 カップに注ぐ\n4 完成',
    notes: 'トーホー有機コーヒー 前年引継ぎ'
  }
];

async function recoverData() {
    try {
        console.log("Uploading recovered ingredients...");
        await setDoc(doc(db, 'restaurants', 'ingredients'), { data: recoveredIngredients }, { merge: true });
        
        console.log("Uploading recovered menus...");
        await setDoc(doc(db, 'restaurants', 'menus'), { data: recoveredMenus }, { merge: true });
        
        console.log("Recovery complete!");
    } catch (e) {
        console.error("Error recovering data:", e);
    }
    process.exit(0);
}

recoverData();
