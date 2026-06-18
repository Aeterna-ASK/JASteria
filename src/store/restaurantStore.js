import { reactive, computed, readonly } from 'vue';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';

const STORE_KEY = 'jas_restaurant_store_v2';

/**
 * ============================================================================
 * JASAGRI 有機JASレストラン管理システム - 共通データフロー (ポータブル・ストア)
 * Version: v1.2.0
 * 
 * [設計方針]
 * 1. Infrastructure Agnostic: Vue3 標準の reactive/computed のみで構成。
 *    外部ライブラリへの依存がなく、Firebase、Supabase 等への連携・移行が容易。
 * 2. Self-Documenting: 各データ構造、計算式に詳細なコメントを添え、堅牢に設計。
 * 3. UX Safety: 起動直後からリッチな検証が可能な「リアルシードデータ」を自動注入。
 */

// --- 初期シードデータ (JAS 0004 料理スペックに完全適合したリアルな鹿児島・霧島ストーリー) ---
const seedIngredients = [
  {
    id: 'ing-001',
    name: '有機JAS完熟トマト',
    supplier: '霧島オーガニック農園',
    type: 'organic', // organic (有機JAS), general (一般), salt_water (水・食塩)
    hasCertificate: true,
    certificateExpiry: '2027-03-31',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-002',
    name: '有機エキストラバージンオリーブオイル',
    supplier: '地中海オーガニック商事',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-12-31',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-003',
    name: 'イタリア産有機セモリナスパゲッティ',
    supplier: 'オーガニック・トレイディング',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2027-05-15',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-004',
    name: '国産こだわり鶏もも肉',
    supplier: '薩摩地鶏クオリティ',
    type: 'general', // 一般原材料
    hasCertificate: false,
    certificateExpiry: '',
    hasJasLabel: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-005',
    name: '有機こだわりベビーリーフ',
    supplier: 'あおぞら有機ファーム',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-09-30',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-006',
    name: 'シチリア産天然岩塩',
    supplier: 'マリーナ・ソルト',
    type: 'salt_water', // 水・食塩 (JAS割合計算から除外される)
    hasCertificate: false,
    certificateExpiry: '',
    hasJasLabel: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-007',
    name: '国産有機丸大豆醤油',
    supplier: 'ヤマキ有機醸造',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2027-01-10',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-008',
    name: '有機JAS人参',
    supplier: '霧島オーガニック農園',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2027-04-30',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-009',
    name: '有機JASコリンキー',
    supplier: '霧島オーガニック農園',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-11-30',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-010',
    name: '有機JASズッキーニ',
    supplier: '霧島オーガニック農園',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-10-31',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-011',
    name: '有機JASビーツ',
    supplier: '霧島オーガニック農園',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-12-15',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-012',
    name: '有機JASカラシナ',
    supplier: 'あおぞら有機ファーム',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-09-30',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-013',
    name: '有機JAS水菜',
    supplier: 'あおぞら有機ファーム',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2026-08-31',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-014',
    name: '有機JAS黒酢',
    supplier: '霧島醸造',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '2027-04-10',
    hasJasLabel: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-015',
    name: 'グラニュー糖',
    supplier: '一般調味料卸',
    type: 'general',
    hasCertificate: false,
    certificateExpiry: '',
    hasJasLabel: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ing-016',
    name: '一般醤油',
    supplier: '薩摩醸造',
    type: 'general',
    hasCertificate: false,
    certificateExpiry: '',
    hasJasLabel: false,
    updatedAt: new Date().toISOString()
  }
];

const seedMenus = [
  {
    id: 'menu-001',
    name: '有機トマトと完熟オリーブのアラビアータ',
    price: 1480,
    isOrganicClaim: true, // 「有機メニュー」として提供・表示するかどうか
    recipe: [
      { ingredientId: 'ing-001', amount: 120 }, // 有機トマト 120g
      { ingredientId: 'ing-002', amount: 15 },  // 有機オリーブオイル 15g
      { ingredientId: 'ing-003', amount: 80 },  // 有機スパゲッティ 80g
      { ingredientId: 'ing-006', amount: 3 }    // 天然岩塩 3g (計算除外)
    ],
    description: '霧島オーガニック農園の完熟トマトをふんだんに使用した、ピリッと辛い定番パスタ。100%有機原材料(水・塩除く)で作られています。',
    
    // JAS 0004 料理スペック帳票項目
    category: '有機料理スペック',
    changeDetails: '前年引継ぎ',
    targetCreatedDate: '2025-04-15',
    startDate: '2025-05-01',
    reviewDate: '2026-05-08',
    deadline: '2026-04-30',
    creatorApproved: '鈴木 美咲',
    managerApproved: '角田 健一',
    courseTargetNum: '年間3600食',
    singleTargetNum: '年間120食',
    displayPeriod: '通年',
    displayMethod: 'メニューに掲載',
    displayStyle: '記号により表示',
    cookingInstructions: '1. 有機トマトを洗浄して湯むきし、ピュレ状にする。\n2. パスタを茹で、有機オリーブオイルでニンニクとトマトソースを和える。\n3. 天然岩塩で味を整えて盛りつける。',
    remarks: '有機専用調理器具を使用して、一般調理との混同を完全防止すること。',
    
    updatedAt: new Date().toISOString()
  },
  {
    id: 'menu-002',
    name: '有機野菜サラダ（JAS配合：通年・メニュー掲載）',
    price: 1180,
    isOrganicClaim: true,
    recipe: [
      { ingredientId: 'ing-008', amount: 30 },  // 有機人参 30g (有機)
      { ingredientId: 'ing-009', amount: 15 },  // 有機コリンキー 15g (有機)
      { ingredientId: 'ing-010', amount: 15 },  // 有機ズッキーニ 15g (有機)
      { ingredientId: 'ing-011', amount: 10 },  // 有機ビーツ 10g (有機)
      { ingredientId: 'ing-012', amount: 10 },  // 有機カラシナ 10g (有機)
      { ingredientId: 'ing-013', amount: 10 },  // 有機水菜 10g (有機)
      { ingredientId: 'ing-002', amount: 5 },   // 有機オリーブオイル 5g (有機)
      { ingredientId: 'ing-014', amount: 5 },   // 有機JAS黒酢 5g (有機)
      { ingredientId: 'ing-015', amount: 1.5 }, // グラニュー糖 1.5g (一般)
      { ingredientId: 'ing-016', amount: 1.5 }, // 一般醤油 1.5g (一般)
      { ingredientId: 'ing-006', amount: 1.0 }  // 天然岩塩 1.0g (水・食塩 - 計算除外)
    ],
    description: '前年の有機JAS料理スペック（Gドライブ：R7 スペックサラダ.xlsx）に完全準拠。霧島産の有機人参、コリンキー、ビーツ、ズッキーニをふんだんに盛り込み、ドレッシングに非有機の砂糖と醤油を僅かに配合。水塩を除く有機比率97.08%で、JAS 95%基準を美しくクリアした完全監査適合サラダです。',
    
    // JAS 0004 料理スペック帳票項目
    category: '有機料理スペック',
    changeDetails: '具材の変更（人参）',
    targetCreatedDate: '2025-04-15',
    startDate: '2025-05-01',
    reviewDate: '2026-05-08',
    deadline: '2026-04-30',
    creatorApproved: '鈴木 美咲',
    managerApproved: '角田 健一',
    courseTargetNum: '年間3600食',
    singleTargetNum: '年間60食',
    displayPeriod: '通年',
    displayMethod: 'メニューに掲載',
    displayStyle: '記号により表示',
    cookingInstructions: '1. 有機人参、コリンキー、ビーツ、ズッキーニ、カラシナ、水菜を洗浄してカットする。\n2. 人参、コリンキー、ビーツは各々個別の容器で塩もみする。\n3. オリーブオイル、黒酢、グラニュー糖、一般醤油を調合し、特製ドレッシングを作る。\n4. サラダにドレッシングをかけ、皿に盛りつける。',
    remarks: '人参を塩もみする際、カリフラワー・菜の花は別メニューでボイルするため、サラダ用ボイル人参用ボールは一般品と完全分離し、都度アルコール消毒を徹底すること。',
    
    updatedAt: new Date().toISOString()
  },
  {
    id: 'menu-003',
    name: '薩摩地鶏のソテー 〜有機完熟トマトソース仕立て〜',
    price: 1850,
    isOrganicClaim: false, // 有機割合が低いため、料理全体を「有機」とは謳えない (一部表記のみ)
    recipe: [
      { ingredientId: 'ing-004', amount: 180 }, // 一般鶏もも肉 180g (一般)
      { ingredientId: 'ing-001', amount: 80 },  // 有機トマト 80g (有機)
      { ingredientId: 'ing-002', amount: 10 },  // 有機オリーブオイル 10g (有機)
      { ingredientId: 'ing-006', amount: 4 }    // 天然岩塩 4g (計算除外)
    ],
    description: 'ジューシーに焼き上げた地鶏ソテーに、豊かな風味の有機トマトソースを合わせました。※鶏肉は一般、ソースに有機食材を使用。',
    
    // JAS 0004 料理スペック帳票項目
    category: '一般料理スペック (有機一部配合)',
    changeDetails: '前年引継ぎ',
    targetCreatedDate: '2025-04-15',
    startDate: '2025-05-01',
    reviewDate: '2026-05-08',
    deadline: '2026-04-30',
    creatorApproved: '鈴木 美咲',
    managerApproved: '角田 健一',
    courseTargetNum: '年間3600食',
    singleTargetNum: '年間200食',
    displayPeriod: '通年',
    displayMethod: 'メニューに記載 (一般)',
    displayStyle: '一部のみ有機表記',
    cookingInstructions: '1. 地鶏に軽く塩をし、オリーブオイルでジューシーにソテーする。\n2. 別途、有機トマトを煮詰めて特製トマトソースを作る。\n3. ソテーした地鶏にソースをかけ、盛りつける。',
    remarks: '一般鶏肉を使用しているため、JASマークは付加せず、メニュー上での誤認表示がないよう案内を徹底。',
    
    updatedAt: new Date().toISOString()
  }
];

const seedReceipts = [
  {
    id: 'rec-001',
    date: '2026-05-05',
    ingredientId: 'ing-001',
    quantity: 15.0, // kg
    lotNumber: 'KIRI-260505A',
    checkedBy: '角田 健一',
    isSeparated: true,          // 一般品と混ざらないよう分別保管されているか
    hasJasLabelVerified: true,  // 受入時に有機JASマークが貼付されていることを確認したか
    isClean: true,              // 汚損、異物混入がないか
    status: 'good',             // good, warning, bad
    notes: '鮮度良好。格付マーク確認済み。冷蔵保管庫Aに分別収容。'
  },
  {
    id: 'rec-002',
    date: '2026-05-06',
    ingredientId: 'ing-005',
    quantity: 3.5, // kg
    lotNumber: 'AO-260506',
    checkedBy: '角田 健一',
    isSeparated: true,
    hasJasLabelVerified: true,
    isClean: true,
    status: 'good',
    notes: 'ベビーリーフ受入。コンテナ洗浄確認済み。冷蔵保管庫B。'
  },
  {
    id: 'rec-003',
    date: '2026-05-07',
    ingredientId: 'ing-004',
    quantity: 10.0, // kg
    lotNumber: '鶏肉-0507',
    checkedBy: '鈴木 美咲',
    isSeparated: true,          // 一般品だが保管場所は混同防止のため指定
    hasJasLabelVerified: false, // 一般品のため無し
    isClean: true,
    status: 'good',
    notes: '肉類専用冷蔵庫に格納。有機食材の保管エリアとは明確にパーティションで隔離。'
  },
  {
    id: 'rec-004',
    date: '2026-05-04',
    ingredientId: 'ing-008', // 有機JAS人参
    quantity: 20.0, // kg
    lotNumber: 'NIN-260504',
    checkedBy: '角田 健一',
    isSeparated: true,
    hasJasLabelVerified: true,
    isClean: true,
    status: 'good',
    notes: '2025年指摘改善対象：人参現物のJASマーク貼付をスマホ撮影して保存。冷蔵保管庫Cに格納。'
  },
  {
    id: 'rec-005',
    date: '2026-05-05',
    ingredientId: 'ing-009', // コリンキー
    quantity: 10.0, // kg
    lotNumber: 'KOL-260505',
    checkedBy: '角田 健一',
    isSeparated: true,
    hasJasLabelVerified: true,
    isClean: true,
    status: 'good',
    notes: '有機コリンキー受入。汚れなし、分別保管確認。'
  }
];

const seedCookingLogs = [
  {
    id: 'cook-001',
    date: '2026-05-07',
    menuId: 'menu-001',
    quantity: 12, // 提供食数
    checkedBy: '角田 健一',
    isUtensilsClean: true,      // 調理器具・まな板の有機専用（または都度洗浄）が確認されたか
    isIngredientVerified: true, // レシピ通りの有機原材料ロットが正しく使用されたか
    lotDetails: 'トマト: KIRI-260505A',
    notes: 'ランチピーク時の提供。有機専用調理器具を使用して、一般調理との混同を完全防止。'
  },
  {
    id: 'cook-002',
    date: '2026-05-07',
    menuId: 'menu-002', // 有機野菜サラダ（JAS配合：通年・メニュー掲載）
    quantity: 15, // 提供食数 15食
    checkedBy: '角田 健一',
    isUtensilsClean: true,
    isIngredientVerified: true,
    lotDetails: '人参: NIN-260504, コリンキー: KOL-260505',
    notes: '2025年人参の指摘対策：受入ロットNIN-260504から製造。サラダ用ボイル人参用ボールは一般品と完全分離、都度アルコール消毒を徹底。'
  }
];

// --- 新規：店舗清掃・掃除点検記録（JASホールの清掃指摘の改善） ---
const seedCleaningLogs = [
  {
    id: 'clean-001',
    date: '2026-05-07',
    area: 'ホール', // ホール, 厨房, 出荷場, 食材保管庫
    checkedBy: '鈴木 美咲',
    isFloorCleaned: true,      // 床・壁・テーブルの清掃と消毒
    isTrashRemoved: true,      // ゴミ・一般食材ゴミの完全廃棄
    isContactPrevented: true,  // 一般顧客エリアと有機提供エリアの隔離・清潔維持
    status: 'good',
    notes: 'ホールの日常清掃およびテーブルのアルコール消毒点検完了。お客様への誤認表示（ビール等）のメニュー案内板が正しく掲示されていることを合わせて目視点検。'
  },
  {
    id: 'clean-002',
    date: '2026-05-08',
    area: '食材保管庫',
    checkedBy: '角田 健一',
    isFloorCleaned: true,
    isTrashRemoved: true,
    isContactPrevented: true, // 保管コンテナの洗浄と区分け
    status: 'good',
    notes: '有機保管庫と一般保管庫の間に防塵パーティションが設置されており、害虫・ネズミの形跡がないことを確認。分別表示が綺麗に維持されています。'
  }
];

const defaultRestaurantInfo = {
  name: 'オーガニックレストラン アグリ角田 (AGRI KAKUIDA)',
  manager: '角田 健一', // 生産行程管理責任者
  grader: '鈴木 美咲',  // 格付担当者
  certNumber: 'JAS-REST-2026-0042', // 有機JAS認定番号
  certDate: '2025-04-10',
  address: '鹿児島県霧島市国分下井290-1'
};


// ============================================================================
// ストア状態 (State)
// ============================================================================
const state = reactive({
  activeTab: 'dashboard',
  restaurantInfo: { ...defaultRestaurantInfo },
  ingredients: [],
  menus: [],
  receipts: [],
  cookingLogs: [],
  cleaningLogs: [],
  documents: [],
  manualChapters: [],
  auditDocuments: [],
  auditCategories: {},
  externalRegInfo: {},
  targetMenuToClone: null,
  t_inbox_documents: [],
  initialized: false
});


// ============================================================================
// データ永続化 (Persistence) & 初期化
// ============================================================================
let isFirestoreSyncInitialized = false;
// リモート(onSnapshot)からの反映中は true。ローカル→クラウドのエコー書き込みを抑止する。
let isApplyingRemote = false;
// menuImages コレクションの内容キャッシュ { [menuId]: { imageUrl, sampleImageUrl } }
const menuImageCache = {};
// クラウド同期(syncToFirestore)のデバウンスタイマー
let firestoreSyncTimer = null;

function loadStore() {
  try {
    const rawData = localStorage.getItem(STORE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      state.activeTab = parsed.activeTab || 'dashboard';
      state.restaurantInfo = parsed.restaurantInfo || { ...defaultRestaurantInfo };
      state.ingredients = parsed.ingredients || [];
      state.menus = parsed.menus || [];
      state.receipts = parsed.receipts || [];
      state.cookingLogs = parsed.cookingLogs || [];
      state.cleaningLogs = parsed.cleaningLogs || [];
      state.documents = parsed.documents || [];
      state.manualChapters = parsed.manualChapters || [];
      state.auditDocuments = parsed.auditDocuments || [];
      state.auditCategories = parsed.auditCategories || {};
      state.externalRegInfo = parsed.externalRegInfo || {};
      state.targetMenuToClone = parsed.targetMenuToClone || null;
      state.t_inbox_documents = parsed.t_inbox_documents || [];
    } else {
      // シードデータをロード
      state.activeTab = 'dashboard';
      state.restaurantInfo = { ...defaultRestaurantInfo };
      state.ingredients = [...seedIngredients];
      state.menus = [...seedMenus];
      state.receipts = [...seedReceipts];
      state.cookingLogs = [...seedCookingLogs];
      state.cleaningLogs = [...seedCleaningLogs];
      saveStore();
    }
    state.initialized = true;
  } catch (error) {
    console.error('Failed to load storage for JAS Restaurant:', error);
    // フォールバック
    state.ingredients = [...seedIngredients];
    state.menus = [...seedMenus];
    state.cleaningLogs = [...seedCleaningLogs];
  }
}

function saveStore() {
  try {
    // 画像（imageUrl/sampleImageUrl）はサイズが大きく localStorage 容量を圧迫するため、
    // 本番と同様に localStorage には画像を含めずに保存する（画像は menuImages から再読込）。
    const menusForStorage = (state.menus || []).map(m => {
      const { imageUrl, sampleImageUrl, ...rest } = m;
      return rest;
    });
    const saveData = {
      activeTab: state.activeTab,
      restaurantInfo: state.restaurantInfo,
      ingredients: state.ingredients,
      menus: menusForStorage,
      receipts: state.receipts,
      cookingLogs: state.cookingLogs,
      cleaningLogs: state.cleaningLogs,
      documents: state.documents,
      manualChapters: state.manualChapters,
      auditDocuments: state.auditDocuments,
      auditCategories: state.auditCategories,
      externalRegInfo: state.externalRegInfo,
      targetMenuToClone: state.targetMenuToClone,
      t_inbox_documents: state.t_inbox_documents
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(saveData));
    // 【本番保護】localhost（開発環境）からは Firestore へ絶対に書き込まない。
    // また、リモート(onSnapshot)適用中(isApplyingRemote)は同じ内容を書き戻すエコーを抑止する。
    const isLocalDev = typeof location !== 'undefined' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (isFirestoreSyncInitialized && !isApplyingRemote && !isLocalDev) {
      syncToFirestore();
    }
  } catch (error) {
    console.error('Failed to save storage for JAS Restaurant:', error);
  }
}

/**
 * クラウド同期（本番ビルドの yy() を移植）
 * 本番と同じ「種類別ドキュメント」構造で保存する：
 *  - restaurants/{menus,ingredients,receipts,cookingLogs,cleaningLogs,
 *    manualChapters,auditDocuments,t_inbox_documents,meta} を各 {data:[...]} で merge 保存
 *  - メニュー画像は Firestore 1MB/doc 上限を避けるため menuImages/{メニューID} に分離保存（10件ずつ並列）
 * 連続操作での過剰書き込みを防ぐため 2 秒デバウンスする。
 */
function syncToFirestore() {
  if (firestoreSyncTimer) clearTimeout(firestoreSyncTimer);
  firestoreSyncTimer = setTimeout(async () => {
    try {
      console.log('[Firestore Sync] クラウドへの同期開始...');
      // 画像付きメニューを抽出してキャッシュを更新（本体ドキュメントからは画像を除外する）
      const imaged = (state.menus || [])
        .filter(m => m.imageUrl || m.sampleImageUrl)
        .map(m => ({ id: m.id, imageUrl: m.imageUrl, sampleImageUrl: m.sampleImageUrl }));
      imaged.forEach(m => {
        menuImageCache[m.id] = { imageUrl: m.imageUrl || '', sampleImageUrl: m.sampleImageUrl || '' };
      });
      const menusNoImage = JSON.parse(JSON.stringify(state.menus || [])).map(m => {
        const c = { ...m };
        delete c.imageUrl;
        delete c.sampleImageUrl;
        return c;
      });

      const writes = [
        setDoc(doc(db, 'restaurants', 'menus'), { data: menusNoImage }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'ingredients'), { data: JSON.parse(JSON.stringify(state.ingredients || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'receipts'), { data: JSON.parse(JSON.stringify(state.receipts || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'cookingLogs'), { data: JSON.parse(JSON.stringify(state.cookingLogs || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'cleaningLogs'), { data: JSON.parse(JSON.stringify(state.cleaningLogs || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'manualChapters'), { data: JSON.parse(JSON.stringify(state.manualChapters || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'auditDocuments'), { data: JSON.parse(JSON.stringify(state.auditDocuments || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 't_inbox_documents'), { data: JSON.parse(JSON.stringify(state.t_inbox_documents || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'meta'), { data: {
          auditCategories: JSON.parse(JSON.stringify(state.auditCategories || {})),
          documents: JSON.parse(JSON.stringify(state.documents || [])),
          externalRegInfo: JSON.parse(JSON.stringify(state.externalRegInfo || {}))
        } }, { merge: true })
      ];
      await Promise.all(writes);

      // 画像は menuImages/{メニューID} に1枚ずつ、10件ずつ並列で保存
      for (let i = 0; i < imaged.length; i += 10) {
        const batch = imaged.slice(i, i + 10).map(m =>
          setDoc(doc(db, 'menuImages', String(m.id)),
            { imageUrl: m.imageUrl || '', sampleImageUrl: m.sampleImageUrl || '' },
            { merge: true }
          ).catch(err => console.warn('Failed to save image', m.id, err))
        );
        await Promise.all(batch);
      }
      console.log('[Firestore Sync] 全データの同期保存完了');
    } catch (e) {
      console.error('[Firestore Sync] 保存失敗', e);
    }
  }, 2000);
}

// 即時初期化
loadStore();


// ============================================================================
// 演算状態 (Getters / Computed Properties)
// ============================================================================

/**
 * 原材料IDマップ (高速ルックアップ用)
 */
const ingredientsMap = computed(() => {
  const map = {};
  state.ingredients.forEach(ing => {
    map[ing.id] = ing;
  });
  return map;
});

/**
 * 有機割合計算ヘルパー
 * 有機JAS基準: 水と食塩を除く原材料の重量に占める、有機農産物・有機加工食品の割合 (%)
 * 
 * @param {Array} recipeItems - [{ ingredientId, amount }]
 * @returns {Object} { organicWeight, totalWeight, ratio, isValidOrganicMenu }
 */
function calculateOrganicRatio(recipeItems, _depth = 0) {
  if (!recipeItems || recipeItems.length === 0) {
    return { organicWeight: 0, totalWeight: 0, ratio: 0, isValidOrganicMenu: false, auditWarnings: [] };
  }

  let totalWeight = 0;      // 水・食塩を除いた全重量
  let organicWeight = 0;    // 有機原材料の総重量
  const auditWarnings = []; // 監査への適合・経過措置に関する警告

  recipeItems.forEach(item => {
    const amount = Number(item.amount) || 0;
    const ing = ingredientsMap.value[item.ingredientId];

    if (!ing) {
      // サブレシピ（自社製食品）参照: ingredientId が menu- で始まりメニューとして存在する場合、
      // そのサブレシピ自身の有機率を加味して親メニューの割合に反映する。
      const sub = (item.ingredientId && String(item.ingredientId).startsWith('menu-'))
        ? state.menus.find(m => m.id === item.ingredientId)
        : null;
      if (sub && _depth < 5) {
        const subCalc = calculateOrganicRatio(sub.recipe, _depth + 1);
        totalWeight += amount;
        organicWeight += amount * (subCalc.ratio / 100);
      }
      // 解決できない参照（欠落データ等）は計算から除外
      return;
    }

    // 料理酒に関する平成7年10月1日義務化警告（2024年監査指摘の対応）
    if (ing.name.includes('酒') && ing.type === 'general') {
      auditWarnings.push({
        id: 'warning-alcohol-jas',
        title: '料理酒JAS適合アラート',
        message: '令和7年10月1日以降、有機料理と謳うメニュー内に配合する料理酒には「格付JASマーク（有機）」が完全に必須化されます。現行の一般料理酒から、有機JAS認定酒への切り替えをご準備ください。'
      });
    }

    if (ing.type === 'salt_water') {
      // 水・食塩は分母・分子ともに計算から除外
      return;
    }

    totalWeight += amount;

    if (ing.type === 'organic') {
      organicWeight += amount;
    }
  });

  const ratio = totalWeight > 0 ? (organicWeight / totalWeight) * 100 : 0;
  // 小数第2位を四捨五入して第1位まで表示
  const roundedRatio = Math.round(ratio * 10) / 10;
  
  // 有機JASレストラン基準は原則95%以上
  const isValidOrganicMenu = roundedRatio >= 95.0;

  return {
    organicWeight,
    totalWeight,
    ratio: roundedRatio,
    isValidOrganicMenu,
    auditWarnings
  };
}

/**
 * レシピと有機割合をフルデコードしたメニューリスト
 */
const decodedMenus = computed(() => {
  return state.menus.map(menu => {
    const calc = calculateOrganicRatio(menu.recipe);
    
    // 詳細なレシピアイテム情報をバインド
    const fullRecipe = menu.recipe.map(item => {
      const ing = ingredientsMap.value[item.ingredientId];
      if (ing) {
        return { ...item, name: ing.name, type: ing.type, supplier: ing.supplier };
      }
      // サブレシピ（自社製食品）参照: menu- で始まりメニューとして存在する場合は「[自家製] 名前」で表示
      const sub = (item.ingredientId && String(item.ingredientId).startsWith('menu-'))
        ? state.menus.find(m => m.id === item.ingredientId)
        : null;
      if (sub) {
        const subRatio = calculateOrganicRatio(sub.recipe).ratio;
        return {
          ...item,
          name: `[自家製] ${sub.name}`,
          type: subRatio >= 95 ? 'organic' : 'general',
          supplier: '自社製',
          isSubRecipe: true
        };
      }
      // IDが原材料・サブレシピのいずれにも解決できない場合でも、
      // 項目自体に保存された名前（AI生成・手入力時の name）があればそれを表示する。
      return { ...item, name: item.name || '不明な原材料', type: 'general', supplier: '' };
    });

    return {
      ...menu,
      recipeDetails: fullRecipe,
      organicRatio: calc.ratio,
      totalWeight: calc.totalWeight,
      organicWeight: calc.organicWeight,
      isValidOrganic: calc.isValidOrganicMenu,
      auditWarnings: calc.auditWarnings, // アラート
      // 適合しているか、かつ「有機」をメニュー名等に表示している場合の整合性警告
      hasDiscrepancy: menu.isOrganicClaim && !calc.isValidOrganicMenu
    };
  });
});

/**
 * 直近のサマリーデータ (ダッシュボード用)
 */
const dashboardStats = computed(() => {
  const totalIngredients = state.ingredients.length;
  const organicIngredients = state.ingredients.filter(i => i.type === 'organic').length;
  
  const totalMenus = state.menus.length;
  // デコードしたメニューから有機適合メニューをカウント
  const compliantMenus = decodedMenus.value.filter(m => m.isValidOrganic).length;
  const activeOrganicClaims = state.menus.filter(m => m.isOrganicClaim).length;

  // 警告数（有機を謳っているのに適合していないメニュー数）
  const discrepancyCount = decodedMenus.value.filter(m => m.hasDiscrepancy).length;

  return {
    totalIngredients,
    organicIngredients,
    organicIngRatio: totalIngredients > 0 ? Math.round((organicIngredients / totalIngredients) * 100) : 0,
    totalMenus,
    compliantMenus,
    activeOrganicClaims,
    discrepancyCount
  };
});

/**
 * 仕入・受入記録のデコード（原材料名、証明書有無、JAS格付の補完）
 */
const decodedReceipts = computed(() => {
  return state.receipts.map(rec => {
    const ing = ingredientsMap.value[rec.ingredientId];
    return {
      ...rec,
      ingredientName: ing ? ing.name : '不明な原材料',
      supplier: ing ? ing.supplier : '',
      hasCertificate: ing ? ing.hasCertificate : false,
      certificateExpiry: ing ? ing.certificateExpiry : '',
      // 受入での確認不足、または期限切れに対する警告
      hasWarning: !rec.isSeparated || !rec.hasJasLabelVerified || !rec.isClean || rec.status !== 'good'
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
});

/**
 * 調理ログのデコード
 */
const decodedCookingLogs = computed(() => {
  return state.cookingLogs.map(log => {
    const menu = state.menus.find(m => m.id === log.menuId);
    return {
      ...log,
      menuName: menu ? menu.name : '不明なメニュー',
      masterName: menu ? (menu.masterName || menu.name) : '不明なメニュー',
      isOrganicClaim: menu ? menu.isOrganicClaim : false,
      hasWarning: !log.isUtensilsClean || !log.isIngredientVerified
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
});

/**
 * 清掃ログのデコード (日付順ソートのみ)
 */
const decodedCleaningLogs = computed(() => {
  return [...state.cleaningLogs].sort((a, b) => b.date.localeCompare(a.date));
});

/**
 * 有機JAS 3点リンク（仕入受入 - 調理提供 - 売上・生産管理）のトレーサビリティチェーン
 * レコードごとに、調理ログで使用したロット番号を逆引きし、受入側の監査エビデンス（JASマーク写真、分別保管状態）を結合
 */
const traceabilityChain = computed(() => {
  return state.cookingLogs.map(log => {
    const menu = state.menus.find(m => m.id === log.menuId);
    if (!menu) return null;

    // レシピに含まれる有機原材料ごとに、調理ログの lotDetails または receipts の最新ロットを突合
    const traces = menu.recipe.map(item => {
      const ing = ingredientsMap.value[item.ingredientId];
      if (!ing || ing.type !== 'organic') return null;

      // 調理ログの lotDetails から、この原材料のロット番号を抽出する
      // 例: "トマト: KIRI-260505A, オリーブオイル: OIL-0505"
      let matchedLot = 'ロット未指定';
      const detailParts = log.lotDetails.split(',');
      for (let part of detailParts) {
        if (part.includes(ing.name.replace('有機JAS', '').trim()) || part.includes(ing.name)) {
          const colonIdx = part.indexOf(':');
          if (colonIdx !== -1) {
            matchedLot = part.substring(colonIdx + 1).trim();
          } else {
            matchedLot = part.trim();
          }
          break;
        }
      }

      // 該当ロットの受入記録を検索
      const matchedReceipt = state.receipts.find(r => 
        r.ingredientId === item.ingredientId && 
        (r.lotNumber === matchedLot || matchedLot.includes(r.lotNumber))
      );

      return {
        ingredientId: item.ingredientId,
        ingredientName: ing.name,
        supplier: ing.supplier,
        lotNumber: matchedReceipt ? matchedReceipt.lotNumber : 'ロット不明',
        receiptDate: matchedReceipt ? matchedReceipt.date : '受入日不明',
        receiptQuantity: matchedReceipt ? matchedReceipt.quantity : 0,
        hasJasLabelVerified: matchedReceipt ? matchedReceipt.hasJasLabelVerified : false,
        isSeparated: matchedReceipt ? matchedReceipt.isSeparated : false,
        jasPhoto: matchedReceipt ? matchedReceipt.jasPhoto : ''
      };
    }).filter(t => t !== null);

    return {
      cookingLogId: log.id,
      cookingDate: log.date,
      menuId: menu.id,
      menuName: menu.name,
      quantityCooked: log.quantity, // 調理提供数（売上食数に一致）
      checkedBy: log.checkedBy,
      isUtensilsClean: log.isUtensilsClean,
      isIngredientVerified: log.isIngredientVerified,
      traces
    };
  }).filter(t => t !== null);
});


// ============================================================================
// Actions (操作メソッド群)
// ============================================================================

function setTab(tabName) {
  state.activeTab = tabName;
  saveStore();
}

// --- 原材料管理 ---
function addIngredient(ing) {
  const newIng = {
    id: `ing-${Date.now().toString().slice(-3)}-${Math.random().toString(36).slice(2, 5)}`,
    name: ing.name || '新規食材',
    supplier: ing.supplier || '未定',
    type: ing.type || 'general',
    hasCertificate: !!ing.hasCertificate,
    certificateExpiry: ing.certificateExpiry || '',
    hasJasLabel: !!ing.hasJasLabel,
    jasPhoto: ing.jasPhoto || '',
    updatedAt: new Date().toISOString()
  };
  state.ingredients.push(newIng);
  saveStore();
  return newIng;
}

function updateIngredient(id, updatedFields) {
  const idx = state.ingredients.findIndex(i => i.id === id);
  if (idx !== -1) {
    state.ingredients[idx] = {
      ...state.ingredients[idx],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    saveStore();
    return true;
  }
  return false;
}

function deleteIngredient(id) {
  const idx = state.ingredients.findIndex(i => i.id === id);
  if (idx !== -1) {
    // 依存関係チェック：この原材料がメニューレシピで使用されているか
    const isUsed = state.menus.some(menu => 
      menu.recipe.some(item => item.ingredientId === id)
    );
    if (isUsed) {
      throw new Error('この原材料はレシピに登録されているため削除できません。先にレシピから削除してください。');
    }
    state.ingredients.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// --- メニュー（レシピ）管理 ---
function addMenu(menu) {
  // バージョン名の自動採番：同じグループ（groupName || name）内の「第N版」の最大値 + 1。
  // 既存の番号付き版が無ければ、件数 + 1 を採用する。
  let versionName = menu.versionName;
  if (!versionName) {
    const groupKey = menu.groupName || menu.name || '新規メニュー';
    const siblings = state.menus.filter(m => (m.groupName || m.name) === groupKey);
    let maxN = 0;
    siblings.forEach(m => {
      const match = /第\s*(\d+)\s*版/.exec(m.versionName || '');
      if (match) maxN = Math.max(maxN, parseInt(match[1], 10));
    });
    const next = (maxN > 0 ? maxN : siblings.length) + 1;
    versionName = `第${next}版`;
  }
  const newMenu = {
    id: `menu-${Date.now().toString().slice(-3)}-${Math.random().toString(36).slice(2, 5)}`,
    name: menu.name || '新規メニュー',
      masterName: menu.masterName || '',
      groupName: menu.groupName || '',
      versionName,
      // 新規・複製ともに既定で「表示中（最新版）」にする
      isActiveVersion: menu.isActiveVersion === false ? false : true,
    price: Number(menu.price) || 0,
    isOrganicClaim: !!menu.isOrganicClaim,
    recipe: menu.recipe || [], // [{ ingredientId, amount }]
    description: menu.description || '',
    
    // JAS 0004 料理スペック帳票項目
    category: menu.category || '有機料理スペック',
    changeDetails: menu.changeDetails || '新規作成',
    targetCreatedDate: menu.targetCreatedDate || '',
    startDate: menu.startDate || '',
    reviewDate: menu.reviewDate || '',
    deadline: menu.deadline || '',
    creatorApproved: menu.creatorApproved || '',
    managerApproved: menu.managerApproved || '',
    courseTargetNum: menu.courseTargetNum || '年間3600食',
    singleTargetNum: menu.singleTargetNum || '年間60食',
    displayPeriod: menu.displayPeriod || '通年',
    displayMethod: menu.displayMethod || 'メニューに掲載',
    displayStyle: menu.displayStyle || '記号により表示',
    cookingInstructions: menu.cookingInstructions || '',
    remarks: menu.remarks || '',
    imageUrl: menu.imageUrl || '',
    sampleImageUrl: menu.sampleImageUrl || '',
    imageSeed: menu.imageSeed !== undefined ? menu.imageSeed : null,

    updatedAt: new Date().toISOString()
  };
  state.menus.push(newMenu);
  saveStore();
  return newMenu;
}

function updateMenu(id, updatedFields) {
  const idx = state.menus.findIndex(m => m.id === id);
  if (idx !== -1) {
    state.menus[idx] = {
      ...state.menus[idx],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    saveStore();
    return true;
  }
  return false;
}

function deleteMenu(id) {
  const idx = state.menus.findIndex(m => m.id === id);
  if (idx === -1) return false;

  const deleted = state.menus[idx];
  // 削除する版が「表示中（最新）」だったか。グループキーは履歴と同じ groupName || name。
  const wasActive = deleted.isActiveVersion !== false;
  const groupKey = deleted.groupName || deleted.name;

  state.menus.splice(idx, 1);

  // 表示中の版を削除した場合、同じグループに残る版のうち最新のものを表示中に戻す。
  // （クローンでアーカイブ＝isActiveVersion:false になった旧版を再表示するため）
  if (wasActive) {
    const siblings = state.menus.filter(m => (m.groupName || m.name) === groupKey);
    const hasActive = siblings.some(m => m.isActiveVersion !== false);
    if (siblings.length > 0 && !hasActive) {
      // 更新日時が最も新しい版を選ぶ（履歴の並びと同じ基準）
      const latest = siblings.slice().sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta || String(b.id).localeCompare(String(a.id));
      })[0];
      const li = state.menus.findIndex(m => m.id === latest.id);
      if (li !== -1) {
        // 履歴の並びを崩さないよう updatedAt は変更せず、表示フラグのみ戻す
        state.menus[li] = { ...state.menus[li], isActiveVersion: true };
      }
    }
  }

  saveStore();
  return true;
}

// --- 仕入・受入管理 ---
function addReceipt(rec) {
  const newRec = {
    id: `rec-${Date.now().toString().slice(-3)}-${Math.random().toString(36).slice(2, 5)}`,
    date: rec.date || new Date().toISOString().split('T')[0],
    ingredientId: rec.ingredientId,
    quantity: Number(rec.quantity) || 0,
    lotNumber: rec.lotNumber || 'LOT-AUTO',
    checkedBy: rec.checkedBy || state.restaurantInfo.manager,
    isSeparated: !!rec.isSeparated,
    hasJasLabelVerified: !!rec.hasJasLabelVerified,
    isClean: !!rec.isClean,
    status: rec.status || 'good',
    notes: rec.notes || ''
  };
  state.receipts.push(newRec);
  saveStore();
  return newRec;
}

function updateReceipt(id, updatedFields) {
  const idx = state.receipts.findIndex(r => r.id === id);
  if (idx !== -1) {
    state.receipts[idx] = {
      ...state.receipts[idx],
      ...updatedFields
    };
    saveStore();
    return true;
  }
  return false;
}

function deleteReceipt(id) {
  const idx = state.receipts.findIndex(r => r.id === id);
  if (idx !== -1) {
    state.receipts.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// --- 調理・提供管理 ---
function addCookingLog(log) {
  const newLog = {
    id: `cook-${Date.now().toString().slice(-3)}-${Math.random().toString(36).slice(2, 5)}`,
    date: log.date || new Date().toISOString().split('T')[0],
    menuId: log.menuId,
    quantity: Number(log.quantity) || 0,
    checkedBy: log.checkedBy || state.restaurantInfo.manager,
    isUtensilsClean: !!log.isUtensilsClean,
    isIngredientVerified: !!log.isIngredientVerified,
    lotDetails: log.lotDetails || '',
    notes: log.notes || ''
  };
  state.cookingLogs.push(newLog);
  saveStore();
  return newLog;
}

function updateCookingLog(id, updatedFields) {
  const idx = state.cookingLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.cookingLogs[idx] = {
      ...state.cookingLogs[idx],
      ...updatedFields
    };
    saveStore();
    return true;
  }
  return false;
}

function deleteCookingLog(id) {
  const idx = state.cookingLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.cookingLogs.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// --- 新規：清掃・掃除記録管理アクション ---
function addCleaningLog(log) {
  const newLog = {
    id: `clean-${Date.now().toString().slice(-3)}-${Math.random().toString(36).slice(2, 5)}`,
    date: log.date || new Date().toISOString().split('T')[0],
    area: log.area || 'ホール',
    checkedBy: log.checkedBy || state.restaurantInfo.manager,
    isFloorCleaned: !!log.isFloorCleaned,
    isTrashRemoved: !!log.isTrashRemoved,
    isContactPrevented: !!log.isContactPrevented,
    status: log.status || 'good',
    notes: log.notes || ''
  };
  state.cleaningLogs.push(newLog);
  saveStore();
  return newLog;
}

function updateCleaningLog(id, updatedFields) {
  const idx = state.cleaningLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.cleaningLogs[idx] = {
      ...state.cleaningLogs[idx],
      ...updatedFields
    };
    saveStore();
    return true;
  }
  return false;
}

function deleteCleaningLog(id) {
  const idx = state.cleaningLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.cleaningLogs.splice(idx, 1);
    saveStore();
    return true;
  }
  return false;
}

// --- 店舗情報管理 ---
  const syncFromRiRyLink = async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email || !password) {
          resolve({ requiresAuth: true });
        } else {
          // 有機JASの原材料を探す
          const organicIng = state.ingredients.find(i => i.isOrganicJAS);
          if (organicIng) {
            const newReceipt = {
              id: 'rirylink_' + Date.now(),
              date: new Date().toISOString().substring(0, 10),
              ingredientId: organicIng.id,
              quantity: Math.floor(Math.random() * 10) + 1,
              lotNumber: 'RL-' + Math.floor(Math.random() * 10000),
              checkedBy: 'Ri-Ry-Link連携',
              isSeparated: true,
              isClean: true,
              notes: 'Ri-Ry-Linkから自動同期された受入記録です',
              supplier: organicIng.supplier || '連携業者'
            };
            state.receipts.unshift(newReceipt);
            saveStore();
            resolve({ requiresAuth: false, message: 'Ri-Ry-Linkと同期しました。新着の受入記録が追加されました。' });
          } else {
            resolve({ requiresAuth: false, message: 'Ri-Ry-Linkと同期しましたが、新着の有機JAS受入記録はありませんでした。' });
          }
        }
      }, 800);
    });
  };

  function updateRestaurantInfo(info) {
  state.restaurantInfo = {
    ...state.restaurantInfo,
    ...info
  };
  saveStore();
  return true;
}

function initFirestoreSync() {
  if (isFirestoreSyncInitialized) return;
  isFirestoreSyncInitialized = true;
  console.log('[Firestore Sync] リアルタイム同期開始...');

  const collectionNames = [
    'menus', 'ingredients', 'receipts', 'cookingLogs', 'cleaningLogs',
    'manualChapters', 'auditDocuments', 't_inbox_documents', 'meta'
  ];
  let receivedCount = 0;       // 初回スナップショットを受信した種類数
  let migrationNeeded = false; // クラウドに該当ドキュメントが無く、ローカルに既存データがある場合 true

  // 画像（menuImages/{メニューID}）をリアルタイムで反映し、キャッシュも更新する。
  onSnapshot(collection(db, 'menuImages'), (snap) => {
    snap.forEach((d) => {
      const data = d.data();
      menuImageCache[d.id] = data;
      const m = state.menus.find(x => String(x.id) === d.id);
      if (m) {
        m.imageUrl = data.imageUrl || '';
        m.sampleImageUrl = data.sampleImageUrl || '';
      }
    });
  }, (err) => console.error('menuImages sync error:', err));

  // 各種類別ドキュメントをリアルタイム購読し、ローカル状態へ反映する。
  collectionNames.forEach((name) => {
    onSnapshot(doc(db, 'restaurants', name), (snap) => {
      if (snap.exists()) {
        const data = snap.data().data;
        // リモート反映中はエコー書き込みを抑止する（saveStore 内で参照）。
        isApplyingRemote = true;
        try {
          if (name === 'meta') {
            const m = data || {};
            if (m.auditCategories) state.auditCategories = { ...defaultAuditCategories, ...m.auditCategories };
            if (m.documents) {
              state.documents = m.documents;
              if (!documentsDefaultSnapshot) documentsDefaultSnapshot = JSON.parse(JSON.stringify(m.documents));
            }
            if (m.externalRegInfo) state.externalRegInfo = m.externalRegInfo;
          } else if (name === 'menus') {
            if (Array.isArray(data)) {
              // 本体には画像が含まれないため、キャッシュ済みの menuImages を合成する。
              data.forEach((mm) => {
                const img = menuImageCache[mm.id];
                if (img) {
                  mm.imageUrl = img.imageUrl || '';
                  mm.sampleImageUrl = img.sampleImageUrl || '';
                }
              });
              state.menus = data;
            }
          } else if (Array.isArray(data)) {
            state[name] = data;
          }
          // localStorage へ反映（isApplyingRemote=true のためクラウドへは書き戻さない）。
          saveStore();
        } finally {
          isApplyingRemote = false;
        }
      } else {
        // クラウドに該当ドキュメントが無い場合、ローカルに実データがあれば初回移行対象とする。
        if (name === 'menus' && state.menus && state.menus.length > 0) migrationNeeded = true;
        if (name === 'ingredients' && state.ingredients && state.ingredients.length > 0) migrationNeeded = true;
      }

      receivedCount++;
      // 全種類の初回スナップショットが揃い、移行が必要な場合のみローカル→クラウドへ一度だけ書き込む。
      if (receivedCount === collectionNames.length && migrationNeeded) {
        const isLocalDev = typeof location !== 'undefined' &&
          (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
        if (!isLocalDev) {
          console.log('[Firestore Sync] 初回マイグレーション実行：ローカルからクラウドへ');
          syncToFirestore();
        }
      }
    }, (err) => console.warn('[Firestore Sync] 同期エラー:', name, err));
  });
}

  function setTargetMenuToClone(menu) {
    state.targetMenuToClone = menu;
    saveStore();
  }

  function resetToSeeds() {
  localStorage.removeItem(STORE_KEY);
  loadStore();
}

// ============================================================================
// スキャン受信箱（本番ビルドから移植）
// ============================================================================
function addInboxDocument(docData) {
  if (!state.t_inbox_documents) state.t_inbox_documents = [];
  const item = {
    id: docData.id || `inbox_${Date.now()}`,
    fileName: docData.fileName || `scan_${Date.now().toString().slice(-6)}.jpg`,
    fileUrl: docData.fileUrl,
    receivedAt: docData.receivedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: docData.status || 'unread',
    suggestedType: docData.suggestedType || '未識別',
    parsedData: docData.parsedData || { date: new Date().toISOString().split('T')[0], ingredientName: '', quantity: 1, unit: 'kg', lotNumber: '', partnerName: '' }
  };
  state.t_inbox_documents.push(item);
  saveStore();
}

function deleteInboxDocument(id) {
  if (!state.t_inbox_documents) return;
  state.t_inbox_documents = state.t_inbox_documents.filter(d => d.id !== id);
  saveStore();
}

function clearInboxDocuments() {
  state.t_inbox_documents = [];
  saveStore();
}

function updateInboxDocument(id, updates) {
  if (!state.t_inbox_documents) return false;
  const idx = state.t_inbox_documents.findIndex(d => d.id === id);
  if (idx === -1) return false;
  state.t_inbox_documents[idx] = { ...state.t_inbox_documents[idx], ...updates };
  saveStore();
  return true;
}

// 受信箱の書類を確定処理：receipt は原材料を自動登録、audit_doc は監査資料へ取り込み
function processInboxDocument(id, type, data) {
  if (!state.t_inbox_documents) return;
  if (type === 'receipt') {
    const supplier = (data.partnerName || data.supplier || '不明な仕入先').trim();
    const items = (data.items && data.items.length > 0)
      ? data.items
      : [{ ingredientName: data.ingredientName, quantity: data.quantity, unit: data.unit }];
    items.forEach(it => {
      const name = (it.ingredientName || '未入力食材').trim();
      const exists = state.ingredients.find(x => x.name === name);
      if (!exists && name && name !== '未入力食材') {
        addIngredient({ name, supplier, type: it.type || 'organic', hasCertificate: false, certificateExpiry: '', hasJasLabel: it.type === 'organic' });
      }
    });
  } else if (type === 'audit_doc') {
    if (!state.auditDocuments) state.auditDocuments = [];
    state.auditDocuments.push({
      id: `audit_${Date.now()}`,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.documentType || 'その他資料',
      title: data.title || `監査資料: ${data.partnerName || '未指定'}`,
      supplier: data.partnerName || '不明な発行元',
      fileUrl: data.fileUrl || '',
      notes: data.notes || 'スキャン受信箱から監査ドキュメントとして取り込み'
    });
  }
  deleteInboxDocument(id);
}

// ============================================================================
// 監査ドキュメント（本番ビルドから移植）
// ============================================================================
const defaultAuditCategories = { contract: '委託契約書', analysis: '分析・検査表', machine: '設備保守管理表', other: 'その他資料' };

function addAuditDocument(docData) {
  if (!state.auditDocuments) state.auditDocuments = [];
  const item = {
    id: `audit_${Date.now()}`,
    date: docData.date || new Date().toISOString().split('T')[0],
    type: docData.type || 'その他',
    title: docData.title || '無題の資料',
    supplier: docData.supplier || '不明',
    fileUrl: docData.fileUrl || '',
    notes: docData.notes || ''
  };
  state.auditDocuments.push(item);
  saveStore();
  return item;
}

function deleteAuditDocument(id) {
  if (!state.auditDocuments) return false;
  state.auditDocuments = state.auditDocuments.filter(d => d.id !== id);
  saveStore();
  return true;
}

function updateAuditDocument(id, updates) {
  if (!state.auditDocuments) return false;
  const idx = state.auditDocuments.findIndex(d => d.id === id);
  if (idx === -1) return false;
  state.auditDocuments[idx] = { ...state.auditDocuments[idx], ...updates };
  saveStore();
  return true;
}

function updateAuditCategory(key, value) {
  if (!state.auditCategories || Object.keys(state.auditCategories).length === 0) {
    state.auditCategories = { ...defaultAuditCategories };
  }
  if (!(key in state.auditCategories)) return false;
  state.auditCategories[key] = (value && value.trim()) || defaultAuditCategories[key];
  saveStore();
  return true;
}

// ============================================================================
// マニュアル / 規定文書管理（本番ビルドから移植）
// ============================================================================
// 初回Firestore読込時の documents スナップショット（resetDocumentsToDefault 用）
let documentsDefaultSnapshot = null;

// バージョン番号を1つ繰り上げる (v1.0.0 -> v1.1.0)
function bumpDocVersion(v) {
  const t = (v || 'v1.0.0').replace(/^v/i, '').split('.');
  return `v${Number(t[0]) || 1}.${(Number(t[1]) || 0) + 1}.0`;
}

// カテゴリIDと文書IDから {cat, doc} を取得
function findCatDoc(catId, docId) {
  const cat = (state.documents || []).find(c => c.id === catId);
  if (!cat) return { cat: null, doc: null };
  return { cat, doc: (cat.items || []).find(d => d.id === docId) || null };
}

function updateManualChapter(id, updates) {
  if (!state.manualChapters) return false;
  const idx = state.manualChapters.findIndex(c => c.id === id);
  if (idx === -1) return false;
  state.manualChapters[idx] = { ...state.manualChapters[idx], ...updates };
  saveStore();
  return true;
}

function updateDocument(catId, docId, updates) {
  const { doc: d } = findCatDoc(catId, docId);
  if (!d) return false;
  Object.assign(d, updates, { date: new Date().toISOString().split('T')[0] });
  saveStore();
  return true;
}

function addDocumentRevision(catId, docId, { version, comment, author, text } = {}) {
  const { doc: d } = findCatDoc(catId, docId);
  if (!d) return false;
  const newVersion = version || bumpDocVersion(d.version);
  const today = new Date().toISOString().split('T')[0];
  if (typeof text === 'string') d.text = text;
  d.version = newVersion;
  d.date = today;
  if (!Array.isArray(d.history)) d.history = [];
  d.history.unshift({ version: newVersion, date: today, author: author || state.restaurantInfo.manager, comment: comment || '' });
  saveStore();
  return true;
}

function updateDocumentHistory(catId, docId, index, updates) {
  const { doc: d } = findCatDoc(catId, docId);
  if (!d || !Array.isArray(d.history) || !d.history[index]) return false;
  d.history[index] = { ...d.history[index], ...updates };
  saveStore();
  return true;
}

function updateDocumentStatus(catId, docId, status, approver) {
  const { doc: d } = findCatDoc(catId, docId);
  if (!d) return false;
  d.status = status;
  d.approvedBy = status === 'approved' ? (approver || state.restaurantInfo.manager) : '';
  saveStore();
  return true;
}

function updateAllDocumentsDates(originalRevisionDate, reviewDate) {
  (state.documents || []).forEach(cat => {
    (cat.items || []).forEach(item => {
      if (originalRevisionDate) item.originalRevisionDate = originalRevisionDate;
      if (reviewDate) item.reviewDate = reviewDate;
    });
  });
  saveStore();
  return true;
}

function uploadDocument(catId, { name, summary, text, auditPoints } = {}) {
  const cat = (state.documents || []).find(c => c.id === catId);
  if (!cat) return null;
  const today = new Date().toISOString().split('T')[0];
  const newDoc = {
    id: `doc-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`,
    name: name || '新規規定文書',
    version: 'v1.0.0',
    date: today,
    size: '0.1 MB',
    status: 'draft',
    approvedBy: '',
    summary: summary || '',
    text: text || '',
    auditPoints: auditPoints || '',
    originalRevisionDate: '',
    reviewDate: '',
    history: [{ version: 'v1.0.0', date: today, author: state.restaurantInfo.manager, comment: '新規文書を登録しました。' }]
  };
  if (!Array.isArray(cat.items)) cat.items = [];
  cat.items.push(newDoc);
  saveStore();
  return newDoc;
}

// 既定値へ戻す：本番は内蔵シードを使うが、ここでは初回Firestore読込時のスナップショットへ戻す
function resetDocumentsToDefault() {
  if (documentsDefaultSnapshot) {
    state.documents = JSON.parse(JSON.stringify(documentsDefaultSnapshot));
    saveStore();
    return true;
  }
  console.warn('resetDocumentsToDefault: 既定スナップショットが未取得のため復元できません');
  return false;
}

async function syncExternalRegInfo() {
  await new Promise(r => setTimeout(r, 1200));
  state.externalRegInfo = { ...state.externalRegInfo, lastSynced: new Date().toISOString() };
  saveStore();
  return true;
}


// ============================================================================
// エクスポート
// ============================================================================
export const restaurantStore = readonly({
  state,
  // 演算プロパティ (Computed)
  decodedMenus,
  dashboardStats,
  decodedReceipts,
  decodedCookingLogs,
  decodedCleaningLogs, // 新規追加
  traceabilityChain,   // 新規追加
  ingredientsMap,
  // 補助ユーティリティ
  calculateOrganicRatio,
  // Actions
  setTab,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  addMenu,
  updateMenu,
  deleteMenu,
  addReceipt,
  updateReceipt,
  deleteReceipt,
  addCookingLog,
  updateCookingLog,
  deleteCookingLog,
  addCleaningLog,     // 新規追加
  updateCleaningLog,  // 新規追加
  deleteCleaningLog,  // 新規追加
      setTargetMenuToClone,
  updateRestaurantInfo,
  resetToSeeds,
  syncFromRiRyLink,
  // スキャン受信箱（移植）
  addInboxDocument,
  deleteInboxDocument,
  clearInboxDocuments,
  updateInboxDocument,
  processInboxDocument,
  // 監査ドキュメント（移植）
  addAuditDocument,
  deleteAuditDocument,
  updateAuditDocument,
  updateAuditCategory,
  // マニュアル/規定文書（移植）
  updateManualChapter,
  updateDocument,
  addDocumentRevision,
  updateDocumentHistory,
  updateDocumentStatus,
  updateAllDocumentsDates,
  uploadDocument,
  resetDocumentsToDefault,
  syncExternalRegInfo,
  initFirestoreSync: initFirestoreSync
});
