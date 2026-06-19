<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { generateMenuImage, compressImageDataUrl } from '../utils/aiImageGen';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  Info,
  Scale,
  DollarSign,
  AlertOctagon,
  Eye,
  Settings,
  Printer,
  Calendar,
  UserCheck,
  TrendingUp,
  MapPin,
  Sparkles,
  Award,
  Camera,
  Image
} from 'lucide-vue-next';

const state = restaurantStore.state;
const decodedMenus = computed(() => restaurantStore.decodedMenus);
const ingredients = computed(() => state.ingredients);
const menus = computed(() => state.menus.filter(m => m.id !== currentId.value)); // 自分自身を親に選べないようにする

// AIや指定期間の納品履歴に基づく利用可能な食材を算出
const availableIngredientsInPeriod = computed(() => {
  let startStr = form.value.startDate || aiRecipeConfig.value.startDate;
  let endStr = form.value.deadline || aiRecipeConfig.value.endDate;
  
  if (!startStr) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    startStr = nextMonth.toISOString().split('T')[0];
  }
  if (!endStr) {
    const sDate = new Date(startStr);
    sDate.setMonth(sDate.getMonth() + 1);
    sDate.setDate(0);
    endStr = sDate.toISOString().split('T')[0];
  }

  const sDate = new Date(startStr);
  const eDate = new Date(startStr);
  sDate.setDate(sDate.getDate() - 15);
  
  const receipts = state.receipts.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d >= sDate && d <= eDate;
  });
  
  const usedIds = new Set();
  const available = [];
  receipts.forEach(r => {
    const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
    itemsToProcess.forEach(item => {
      const id = item.ingredientId;
      if (id && !usedIds.has(id)) {
        usedIds.add(id);
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) {
          available.push(ing);
        }
      }
    });
  });

  state.ingredients.forEach(ing => {
    if (ing.type === 'salt_water' && !usedIds.has(ing.id)) {
      available.push(ing);
    }
  });

  return available.length > 0 ? available : state.ingredients;
});

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  const reiwaMatch = dateStr.match(/令和(\d+|元)年(\d+)月(\d+)日/);
  if (reiwaMatch) {
    const yearStr = reiwaMatch[1];
    const year = yearStr === '元' ? 2019 : 2018 + parseInt(yearStr, 10);
    const month = parseInt(reiwaMatch[2], 10) - 1;
    const day = parseInt(reiwaMatch[3], 10);
    return new Date(year, month, day);
  }
  return null;
};

const isDeadlinePassed = (deadline) => {
  if (!deadline) return false;
  const d = parseDateString(deadline);
  if (!d || isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const isReviewDatePassed = (reviewDate) => {
  if (!reviewDate) return false;
  const d = parseDateString(reviewDate);
  if (!d || isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

// メニューを年度別にグループ化
const filterStatus = ref('all'); // 'all' | 'active' | 'achieved'

const filteredMenus = computed(() => {
  return decodedMenus.value.filter(menu => {
    // フィルター適用
    const achieved = isDeadlinePassed(menu.deadline);
    if (filterStatus.value === 'achieved' && !achieved) return false;
    if (filterStatus.value === 'active' && achieved) return false;
    
    // 過去のアーカイブ版（旧バージョン）は一覧から隠す
    if (menu.isActiveVersion === false) return false;
    
    return true;
  });
});
// モーダル・フォーム状態
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const referenceMenuId = ref('');



// 配合デザイナーモーダル状態 (v1.1.0 大画面化UX改善)
const showRecipeModal = ref(false);
const recipeModalForm = ref({
  menuId: null,
  name: '',
  recipe: []
});

// 印刷プレビュー (JAS帳票)用モーダル状態

// 改訂履歴モーダル
const showHistoryModal = ref(false);
const historyMenuMasterName = ref('');
const historyVersions = computed(() => {
  if (!historyMenuMasterName.value) return [];
  const targetGroupName = historyMenuMasterName.value;
  
  return decodedMenus.value.filter(m => {
    const gName = m.groupName || m.name;
    return gName === targetGroupName;
  })
  .sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA || b.id.localeCompare(a.id);
  });
});

const openHistoryModal = (menu) => {
  historyMenuMasterName.value = menu.groupName || menu.name;
  showHistoryModal.value = true;
};

const showSpecSheet = ref(false);
const selectedMenuForSpec = ref(null);

// 入力タブ
const activeFormTab = ref('basic'); // basic (基本情報), recipe (配合・シミュレーター), jas (JAS監査項目)

const form = ref({
  name: '',
  masterName: '',
  price: 1000,
  isOrganicClaim: true,
  description: '',
  recipe: [],
  
  // JAS 0004 料理スペック帳票項目
  category: '有機料理スペック',
  changeDetails: '',
  targetCreatedDate: '',
  startDate: '',
  reviewDate: '',
  deadline: '',
  creatorApproved: '',
  managerApproved: '',
  courseTargetNum: '年間3600食',
  singleTargetNum: '年間60食',
  displayPeriod: '通年',
  displayMethod: 'メニューに掲載',
  displayStyle: '記号により表示',
  cookingInstructions: '',
  remarks: '',
  imageUrl: '',
  sampleImageUrl: '',
  imageSeed: null
});

const errorMessage = ref('');

const openCloneModal = (menu) => {
  isEditing.value = false;
  currentId.value = null;
  errorMessage.value = '';
  
  let newTargetCreatedDate = '';
  let newStartDate = '';
  
  if (menu.reviewDate) {
    const rd = parseDateString(menu.reviewDate);
    if (rd && !isNaN(rd.getTime())) {
      const y = rd.getFullYear();
      const m = String(rd.getMonth() + 1).padStart(2, '0');
      const d = String(rd.getDate()).padStart(2, '0');
      newTargetCreatedDate = `${y}-${m}-${d}`;
      
      const nextMonthDate = new Date(y, rd.getMonth() + 1, 1);
      const ny = nextMonthDate.getFullYear();
      const nm = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      newStartDate = `${ny}-${nm}-01`;
    }
  }
  
  form.value = {
    clonedFromId: menu.id,
    name: menu.name || '',
    masterName: menu.masterName || menu.name,
    groupName: menu.groupName || '',
    price: menu.price || 0,
    isOrganicClaim: menu.isOrganicClaim !== undefined ? menu.isOrganicClaim : true,
    description: menu.description || '',
    recipe: menu.recipe ? menu.recipe.map(r => ({...r})) : [],
    category: menu.category || '有機料理スペック',
    changeDetails: '前回からの更新',
    targetCreatedDate: newTargetCreatedDate,
    startDate: newStartDate,
    reviewDate: '',
    deadline: '',
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
  };
  showRecipeModal.value = true;
};

onMounted(() => {


  if (state.targetMenuToClone) {
    openCloneModal(state.targetMenuToClone);
    restaurantStore.setTargetMenuToClone(null);
  }
});

const applyReferenceMenu = () => {
  if (!referenceMenuId.value) return;
  const refMenu = state.menus.find(m => m.id === referenceMenuId.value);
  if (!refMenu) return;
  
  form.value.name = refMenu.name || '';
  form.value.masterName = refMenu.masterName || refMenu.name || '';
  form.value.groupName = refMenu.groupName || '';
  form.value.price = refMenu.price || 0;
  form.value.description = refMenu.description || '';
  form.value.category = refMenu.category || '有機料理スペック';
  form.value.cookingInstructions = refMenu.cookingInstructions || '';
  form.value.recipe = refMenu.recipe ? refMenu.recipe.map(r => ({...r})) : [];
  form.value.isOrganicClaim = refMenu.isOrganicClaim !== undefined ? refMenu.isOrganicClaim : true;
  form.value.changeDetails = refMenu.changeDetails || '';
  form.value.courseTargetNum = refMenu.courseTargetNum || '';
  form.value.singleTargetNum = refMenu.singleTargetNum || '';
  form.value.displayPeriod = refMenu.displayPeriod || '通年';
  form.value.displayMethod = refMenu.displayMethod || 'メニューに掲載';
  form.value.displayStyle = refMenu.displayStyle || '記号により表示';
  form.value.remarks = refMenu.remarks || '';
};

const openAddModal = () => {
  isEditing.value = false;
  currentId.value = null;
  errorMessage.value = '';
  form.value = {
    name: '',
    masterName: '',
    groupName: '',
    price: 0,
    isOrganicClaim: true,
    description: '',
    recipe: [],
    category: '有機料理スペック',
    changeDetails: '新規作成',
    targetCreatedDate: '',
    startDate: '',
    reviewDate: '',
    deadline: '',
    creatorApproved: '',
    managerApproved: '',
    courseTargetNum: '年間3600食',
    singleTargetNum: '年間60食',
    displayPeriod: '通年',
    displayMethod: 'メニューに掲載',
    displayStyle: '記号により表示',
    cookingInstructions: '',
    remarks: '',
    imageUrl: '',
    sampleImageUrl: '',
    imageSeed: null
  };
  activeFormTab.value = 'basic';
  showRecipeModal.value = true;
};


const openSpecSheetModal = (menu) => {
  selectedMenuForSpec.value = menu;
  showSpecSheet.value = true;
};


const toYMD = (dateStr) => {
  if (!dateStr) return '';
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const openEditModal = (menu) => {
  isEditing.value = true;
  currentId.value = menu.id;
  errorMessage.value = '';
  form.value = {
    name: menu.name || '',
    masterName: menu.masterName || '',
    groupName: menu.groupName || '',
    price: menu.price || 0,
    isOrganicClaim: menu.isOrganicClaim !== undefined ? menu.isOrganicClaim : true,
    description: menu.description || '',
    recipe: menu.recipe ? menu.recipe.map(r => ({...r})) : [],
    category: menu.category || '有機料理スペック',
    changeDetails: menu.changeDetails || '',
    targetCreatedDate: toYMD(menu.targetCreatedDate),
    startDate: toYMD(menu.startDate),
    reviewDate: toYMD(menu.reviewDate),
    deadline: toYMD(menu.deadline),
    creatorApproved: menu.creatorApproved || '',
    managerApproved: menu.managerApproved || '',
    courseTargetNum: menu.courseTargetNum || '',
    singleTargetNum: menu.singleTargetNum || '',
    displayPeriod: menu.displayPeriod || '通年',
    displayMethod: menu.displayMethod || 'メニューに掲載',
    displayStyle: menu.displayStyle || '記号により表示',
    cookingInstructions: menu.cookingInstructions || '',
    remarks: menu.remarks || '',
    imageUrl: menu.imageUrl || '',
    sampleImageUrl: menu.sampleImageUrl || '',
    imageSeed: menu.imageSeed !== undefined ? menu.imageSeed : null
  };
  activeFormTab.value = 'basic';
  showRecipeModal.value = true;
};


// AIレシピ自動生成用
const showAiRecipeModal = ref(false);
const aiRecipeConfig = ref({
  startDate: '',
  endDate: '',
  targetGrams: 200,
});
const isGeneratingAiRecipe = ref(false);
const aiRecipeError = ref('');

const openAiRecipeModal = () => {
  console.log("Button clicked! Opening AI Modal.");
  showAiRecipeModal.value = true;
  aiRecipeError.value = '';
  
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  aiRecipeConfig.value.startDate = form.value.startDate || nextMonth.toISOString().split('T')[0];
  
  if (form.value.deadline) {
    aiRecipeConfig.value.endDate = form.value.deadline;
  } else {
    const ed = new Date(aiRecipeConfig.value.startDate);
    ed.setMonth(ed.getMonth() + 1);
    ed.setDate(0);
    aiRecipeConfig.value.endDate = ed.toISOString().split('T')[0];
  }
};

const generateRecipeWithAi = async () => {
  console.log("generateRecipeWithAi button clicked!");
  if (!aiRecipeConfig.value.startDate || !aiRecipeConfig.value.endDate) {
    aiRecipeError.value = '対象期間を入力してください。';
    return;
  }
  isGeneratingAiRecipe.value = true;
  aiRecipeError.value = '';
  
  try {
    const sDate = new Date(aiRecipeConfig.value.startDate);
    const eDateStart = new Date(aiRecipeConfig.value.startDate);
    sDate.setDate(sDate.getDate() - 15);
    
    const startReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= sDate && d <= eDateStart;
    });
    
    const availableIngredients = [];
    const startUsedIds = new Set();
    startReceipts.forEach(r => {
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (id && !startUsedIds.has(id)) {
          startUsedIds.add(id);
          const ing = state.ingredients.find(i => i.id === id);
          if (ing && !ing.name.includes('フローラル豆') && !ing.name.includes('テンメンジャン')) {
            availableIngredients.push({ id: ing.id, name: ing.name, type: ing.type });
          }
        }
      });
    });

    if (availableIngredients.length === 0) {
      throw new Error('開始時点(前15日以内)に仕入れられた食材が見つかりませんでした。');
    }

    const fullEndDate = new Date(aiRecipeConfig.value.endDate);
    const timelineReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d > eDateStart && d <= fullEndDate;
    });

    const lastDeliveryMap = {};
    const newIngredientIds = new Set();
    timelineReceipts.forEach(r => {
      const dStr = r.date;
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (!id) return;
        if (!lastDeliveryMap[id] || dStr > lastDeliveryMap[id]) lastDeliveryMap[id] = dStr;
        if (!startUsedIds.has(id)) newIngredientIds.add(id);
      });
    });

    const endedIngredients = [];
    const substituteIngredients = [];
    
    startUsedIds.forEach(id => {
      const lastDel = lastDeliveryMap[id] || eDateStart.toISOString().split('T')[0];
      const lastD = new Date(lastDel);
      const daysDiff = (fullEndDate - lastD) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 14) {
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) endedIngredients.push(`${ing.name}`);
      }
    });

    newIngredientIds.forEach(id => {
      const ing = state.ingredients.find(i => i.id === id);
      if (ing) substituteIngredients.push(ing.name);
    });
    
    const apiKey = state.restaurantInfo.geminiApiKey;
    if (!apiKey) throw new Error('設定画面でGemini APIキーが設定されていません。');
    
    const isRevision = !!currentId.value;
    
    let conditionText = '';
    if (isRevision) {
      const masterNameContext = form.value.masterName ? `\n- 【重要】共通メニュー名（集計グループ）は「${form.value.masterName}」です。この料理の種類から大幅にずれたレシピにならないようにしてください。` : '';
      conditionText = '- 今回は既存レシピの「改定」です。' + masterNameContext + '\n- 【重要】指定期間内に仕入れ履歴がない（利用可能な食材リストに存在しない）食材は、既存レシピにあっても必ず除外（削除）してください。\n- 【重要】抽出された「利用可能な食材リスト」の中に、既存レシピにない新しい食材が含まれている場合、それがこの料理（共通メニュー名）のコンセプトに合う代替品・追加食材であれば必要に応じて追加（マージ）してください。スパゲッティなどの全く無関係な食材を無理に混ぜて別の料理にしないでください。\n- 既存の食材の分量を大きく変えすぎないように調整してください。\n\n既存のレシピ:\n' + JSON.stringify(form.value.recipe.map(r => ({name: r.name, amount: r.amount})), null, 2);
    } else {
      const dishConcept = form.value.name || form.value.masterName;
      const conceptText = dishConcept ? `\n- 【重要】作成する料理のコンセプト（メニュー名）は「${dishConcept}」です。この料理の種類から大幅にずれたレシピ（無関係な食材の混ぜ合わせなど）にならないようにしてください。` : '';
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g' + conceptText;
    }

    const ingredientsText = availableIngredients.map(i => '- ' + i.name + ' (ID: ' + i.id + ', 区分: ' + (i.type === 'organic' ? '有機JAS品' : '一般食品')).join('\n');

    let substituteNotes = '';
    if (endedIngredients.length > 0) {
      substituteNotes = `\n- 【重要】以下の食材は提供期間の途中で納品が終了します: ${endedIngredients.join(', ')}。\nもしこれらの終了予定食材をレシピの「変更内容」として処理する場合、'changeDetails'に「※○○は途中で終了するため、以降は[代用食材]で代用します」という注意書きを記述してください。\n[代用候補食材]: ${substituteIngredients.length > 0 ? substituteIngredients.join(', ') : '他の利用可能な食材'}`;
    }

    const promptText = `あなたはプロのレストランのシェフ兼メニュー開発者です。
以下の「利用可能な食材リスト（スタート時に存在する食材）」のみを使用して、レシピを一つ考案してください。

【制約条件】
- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）
- 【絶対条件】「有機フローラル豆」および「有機テンメンジャン」は料理には使用できないため、絶対にレシピに含めないでください。
- レストランのコンセプト上、可能な限り「有機JAS品(type: organic)」の重量割合が95%以上になるよう配慮してください。ただし料理として成立させるために必要な場合は「一般食品(type: general)」も適宜使用してください。${substituteNotes}
${conditionText}

【利用可能な食材リスト】
${ingredientsText}

【出力形式】
必ず以下の形式の厳密なJSONのみを出力してください。Markdownブロックなどは付けずに、純粋なJSON文字列だけを返してください。
{
  "changeDetails": "変更内容（食材の仕入れ終了・代用があればここに簡潔に記載。なければ空文字）",
  "recipe": [
    {
      "ingredientId": "リストにあるID",
      "amount": "1食あたりのグラム数（数字のみ。例: 50）"
    }
  ]
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AIからJSONを抽出できませんでした。');
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.changeDetails) {
      form.value.changeDetails = parsed.changeDetails;
    }
    
    // 自動で期限日と見直し日を設定
    if (aiRecipeConfig.value.endDate) {
      form.value.deadline = aiRecipeConfig.value.endDate;
      const endD = new Date(aiRecipeConfig.value.endDate);
      endD.setDate(endD.getDate() - 5);
      form.value.reviewDate = endD.toISOString().split('T')[0];
    }
    
    const newRecipe = [];
    if (parsed.recipe && Array.isArray(parsed.recipe)) {
      parsed.recipe.forEach(pr => {
        const ing = state.ingredients.find(i => i.id === pr.ingredientId);
        if (ing) {
          newRecipe.push({
            ingredientId: ing.id,
            name: ing.name,
            amount: pr.amount
          });
        }
      });
    }
    form.value.recipe = newRecipe;
    
    showAiRecipeModal.value = false;
    // alert('AIによるレシピ自動生成が完了しました！新規食材が追加された場合、分量が0gになっていることがありますので調整してください。');
  } catch (err) {
    console.error('AI Recipe Error:', err);
    aiRecipeError.value = 'エラーが発生しました: ' + err.message;
  } finally {
    isGeneratingAiRecipe.value = false;
  }
};


const saveMenu = async () => {
  try {
    if (isEditing.value) {
      await restaurantStore.updateMenu(currentId.value, form.value);
    } else {
      await restaurantStore.addMenu(form.value);
      if (form.value.clonedFromId) {
        await restaurantStore.updateMenu(form.value.clonedFromId, { isActiveVersion: false });
      }
    }
    showRecipeModal.value = false;
  } catch (err) {
    errorMessage.value = err.message || 'エラーが発生しました';
  }
};

// 提供数・年間推移の表示状態・算出ロジック
const expandedStats = ref({});
const currentYear = ref(2026); // 監査等に合わせた標準年度 (必要に応じて動的に変更可能)

const toggleStats = (menuId) => {
  expandedStats.value[menuId] = !expandedStats.value[menuId];
};

const getMonthlyServingData = (menuId, year = currentYear.value) => {
  const monthlyCounts = Array(12).fill(0);
  if (!state.cookingLogs) return monthlyCounts;
  
  const logs = state.cookingLogs.filter(log => {
    if (log.menuId !== menuId) return false;
    if (!log.date) return false;
    // YYYY-MM-DD フォーマットを安全にパース
    const parts = log.date.split('-');
    if (parts.length < 1) return false;
    const logYear = parseInt(parts[0], 10);
    return logYear === year;
  });
  
  logs.forEach(log => {
    const parts = log.date.split('-');
    if (parts.length < 2) return;
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    if (month >= 0 && month < 12) {
      monthlyCounts[month] += Number(log.quantity) || 0;
    }
  });
  
  return monthlyCounts;
};

const getYearlyTotal = (menuId, year = currentYear.value) => {
  return getMonthlyServingData(menuId, year).reduce((sum, val) => sum + val, 0);
};

const getBarHeight = (count, data) => {
  const max = Math.max(...data);
  if (max === 0) return '0%';
  return `${Math.max(4, (count / max) * 100)}%`; // 最低でもわずかに4%表示させて視認性を確保
};

// 検証用：デモ提供実績の自動生成
const generateDemoData = (menuId) => {
  if (confirm('過去12ヶ月分のリアルな提供実績（計約350食前後、なだらかな増加トレンド）をシミュレーション生成し、グラフや監査用テーブルの挙動を確認しますか？')) {
    // 1月〜12月のリアルな推移
    const baseCounts = [18, 22, 20, 28, 25, 36, 32, 45, 38, 48, 40, 52];
    
    // 既存の調理ログを安全にクリアして重複を防ぐ (readonly制約をアクションを介して回避)
    const logsToDelete = state.cookingLogs.filter(log => log.menuId === menuId);
    logsToDelete.forEach(log => {
      restaurantStore.deleteCookingLog(log.id);
    });

    for (let month = 0; month < 12; month++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const randomFluctuation = Math.floor(Math.random() * 8) - 4; // -4〜+4のゆらぎ
      const quantity = Math.max(5, baseCounts[month] + randomFluctuation);
      const date = `${currentYear.value}-${monthStr}-15`;

      // このメニューのレシピから有機JAS原材料のロット詳細情報を自動補完
      const menu = state.menus.find(m => m.id === menuId);
      let lotDetails = '';
      if (menu && menu.recipe) {
        const lotParts = menu.recipe.map(item => {
          const ing = ingredients.value.find(i => i.id === item.ingredientId);
          if (ing && ing.type === 'organic') {
            const sampleLots = {
              '有機たまねぎ': 'KIRI-ONION-05',
              '有機トウニュウ900': 'MEIRAKU-SOY-12',
              '有機カラーピーマンB 5kg': 'NABEYAMA-PEP-08',
              '有機ピーマンB': 'NABEYAMA-GPEP-02',
              '有機トーホー クインテット 有機/FTフローラル豆 300g': 'TOHO-BEAN-22',
              '有機テンメンジャン 1kg 有機 木': 'NISHIHARA-TMJ-15'
            };
            const lotNum = sampleLots[ing.name] || 'LOT-AUTO-2026';
            return `${ing.name}: ${lotNum}`;
          }
          return null;
        }).filter(p => p !== null);
        lotDetails = lotParts.join(', ');
      }

      restaurantStore.addCookingLog({
        menuId,
        date,
        quantity,
        isUtensilsClean: true,
        isIngredientVerified: true,
        lotDetails: lotDetails || '一般原材料のみ',
        checkedBy: state.restaurantInfo.manager || '角田 健一'
      });
    }
    
    alert('過去12ヶ月分のデモ提供実績データを自動生成しました！\n（ダッシュボード、グラフ、監査用トレーサビリティチェーンに即座に反映されます）');
  }
};



// 削除アクション
const deleteMenu = (id, name) => {
  if (confirm(`メニュー「${name}」を削除してもよろしいですか？`)) {
    restaurantStore.deleteMenu(id);
  }
};

const getIngredientType = (id) => {
  const ing = state.ingredients.find(i => i.id === id);
  return ing ? ing.type : 'general';
};

// --- 配合デザイナーモーダル用アクション群 (v1.1.0) ---
const addRecipeModalRow = () => {
  recipeModalForm.value.recipe.push({ ingredientId: ingredients.value[0]?.id || '', amount: 100 });
};

const removeRecipeModalRow = (index) => {
  recipeModalForm.value.recipe.splice(index, 1);
};

const openRecipeDesigner = (menu = null) => {
  if (menu) {
    // メニューカードから直接配合調整を開く
    recipeModalForm.value = {
      menuId: menu.id,
      name: menu.name,
      recipe: menu.recipe.map(item => ({ ...item }))
    };
  } else {
    // 新規登録・編集モーダルから配合調整を別窓で開く
    recipeModalForm.value = {
      menuId: null,
      name: form.value.name || '新規メニュー',
      recipe: form.value.recipe.map(item => ({ ...item }))
    };
  }
  showRecipeModal.value = true;
};

const saveRecipeDesigner = () => {
  if (recipeModalForm.value.recipe.some(r => !r.ingredientId || r.amount <= 0)) {
    alert('レシピのすべての原材料について、正しい原材料の選択と0より大きい重量を設定してください。');
    return;
  }

  if (recipeModalForm.value.menuId) {
    // 既存メニューの直接レシピ更新
    try {
      const menuToUpdate = state.menus.find(m => m.id === recipeModalForm.value.menuId);
      if (menuToUpdate) {
        restaurantStore.updateMenu(recipeModalForm.value.menuId, {
          ...menuToUpdate,
          recipe: recipeModalForm.value.recipe
        });
      }
      showRecipeModal.value = false;
    } catch (err) {
      alert(err.message);
    }
  } else {
    // 新規・編集モーダル内での配合情報の一時ストック（親フォームに反映）
    form.value.recipe = recipeModalForm.value.recipe.map(item => ({ ...item }));
    showRecipeModal.value = false;
  }
};

const addRecipeRow = () => {
  form.value.recipe.push({ ingredientId: state.ingredients[0]?.id || '', amount: 0 });
};

const removeRecipeRow = (index) => {
  form.value.recipe.splice(index, 1);
};

const simulationResult = computed(() => {
  return restaurantStore.calculateOrganicRatio(form.value.recipe);
});

const handlePrint = () => {
  // 帳票要素を取得
  const sheetEl = document.querySelector('.modern-spec-sheet');
  if (!sheetEl) { window.print(); return; }

  // 現在ページの全スタイルシートをテキストとして収集
  let cssText = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          // @media print ルールは除外（新ウィンドウでは不要）
          if (rule.type !== CSSRule.MEDIA_RULE || !rule.media.mediaText.includes('print')) {
            cssText += rule.cssText + '\n';
          }
        }
      } catch {}
    }
  } catch {}

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>JAS料理スペック管理票</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 8mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* 継承スタイル */
    ${cssText}
    /* A4幅に収める */
  
  /* モダンレイアウト用の印刷ハック */
  .modern-spec-sheet {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 2mm !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-family: "Inter", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  }
  .modern-spec-sheet * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @media print {
    .print-border { border: 1px solid #e5e7eb !important; }
    .print-border-b { border-bottom: 1px solid #e5e7eb !important; }
    .print-border-t { border-top: 1px solid #e5e7eb !important; }
    .print-bg { background-color: #f9fafb !important; }
    .print-teal-bg { background-color: #f0fdfa !important; }
    .print-green-bg { background-color: #15803d !important; color: white !important; }
    .print-amber-bg { background-color: #fffbeb !important; }
    .print-orange-bg { background-color: #ffedd5 !important; }
    .print-indigo-bg { background-color: #eef2ff !important; }
    
    .modern-card, .modern-summary-box > div, .modern-instructions > div {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .modern-recipe-box tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
</style>
</head>
<body>
  ${sheetEl.outerHTML}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { window.print(); return; } // ポップアップブロック時はフォールバック
  win.document.open();
  win.document.write(html);
  win.document.close();
};

// 調理方法のテキストエリアで改行時に自動で番号を振る (v1.3.1)
const isGeneratingInstructions = ref(false);

const generateInstructionsOnlyWithAi = async () => {
  if (!form.value.recipe || form.value.recipe.length === 0) {
    alert('まずは食材（レシピ構成）を入力してください。');
    return;
  }
  const apiKey = state.restaurantInfo.geminiApiKey;
  if (!apiKey) {
    alert('設定画面でGemini APIキーを設定してください。');
    return;
  }

  isGeneratingInstructions.value = true;
  try {
    const ingredientsText = form.value.recipe.map(item => {
      let name = '不明';
      if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
        const sm = state.menus.find(m => m.id === item.ingredientId);
        if (sm) name = '[自家製] ' + sm.name;
      } else {
        const ing = state.ingredients.find(i => i.id === item.ingredientId);
        if (ing) name = ing.name;
      }
      return `- ${name}: ${item.amount}g`;
    }).join('\n');

    const promptText = `あなたはプロのレストランのシェフです。
以下の「決定済みの食材リスト」と「変更内容」をもとに、「具体的な調理方法（混同・汚染防止を含む詳細手順）」、「備考欄（JAS監査上重要な管理事項）」、「料理名（JAS登録名称）」の3つを提案してください。

【現在の料理名】
${form.value.name || form.value.masterName || '新規料理'}

【決定済みの食材リスト】
${ingredientsText}

【変更内容（スペック更新時）】
${form.value.changeDetails || '特になし'}

【指示】
- 「具体的な調理方法」は、長文にならず、簡潔でシンプルな表現にとどめてください。必ず「1. 〇〇\n2. 〇〇」のように番号ごとに改行（\n）を行ってください。
- 「備考欄」には、上記「変更内容」に仕入れ終了や食材変更の記載があれば、それに触れてください（例：「※〇〇は途中で終了するため、以降は△△で代用する」など）。特に変更がなければ空白で構いません。
- 「料理名」には、現在の食材リストにふさわしいJAS登録名称を提案してください（基本は現在の料理名を踏襲しつつ、メイン食材が変わっていれば調整）。
- 出力は必ず以下の形式の厳密なJSONのみを返してください。Markdownの装飾（\`\`\`など）は不要です。
{
  "menuName": "提案する料理名",
  "cookingInstructions": "調理手順（1. 2. のように番号ごとに改行）",
  "remarks": "備考欄のテキスト"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AIからJSONを抽出できませんでした。');
    const parsed = JSON.parse(jsonMatch[0]);
    
    form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
    form.value.remarks = parsed.remarks || form.value.remarks;

  } catch (e) {
    console.error(e);
    alert('AIによる手順生成に失敗しました: ' + e.message);
  } finally {
    isGeneratingInstructions.value = false;
  }
};

const handleCookingInstructionsKeydown = (e) => {
  const textarea = e.target;
  const val = textarea.value;
  const start = textarea.selectionStart;
  
  // 現在の行（カーソルがある行）を取得
  const textBeforeCursor = val.substring(0, start);
  const lastLineBreak = textBeforeCursor.lastIndexOf('\n');
  const currentLine = textBeforeCursor.substring(lastLineBreak + 1);
  
  // 「数字. 」で始まっているか判定
  const match = currentLine.match(/^(\d+)\.\s/);
  if (match) {
    e.preventDefault(); // デフォルトの改行を防止
    const nextNum = parseInt(match[1], 10) + 1;
    const insertText = `\n${nextNum}. `;
    
    // 文字列の挿入
    form.value.cookingInstructions = val.substring(0, start) + insertText + val.substring(start);
    
    // カーソル位置を調整
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
    }, 0);
  }
};



// --- 料理写真のアップロード機能 (v1.4.0 追加) ---
// localStorage 容量対策：保存前に圧縮（長辺800px / JPEG q0.8）
const handleMenuImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('画像ファイルを選択してください。');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (event) => {
    form.value.imageUrl = await compressImageDataUrl(event.target.result, 800, 0.8);
  };
  reader.readAsDataURL(file);
};

const handleSampleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('画像ファイルを選択してください。');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (event) => {
    // 見本写真は参考用なのでさらに小さく（長辺640px / q0.75）
    form.value.sampleImageUrl = await compressImageDataUrl(event.target.result, 640, 0.75);
  };
  reader.readAsDataURL(file);
};

const isGeneratingImage = ref(false);
const aiProgressMessage = ref('');
const lastAiResult = ref(null); // { seed, prompt, usedSamples, mode }

const generateImageWithAi = async () => {
  if (!form.value.name.trim()) {
    alert('まずは上に料理名（JAS登録名称）を入力してください。料理名を基にAI画像を作成します。');
    return;
  }
  isGeneratingImage.value = true;
  aiProgressMessage.value = '準備中…';
  try {
    const result = await generateMenuImage({
      dishName: form.value.name.trim(),
      recipeItems: form.value.recipe || [],
      ingredients: state.ingredients,
      geminiApiKey: state.restaurantInfo.geminiApiKey, // 任意。無くてもサーバーサンプル＋食材で動作
      manualSampleDataUrl: form.value.sampleImageUrl,  // 手動アップロードがあれば最優先
      onProgress: (m) => { aiProgressMessage.value = m; }
    });
    form.value.imageUrl = result.imageDataUrl;
    form.value.imageSeed = result.seed;
    lastAiResult.value = {
      seed: result.seed,
      prompt: result.prompt,
      usedSamples: result.usedSamples,
      mode: result.mode
    };
    console.log('[AI Image Gen]', lastAiResult.value);
  } catch (err) {
    console.error('AI Image Gen Error:', err);
    alert(`AI画像生成に失敗しました。\n${err.message || err}`);
  } finally {
    isGeneratingImage.value = false;
    aiProgressMessage.value = '';
  }
};

// JAS 0004 適合表示記号（壺のマーク）の数と範囲テキスト算出ヘルパー (v1.4.0 追加)
const getTsuboCount = (ratio) => {
  const r = parseFloat(ratio) || 0;
  if (r >= 95) return 4;
  if (r >= 80) return 3;
  if (r >= 50) return 2;
  return 1;
};

const getTsuboRangeText = (ratio) => {
  const r = parseFloat(ratio) || 0;
  if (r >= 95) return '95%以上';
  if (r >= 80) return '80%以上95%未満';
  if (r >= 50) return '50%以上80%未満';
  return '50%未満';
};

// JAS 料理スペック帳票 A4二列レイアウト用のデータ成形 (v1.4.0 追加)
const selectedMenuSpecData = computed(() => {
  const menu = selectedMenuForSpec.value;
  if (!menu) return null;

  // 1. 原材料配合（最大21行の枠組みを作成）
  // 水・食塩を除く比率を正しく計算するための詳細リスト
  const details = menu.recipeDetails || [];
  
  // 左右11行ずつの枠 (左: 0-10, 右: 11-20)
  const leftRows = [];
  const rightRows = [];

  for (let i = 0; i < 11; i++) {
    // 左側 (No.1〜11)
    if (i < details.length) {
      leftRows.push({
        no: i + 1,
        name: details[i].name,
        typeText: details[i].type === 'organic' ? '有機' : (details[i].type === 'salt_water' ? '水塩' : '非有機'),
        amount: details[i].amount,
        unit: 'g'
      });
    } else {
      leftRows.push({ no: i + 1, name: '', typeText: '', amount: '', unit: '' });
    }

    // 右側 (No.12〜21)
    const rightIndex = i + 11;
    if (rightIndex < 21) {
      if (rightIndex < details.length) {
        rightRows.push({
          no: rightIndex + 1,
          name: details[rightIndex].name,
          typeText: details[rightIndex].type === 'organic' ? '有機' : (details[rightIndex].type === 'salt_water' ? '水塩' : '非有機'),
          amount: details[rightIndex].amount,
          unit: 'g'
        });
      } else {
        rightRows.push({ no: rightIndex + 1, name: '', typeText: '', amount: '', unit: '' });
      }
    }
  }

  // 2. 作り方（最大7行の枠組みを作成）
  // markdownの箇条書きや改行区切りの作り方を配列化
  const instructions = menu.cookingInstructions
    ? menu.cookingInstructions.split('\n').map(line => line.replace(/^\d+[\.．]\s*/, '').trim()).filter(Boolean)
    : [];
  const instructionRows = [];
  for (let i = 0; i < 7; i++) {
    instructionRows.push({
      no: i + 1,
      text: i < instructions.length ? instructions[i] : ''
    });
  }

  // 3. 和暦の日付表記（おもてなし和暦自動変換）
  const toWareki = (dateStr) => {
    if (!dateStr) return '未設定';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const year = date.getFullYear();
      let reiwaYear = year - 2018;
      let warekiStr = `令和${reiwaYear}年`;
      if (reiwaYear === 1) warekiStr = '令和元年';
      
      return `${warekiStr}${date.getMonth() + 1}月${date.getDate()}日`;
    } catch (e) {
      return dateStr;
    }
  };

  // 4. JAS管理票テンプレート向けのフラット配列（template が直接 .ingredients[*] を参照）
  //    各要素: name / organicType / supplier / amount / percentage / symbol
  const ingredients = details.map((d) => {
    const isOrganic = d.type === 'organic';
    const isSaltWater = d.type === 'salt_water';
    const denom = Number(menu.totalWeight) || 0; // 水・塩を除いた重量（store で計算済み）
    let pct = '';
    if (isSaltWater) {
      pct = '—';
    } else if (denom > 0) {
      pct = ((Number(d.amount) / denom) * 100).toFixed(1);
    } else {
      pct = '0.0';
    }
    return {
      name: d.name || '',
      organicType: d.type || 'general',
      supplier: d.supplier || '',
      amount: d.amount,
      percentage: pct,
      symbol: isOrganic ? '◎' : (isSaltWater ? '—' : '○')
    };
  });

  return {
    leftRows,
    rightRows,
    instructionRows,
    ingredients, // ★ 追加: JAS管理票テンプレート用
    targetCreatedDateWareki: toWareki(menu.targetCreatedDate),
    startDateWareki: toWareki(menu.startDate),
    reviewDateWareki: toWareki(menu.reviewDate),
    totalWeight: menu.totalWeight,
    organicWeight: menu.organicWeight,
    organicRatio: menu.organicRatio,
    generalWeight: ((Number(menu.totalWeight) || 0) - (Number(menu.organicWeight) || 0)).toFixed(1),
    generalRatio: (100 - (Number(menu.organicRatio) || 0)).toFixed(1),
    managerApprovalDateStamp: (() => {
      if (!menu.targetCreatedDate) return '06/8/26';
      const d = new Date(menu.targetCreatedDate);
      if (isNaN(d.getTime())) return menu.targetCreatedDate.substring(2).replace(/-/g, '/');
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear().toString().substring(2);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}/${m}/${day}`;
    })(),
    creatorDateStamp: menu.targetCreatedDate ? menu.targetCreatedDate.substring(2).replace(/-/g, '/') : '06/8/25'
  };
});
</script>

<template>
  <div class="animate-fade-in">
    <div class="view-header mb-6 no-print">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><FileText :size="24" /> 有機料理スペック（配合）管理</h2>
      </div>
      <div class="flex items-center gap-4">
        <!-- フィルター -->
        <div class="filter-group" style="display: flex; background: white; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <button 
            @click="filterStatus = 'all'" 
            :style="filterStatus === 'all' ? 'background: #f8fafc; font-weight: 600; color: #0f172a;' : 'background: white; color: #64748b;'"
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-right: 1px solid #e2e8f0; border-bottom: none; border-top: none; border-left: none; cursor: pointer;"
          >すべて</button>
          <button 
            @click="filterStatus = 'active'" 
            :style="filterStatus === 'active' ? 'background: #f8fafc; font-weight: 600; color: #0f172a;' : 'background: white; color: #64748b;'"
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-right: 1px solid #e2e8f0; border-bottom: none; border-top: none; border-left: none; cursor: pointer;"
          >現在進行</button>
          <button
            @click="filterStatus = 'achieved'"
            :style="filterStatus === 'achieved' ? 'background: #f8fafc; font-weight: 600; color: #0f172a;' : 'background: white; color: #64748b;'"
            style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;"
          >達成完了</button>
        </div>
        <button class="btn btn-primary" @click="openAddModal">
          <Plus :size="18" /> 新規スペック登録
        </button>
      </div>
    </div>

    <!-- JAS 0004 適合表示記号（壺マーク＋星）の凡例パネル (no-print) (v1.4.0 追加) (v1.9.6 淡色若竹オーガニックグリーン化) -->
    <div class="card mb-6 no-print" style="background: linear-gradient(135deg, #f3faf5 0%, #e7f5ec 100%); border: 1.5px solid #bbf7d0; padding: 1.25rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; border-bottom: 1.5px dashed #bbf7d0; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
        <img src="/tsubo.png" style="width: 24px; height: 28px; object-fit: contain; display: inline-block; vertical-align: middle;" />
        <div>
          <h4 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; font-weight: bold; color: #801c15; display: flex; align-items: center; gap: 0.25rem;">
            JAS 0004 有機料理適合表示記号（壺マーク・★星付き）の凡例
          </h4>
          <p style="font-size: 0.75rem; color: #5c3d2e; margin: 0; line-height: 1.45;">
            JAS 0004（有機料理を提供する飲食店等の管理方法）の基準に基づき、顧客に対して有機食材の配合割合を直感的に示すため、黒酢の「アマン壺（てっぺんに星の飾り付き）」をモチーフにした記号表示を行います。大きさ・形状・配色を統一し、割合区分に応じて壺の数を変えてメニューや看板に表示します。
            <strong style="color: #047857; display: block; margin-top: 2px;">※80%以上（壺3つ以上）で有機適合メニューとなります。</strong>
          </p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
        <div v-for="rule in [
          { ratio: '95% 以上 (壺 4個)', count: 4, bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: '最上位適合' },
          { ratio: '80% 以上 95% 未満 (壺 3個)', count: 3, bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', label: '有機適合' },
          { ratio: '50% 以上 80% 未満 (壺 2個)', count: 2, bg: '#fffbeb', border: '#fde68a', text: '#b45309', label: '一部適合' },
          { ratio: '50% 未満 (壺 1個)', count: 1, bg: '#fafaf9', border: '#e7e5e4', text: '#57534e', label: '一般区分' }
        ]" :key="rule.ratio" :style="{ background: rule.bg, borderColor: rule.border, color: rule.text }" style="padding: 0.65rem 0.85rem; border: 1.5px solid; border-radius: 8px; display: flex; flex-direction: column; gap: 0.5rem; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s;">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span style="font-size: 0.8rem; font-weight: bold;">{{ rule.ratio }}</span>
            <span :style="{ background: rule.text, color: 'white' }" style="font-size: 0.6rem; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: bold; letter-spacing: 0.05em;">{{ rule.label }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1.5px dashed rgba(0,0,0,0.04); padding-top: 0.5rem;">
            <span style="font-size: 0.7rem; font-weight: 500; color: #8c786c;">壺表示:</span>
            <div style="display: flex; gap: 3px;">
              <img 
                v-for="n in 4" 
                :key="n" 
                src="/tsubo.png" 
                alt="tsubo" 
                style="width: 22px; height: 26px; object-fit: contain; transition: opacity 0.2s;"
                :style="{ opacity: n <= rule.count ? 1 : 0.12 }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- メニューカードグリッド - 年度別グループ (no-print) (v1.9.0 フォルダアコーディオン化) -->
    <div class="menu-grid mb-6 no-print" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
        <div
          v-for="menu in filteredMenus"
          :key="menu.id"
          :class="['card', 'menu-card', menu.hasDiscrepancy ? 'card-discrepancy' : (menu.isValidOrganic ? 'card-organic-valid' : '')]"
        >
        <!-- 有機表示と適合性インジケータ -->
        <div class="menu-status-bar">
          <div class="badges-row">
            <span v-if="!menu.isOrganicClaim" class="badge badge-neutral">一般メニュー</span>
            
            <span v-if="menu.isValidOrganic" class="badge badge-success flex items-center gap-1">
              <Check :size="12" /> JAS適合 ({{ menu.organicRatio }}%)
            </span>
            <span v-if="isDeadlinePassed(menu.deadline)" class="badge" style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; display: inline-flex; align-items: center; gap: 4px;">
              <Check :size="12" /> 達成完了
            </span>
            <span v-if="isReviewDatePassed(menu.reviewDate)" class="badge" style="background-color: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; display: inline-flex; align-items: center; gap: 4px;">
              <AlertTriangle :size="12" /> 見直し期日超過
            </span>
          </div>
        </div>

        <div class="menu-details">
          <div v-if="menu.imageUrl" style="width: 100%; height: 160px; border-radius: 8px; overflow: hidden; margin-bottom: 0.75rem; background: #f8fafc;">
            <img :src="menu.imageUrl" alt="Menu Image" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          <div class="menu-title-row">
            <h3 class="menu-name">
              {{ menu.masterName || menu.name }}
              <span v-if="menu.versionName" style="font-size: 0.75rem; background: #e2e8f0; color: #475569; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: 0.5rem; vertical-align: middle;">
                {{ menu.versionName }}
              </span>
            </h3>
            <span class="menu-price">¥{{ (menu.price || 0).toLocaleString() }}</span>
          </div>
          <div class="menu-meta-pills mb-2">
            <span class="meta-pill" v-if="menu.masterName" style="background-color: #f1f5f9; color: #475569; border-color: #cbd5e1;"><FileText :size="10" /> {{ menu.masterName }}</span>
            <span class="meta-pill">{{ menu.category || '有機料理スペック' }}</span>
            <span class="meta-pill" v-if="menu.reviewDate">見直し日: {{ menu.reviewDate }}</span>
            <span class="meta-pill text-forest" v-if="menu.managerApproved">承認: {{ menu.managerApproved }}</span>
          </div>
          <p class="menu-desc">{{ menu.description || '説明文はありません。' }}</p>

          <!-- レシピサマリー -->
          <div class="recipe-summary-box mt-3">
            <div class="summary-label flex items-center justify-between">
              <span class="flex items-center gap-1"><Scale :size="14" /> 配合内訳 (水・塩除く {{ menu.totalWeight }}g)</span>
              <span class="font-mono text-xs font-bold text-forest">有機 {{ menu.organicRatio }}%</span>
            </div>
            <div class="recipe-tags">
              <div 
                v-for="item in menu.recipeDetails" 
                :key="item.ingredientId" 
                :class="['recipe-tag-item', item.type === 'organic' ? 'org' : (item.type === 'salt_water' ? 'salt' : 'gen')]"
              >
                <span>{{ item.name }}</span>
                <span class="weight">{{ item.amount }}g</span>
              </div>
            </div>
          </div>

          <!-- 壺のマークによる適合表示記号 (JAS 0004 準拠) (v1.4.0 追加) -->
          <div class="tsubo-display-box mt-3 p-2.5 rounded-lg border flex items-center justify-between" style="background: #faf8f5; border: 1px solid #ebdcd0; display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; border-radius: 8px; margin-top: 0.75rem; box-shadow: var(--shadow-xs);">
            <div class="flex flex-col gap-0.5" style="display: flex; flex-direction: column; gap: 2px;">
              <span class="text-sub font-bold text-xs" style="color: #801c15; font-size: 0.7rem; font-weight: bold; letter-spacing: 0.03em;">JAS 0004 有機料理適合表示記号</span>
              <span class="text-sub font-medium" style="color: #8c786c; font-size: 0.65rem;">壺の数: {{ getTsuboCount(menu.organicRatio) }}個 (有機食材 {{ getTsuboRangeText(menu.organicRatio) }})</span>
            </div>
            <div class="tsubo-icons-row flex gap-1" style="display: flex; gap: 0.25rem;">
              <img 
                v-for="n in 4" 
                :key="n" 
                src="/tsubo.png" 
                alt="tsubo" 
                style="width: 20px; height: 24px; object-fit: contain; transition: opacity 0.2s;"
                :style="{ opacity: n <= getTsuboCount(menu.organicRatio) ? 1 : 0.15 }"
              />
            </div>
          </div>

          <!-- 提供実績・年間推移（おもてなしUXアコーディオン） -->
          <div class="stats-toggle mt-3" @click.stop="toggleStats(menu.id)">
            <button class="btn btn-outline btn-xs flex items-center gap-1 w-full justify-center" style="border-color: var(--primary-light, #bbf7d0); background: #f0fdf4;">
              <TrendingUp :size="12" class="text-forest" />
              <span class="font-semibold text-forest">{{ expandedStats[menu.id] ? '提供実績・年間推移を閉じる' : '提供実績・年間推移を表示' }}</span>
            </button>
          </div>

          <div v-if="expandedStats[menu.id]" class="menu-stats-box mt-3 animate-fade-in">
            <div class="stats-header flex items-center justify-between mb-2">
              <span class="stats-title font-semibold text-xs text-sub">{{ currentYear }}年 提供実績 （合計: <strong class="text-forest font-bold text-sm">{{ getYearlyTotal(menu.id) }}食</strong>）</span>
              <div class="year-selector" @click.stop>
                <select v-model="currentYear" class="select-sm" style="font-size: 0.75rem; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid var(--border);">
                  <option :value="2026">2026年</option>
                  <option :value="2025">2025年</option>
                  <option :value="2024">2024年</option>
                </select>
              </div>
            </div>

            <!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->
            <div v-if="getYearlyTotal(menu.id) === 0" class="empty-stats-tip mt-2 p-2.5 text-center" style="background-color: #fffbeb; border: 1px dashed #f59e0b; border-radius: 6px;" @click.stop>
              <p class="text-xs text-amber-800 font-semibold mb-1">💡 現在、提供実績（調理記録）が登録されていません。</p>
              <p class="text-sub" style="font-size: 0.65rem; margin-bottom: 0.5rem; line-height: 1.3; color: #b45309;">調理・提供点検で毎日の提供数を入力するか、以下のボタンから確認用のシミュレーションデータを生成できます。</p>
              <button class="btn btn-warning btn-xs" style="font-size: 0.7rem; background-color: #f59e0b; border-color: #d97706; color: white; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background-color 0.2s;" @click="generateDemoData(menu.id)">
                🧪 過去12ヶ月分のデモ実績を自動生成する
              </button>
            </div>

            <!-- CSSベースの美しい縦棒グラフ -->
            <!-- 提供数ゼロの際のシミュレーション用おもてなしデモボタン -->
            <div v-if="getYearlyTotal(menu.id) === 0" class="empty-stats-tip mt-2 p-2.5 text-center" style="background-color: #fffbeb; border: 1px dashed #f59e0b; border-radius: 6px;" @click.stop>
              <p class="text-xs text-amber-800 font-semibold mb-1">💡 現在、提供実績（調理記録）が登録されていません。</p>
              <p class="text-sub" style="font-size: 0.65rem; margin-bottom: 0.5rem; line-height: 1.3; color: #b45309;">調理・提供点検で毎日の提供数を入力するか、以下のボタンから確認用のシミュレーションデータを生成できます。</p>
              <button class="btn btn-warning btn-xs" style="font-size: 0.7rem; background-color: #f59e0b; border-color: #d97706; color: white; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background-color 0.2s;" @click="generateDemoData(menu.id)">
                🧪 過去12ヶ月分のデモ実績を自動生成する
              </button>
            </div>

            <!-- CSSベースの美しい縦棒グラフ -->
            <div class="monthly-trend-chart mt-3">
              <div v-for="(count, idx) in getMonthlyServingData(menu.id)" :key="idx" class="chart-bar-col">
                <div class="chart-bar-wrapper">
                  <div 
                    class="chart-bar" 
                    :style="{ height: getBarHeight(count, getMonthlyServingData(menu.id)) }"
                    :class="{ 'has-value': count > 0 }"
                  >
                    <span class="bar-tooltip">{{ count }}食</span>
                  </div>
                </div>
                <span class="chart-month-label">{{ idx + 1 }}月</span>
              </div>
            </div>

            <!-- 月別提供数テーブル -->
            <table class="stats-mini-table mt-3">
              <thead>
                <tr>
                  <th v-for="m in 12" :key="m">{{ m }}月</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="(count, idx) in getMonthlyServingData(menu.id)" :key="idx" :class="{'has-val': count > 0}">
                    {{ count || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="menu-card-footer mt-4">
          <span class="id-badge font-mono">{{ menu.id }}</span>
          <div class="card-actions">
            <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;" @click="openEditModal(menu)">
              <Scale :size="14" /> 配合調整
            </button>
                        <button class="btn btn-outline btn-xs flex items-center gap-1" @click="openHistoryModal(menu)">
              <Calendar :size="14" /> 履歴
            </button>
            <button class="btn btn-outline btn-xs" @click="openEditModal(menu)">
              <Edit3 :size="14" /> 編集
            </button>
            <button class="btn btn-primary btn-xs flex items-center gap-1" @click="openSpecSheetModal(menu)">
              <FileText :size="14" /> JAS管理票
            </button>
              <button class="btn btn-danger btn-xs" @click="deleteMenu(menu.id, menu.name)" title="削除">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    
    <!-- 改訂履歴モーダル -->
    <Teleport to="body">
      <div v-if="showHistoryModal" class="modal-backdrop no-print">
        <div class="modal animate-fade-in-up" style="max-width: 800px; width: 95vw; max-height: 85vh; display: flex; flex-direction: column;">
          <div class="history-modal-header" style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to right, #f1f5f9, #e2e8f0); border-bottom: 1px solid #cbd5e1;">
            <h3 style="margin: 0; color: #334155; font-size: 1.25rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;"><Calendar :size="18" /> 「{{ historyMenuMasterName }}」の改訂履歴</h3>
            <button @click="showHistoryModal = false" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 4px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.05)'" onmouseout="this.style.backgroundColor='transparent'"><X :size="20" /></button>
          </div>
          <div class="modal-body p-6" style="overflow-y: auto; background: #f8fafc;">
            <div v-for="(vMenu, index) in historyVersions" :key="vMenu.id" class="history-card mb-4" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  <span v-if="vMenu.isActiveVersion" style="background: #10b981; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">最新版 (利用中)</span>
                  <span v-else style="background: #94a3b8; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">旧版 (アーカイブ)</span>
                  <h4 style="margin: 0; font-size: 1rem; color: #1e293b; font-weight: bold;">{{ vMenu.versionName || vMenu.masterName || vMenu.name || '名称未設定' }}</h4>
                  <span style="font-size: 0.75rem; color: #64748b;">(登録: {{ vMenu.targetCreatedDate || '不明' }})</span>
                </div>
                <div class="flex items-center gap-2">
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f8fafc; border-color: #cbd5e1; color: #334155;" @click="openEditModal(vMenu); showHistoryModal = false;">
                    <Edit3 :size="14" /> 編集
                  </button>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #fef2f2; border-color: #fecaca; color: #dc2626;" @click="deleteMenu(vMenu.id, vMenu.versionName || vMenu.name)">
                    <Trash2 :size="14" /> 削除
                  </button>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;" @click="openSpecSheetModal(vMenu)">
                    <FileText :size="14" /> 監査表表示
                  </button>
                </div>
              </div>
              <div style="font-size: 0.8rem; color: #475569; background: #f1f5f9; padding: 0.75rem; border-radius: 6px;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">📝 JAS変更内容・履歴:</div>
                <div style="margin-bottom: 0.5rem;">{{ vMenu.changeDetails || '記載なし' }}</div>
                
                <div style="font-weight: bold; margin-bottom: 0.25rem;">⚖️ レシピ配合 (有機率: {{ vMenu.organicRatio }}%):</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  <span v-for="item in vMenu.recipeDetails" :key="item.ingredientId" style="background: white; border: 1px solid #cbd5e1; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">
                    {{ item.name }} ({{ item.amount }}g)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 統合型・新規/編集モーダル (大画面配合デザイナーベース) (v1.3.1) -->
    <Teleport to="body">
      <div v-if="showRecipeModal" class="modal-backdrop no-print">
      <div class="modal modal-xlarge recipe-designer-modal animate-fade-in-up" style="max-width: 1200px; width: 95vw; max-height: 90vh;">
        <div class="modal-header" style="background: linear-gradient(135deg, #801c15 0%, #5c120d 100%); color: white; border-bottom: 2px solid #dcd1be;">
          <h3 class="flex items-center gap-2 text-white" style="color: white; margin: 0; font-size: 1.25rem;">
            <Sparkles :size="20" />
            <span>{{ isEditing ? '有機料理スペック・配合の調整' : '新規有機料理スペック登録' }}</span>
          </h3>
          <button class="btn-close text-white" @click="showRecipeModal = false" style="filter: brightness(0) invert(1); background: transparent; border: none; cursor: pointer; color: white;"><X :size="20" /></button>
        </div>

        <div class="modal-body p-6 recipe-designer-body" style="overflow: hidden; display: flex; gap: 1.5rem; height: calc(90vh - 120px);">
          <div class="designer-layout-grid" style="display: grid; grid-template-columns: 7fr 3fr; gap: 1.5rem; width: 100%; height: 100%;">
            
            <!-- 左側: フォームエリア (スクロール可能) -->
            <div class="designer-left-card" style="overflow-y: auto; padding-right: 1rem;">
              
              <!-- 既存レシピ参照複製バナー（新規登録時のみ表示） -->
              <div v-if="!isEditing" style="display: flex; align-items: center; gap: 0.75rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
                <span style="font-size: 0.8rem; font-weight: 600; color: #166534; white-space: nowrap;">📋 既存レシピを参照:</span>
                <select v-model="referenceMenuId" class="input-organic select-organic" style="flex: 1; font-size: 0.8rem; padding: 0.35rem 0.5rem;">
                  <option value="">— 参照するメニューを選択 —</option>
                  <option v-for="m in decodedMenus" :key="m.id" :value="m.id">
                    {{ m.name }}（{{ m.organicRatio }}%）
                  </option>
                </select>
                <button type="button" @click="applyReferenceMenu" :disabled="!referenceMenuId" class="btn btn-sm" style="white-space: nowrap; background: #166534; color: white; border: none; padding: 0.35rem 0.85rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; opacity: 1; transition: opacity 0.2s;" :style="{ opacity: referenceMenuId ? 1 : 0.4 }">
                  配合・作り方を複製
                </button>
              </div>

              <!-- 左側エリア内タブ選択 (v1.3.1) (v1.9.3 臙脂＆和風調和) -->
              <div class="form-tabs mb-4" style="display: flex; gap: 0.5rem; border-bottom: 2px solid #ebdcd0; margin-bottom: 1.5rem; background: #faf8f5; padding: 0.5rem 0.5rem 0 0.5rem; border-radius: 6px 6px 0 0;">
                <button :class="['tab-btn', activeFormTab === 'basic' ? 'active' : '']" @click="activeFormTab = 'basic'" :style="{ color: activeFormTab === 'basic' ? '#801c15' : '#64748b', borderBottomColor: activeFormTab === 'basic' ? '#801c15' : 'transparent' }" style="padding: 0.6rem 1.2rem; border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">基本情報</button>
                <button :class="['tab-btn', activeFormTab === 'recipe' ? 'active' : '']" @click="activeFormTab = 'recipe'" :style="{ color: activeFormTab === 'recipe' ? '#801c15' : '#64748b', borderBottomColor: activeFormTab === 'recipe' ? '#801c15' : 'transparent' }" style="padding: 0.6rem 1.2rem; border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">原材料配合</button>
                <button :class="['tab-btn', activeFormTab === 'jas' ? 'active' : '']" @click="activeFormTab = 'jas'" :style="{ color: activeFormTab === 'jas' ? '#801c15' : '#64748b', borderBottomColor: activeFormTab === 'jas' ? '#801c15' : 'transparent' }" style="padding: 0.6rem 1.2rem; border: none; background: transparent; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">JAS監査項目</button>
              </div>

              <!-- セクション1: 基本情報 -->
              <div v-if="activeFormTab === 'basic'" class="form-section mb-6 animate-fade-in">
                <h4 class="font-bold flex items-center gap-1 text-dark border-b pb-2 mb-4" style="font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;"><FileText :size="18" /> 基本情報</h4>
                
                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label class="required-field" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">料理名（JAS登録名称）</label>
                    <input type="text" v-model="form.name" class="input-organic" placeholder="例: 有機野菜のバーニャカウダ №1" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block; color: #1e40af;">共通メニュー名（集計グループ）</label>
                    <input type="text" v-model="form.masterName" class="input-organic" placeholder="例: 有機野菜のバーニャカウダ" style="background-color: #f8fafc; border-color: #bfdbfe;" />
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem; padding: 0.75rem; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block; color: #b45309;">バージョン管理グループ名（※履歴をまとめるためのキー）</label>
                  <p style="font-size: 0.7rem; color: #92400e; margin-bottom: 0.5rem; line-height: 1.3;">※この項目に同じ名前が入力されているメニュー同士は、強制的に「同じ料理の履歴（バージョン違い）」として一覧でまとめられます。空白の場合は料理名で判定されます。</p>
                  <input type="text" v-model="form.groupName" class="input-organic" placeholder="例: 有機野菜サラダ" style="background-color: #ffffff; border-color: #fcd34d;" />
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label class="required-field" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">提供価格 (税込)</label>
                    <div class="input-with-icon" style="position: relative;">
                      <span class="input-icon" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #64748b;">¥</span>
                      <input type="number" v-model.number="form.price" min="0" class="input-organic" style="padding-left: 1.75rem;" />
                    </div>
                  </div>
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label class="required-field" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">料理カテゴリ</label>
                    <input type="text" v-model="form.category" class="input-organic" placeholder="例: 有機料理スペック" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">前年からの変更内容・履歴</label>
                    <input type="text" v-model="form.changeDetails" class="input-organic" placeholder="例: 前年引継ぎ" />
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">説明文（料理・レシピの特徴など）</label>
                  <textarea v-model="form.description" rows="2" class="input-organic" placeholder="メニューの特徴やこだわりを入力してください"></textarea>
                </div>

                                              
<!-- 料理写真の登録 (v1.4.0 追加) ＆ AI自動生成 -->
                <div class="form-group mt-4" style="margin-top: 1rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; display: block; color: var(--primary);">📷 料理写真の登録 (JAS管理スペック表に印刷されます)</label>
                  <div style="display: flex; gap: 1rem; align-items: center; background: #faf8f5; padding: 1rem; border-radius: 8px; border: 1px solid #ebdcd0;">
                    <!-- アップロードボタン ＆ AI自動生成 -->
                    <div style="flex-grow: 1;">
                      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                        <input type="file" id="menu-image-upload" accept="image/*" class="hidden" @change="handleMenuImageUpload" style="display: none;" />
                        <label for="menu-image-upload" class="btn btn-outline btn-sm flex items-center gap-1 cursor-pointer" style="margin: 0; display: inline-flex; background: white;">
                          <Camera :size="16" /> 写真を選択・アップロード
                        </label>
                        
                        <button 
                          type="button" 
                          class="btn btn-sm flex items-center gap-1" 
                          style="margin: 0; display: inline-flex; background: #ecfdf5 !important; border: 1px solid #a7f3d0 !important; color: #047857 !important; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 6px;" 
                          @click="generateImageWithAi"
                          :disabled="isGeneratingImage"
                        >
                          <Sparkles :size="14" :class="isGeneratingImage ? 'animate-spin' : ''" style="color: #047857;" /> 
                          {{ isGeneratingImage ? 'AI画像生成中...' : 'AIで料理画像を自動生成' }}
                        </button>
                      </div>
                      <span class="text-xs text-sub block" style="font-size: 0.7rem; color: var(--text-light); display: block;">
                        ※登録した画像はJAS料理スペック管理票の右下「写真」欄に自動で配置されます。JPEG、PNG対応。
                      </span>
                    </div>
                    
                    <!-- プレビュー -->
                    <div v-if="form.imageUrl" style="position: relative; width: 80px; height: 80px; border-radius: 6px; border: 1px solid #cbd5e1; overflow: hidden; background: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                      <img :src="form.imageUrl" alt="Image Preview" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" @click="form.imageUrl = ''" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                    </div>
                    <div v-else style="width: 80px; height: 80px; border-radius: 6px; border: 2px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; color: #94a3b8; font-size: 0.65rem;">
                      <span>未登録</span>
                    </div>
                  </div>
                </div>
                <!-- AIスタイル参照用の見本画像 (Image-to-Image / スタイルガイド用) (v2.5.0 追加) -->
                <div class="form-group mt-4" style="border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
                  <label style="display: flex; align-items: center; gap: 0.25rem; font-weight: 600; color: #0f766e;">
                    <Sparkles :size="16" class="text-teal-600" />
                    <span>AIスタイル参照用の見本画像（サンプル写真）</span>
                  </label>
                  <div style="display: flex; gap: 1rem; align-items: center; background: #f0fdf4; padding: 1rem; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <!-- アクションボタン -->
                    <div style="flex-grow: 1;">
                      <input type="file" id="sample-image-upload" accept="image/*" class="hidden" @change="handleSampleImageUpload" style="display: none;" />
                      <label for="sample-image-upload" class="btn btn-outline btn-sm flex items-center gap-1 cursor-pointer" style="margin: 0; display: inline-flex; background: white; border-color: #cbd5e1; font-weight: 500;">
                        <Image :size="16" /> 見本写真を選択・アップロード
                      </label>
                      <span style="font-size: 0.7rem; color: #15803d; display: block; margin-top: 0.25rem;">
                        ※過去の料理写真や盛り付けのお手本画像をここにアップロードしておくと、AIがその「器の形・カメラ角度・盛り付けの雰囲気」を自動的に分析し、指定された食材だけで忠実に真似た綺麗な料理写真を再現生成します！
                      </span>
                    </div>
                    
                    <!-- 見本画像プレビュー -->
                    <div v-if="form.sampleImageUrl" style="position: relative; width: 80px; height: 80px; border-radius: 6px; border: 1px solid #cbd5e1; overflow: hidden; background: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                      <img :src="form.sampleImageUrl" alt="Sample Preview" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" @click="form.sampleImageUrl = ''" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                    </div>
                    <div v-else style="width: 80px; height: 80px; border-radius: 6px; border: 2px dashed #bbf7d0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0fdf4; color: #166534; font-size: 0.65rem;">
                      <span>見本なし</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- セクション2: レシピ構成 -->
              <div v-if="activeFormTab === 'recipe'" class="form-section mb-6 animate-fade-in">
                <div class="card-header flex items-center justify-between border-b pb-2 mb-4" style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                  <h4 class="font-bold flex items-center gap-1 text-dark" style="margin: 0; font-weight: 700; color: #1e293b;"><Scale :size="18" /> レシピ原材料配合 (1食あたり)</h4>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" @click.prevent="openAiRecipeModal" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-size: 0.85rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 4px; font-weight: bold;">
                      <Sparkles :size="14" /> AIで配合を自動生成
                    </button>
                    <button class="btn btn-primary btn-sm flex items-center gap-1" @click="addRecipeRow">
                      <Plus :size="16" /> 原材料を追加
                    </button>
                  </div>
                </div>

                <div class="designer-recipe-rows">
                  <div v-if="form.recipe.length === 0" class="empty-recipe-designer text-center py-6" style="text-align: center; padding: 2rem 0; background: #f8fafc; border-radius: 8px;">
                    <div class="text-gray-300 mb-2" style="color: #cbd5e1; display: flex; justify-content: center;"><Scale :size="32" /></div>
                    <p class="text-sub font-semibold" style="color: #64748b; font-size: 0.85rem;">原材料が登録されていません。</p>
                  </div>

                  <div v-for="(item, index) in form.recipe" :key="index" class="designer-recipe-row card p-3 mb-3" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; background: #f8fafc; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                    <div class="flex-1" style="flex: 2; min-width: 200px;">
                      <label style="font-size: 0.7rem; font-weight: bold; color: #64748b; margin-bottom: 0.25rem; display: block;">第 {{ index + 1 }} 原材料</label>
                      <select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <optgroup label="食材（一般・有機）">
                          <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                            {{ ing.name }} ({{ ing.type === 'organic' ? '有機JAS適合' : (ing.type === 'salt_water' ? '水塩(除外対象)' : '一般材料') }})
                          </option>
                        </optgroup>
                        <optgroup label="自家製（登録済みレシピ）">
                          <option v-for="m in menus" :key="m.id" :value="m.id">
                            {{ m.name }}
                          </option>
                        </optgroup>
                      </select>
                    </div>
                    
                    <div style="flex: 1; min-width: 120px;">
                      <label style="font-size: 0.7rem; font-weight: bold; color: #64748b; margin-bottom: 0.25rem; display: block;">重量</label>
                      <div class="weight-input-container" style="display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: white;">
                        <input type="number" v-model.number="item.amount" min="0" step="0.1" class="designer-weight-input" style="width: 100%; border: none; padding: 0.5rem; text-align: right;" />
                        <span style="background: #f1f5f9; padding: 0.5rem; border-left: 1px solid #cbd5e1; font-weight: bold; font-size: 0.8rem;">g</span>
                      </div>
                    </div>

                    <button class="btn-delete" @click="removeRecipeRow(index)" style="background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; padding: 0.5rem; border-radius: 6px; cursor: pointer; align-self: flex-end; margin-bottom: 2px;">
                      <Trash2 :size="16" />
                    </button>

                    <div class="w-full text-xs text-amber-600 mt-1 flex items-center gap-1" v-if="getIngredientType(item.ingredientId) === 'salt_water'" style="width: 100%; color: #d97706; font-size: 0.75rem;">
                      <Info :size="12" /> 水・食塩は、有機割合計算から自動除外されます。
                    </div>
                  </div>
                </div>
              </div>

              <!-- セクション3: JAS 0004 監査項目 -->
              <div v-if="activeFormTab === 'jas'" class="form-section animate-fade-in" style="margin-bottom: 1rem;">
                <h4 class="font-bold flex items-center gap-1 text-dark border-b pb-2 mb-4" style="font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;"><Award :size="18" /> JAS 0004 監査項目</h4>
                
                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">目標作成日</label>
                    <input type="date" v-model="form.targetCreatedDate" class="input-organic" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">開始予定日</label>
                    <input type="date" v-model="form.startDate" class="input-organic" />
                  </div>
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">内容見直し日</label>
                    <input type="date" v-model="form.reviewDate" class="input-organic" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">達成期限</label>
                    <input type="date" v-model="form.deadline" class="input-organic" />
                  </div>
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">作成者・格付担当者</label>
                    <input type="text" v-model="form.creatorApproved" class="input-organic" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">調理責任者承認</label>
                    <input type="text" v-model="form.managerApproved" class="input-organic" />
                  </div>
                </div>

                <div class="form-group mb-4" style="margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0;">具体的な調理方法（混同・汚染防止を含む詳細手順）</label>
                    <button type="button" @click.prevent="generateInstructionsOnlyWithAi" :disabled="isGeneratingInstructions" class="btn btn-sm" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-size: 0.75rem; padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 4px;">
                      <Sparkles :size="12" /> {{ isGeneratingInstructions ? '生成中...' : 'AIで手順を再生成' }}
                    </button>
                  </div>
                  <textarea v-model="form.cookingInstructions" rows="3" class="input-organic" @keydown.enter="handleCookingInstructionsKeydown" placeholder="改行すると自動で番号が振られます。"></textarea>
                </div>

                <div class="form-group mb-4" style="margin-bottom: 1rem;">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">変更内容（スペック更新時）</label>
                  <textarea v-model="form.changeDetails" rows="2" class="input-organic" placeholder="変更内容がある場合は入力してください。"></textarea>
                </div>

                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">備考欄（JAS監査上重要な管理事項）</label>
                  <textarea v-model="form.remarks" rows="2" class="input-organic" placeholder="備考を入力してください。"></textarea>
                </div>
              </div>
            </div>

            <!-- 右側: リアルタイム割合判定シミュレーター (固定表示) (v1.9.3 臙脂＆和風プレミアム化) -->
            <div class="designer-right-card" style="background: linear-gradient(135deg, #fdfbf7 0%, #faf5ea 100%); border: 1.5px solid #dcd1be; border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; height: fit-content; position: sticky; top: 0; box-shadow: var(--shadow-sm);">
              <h4 class="font-bold border-b pb-3 mb-4 flex items-center gap-1" style="color: #801c15; font-weight: 700; margin-bottom: 1rem; border-bottom: 1px solid #dcd1be; padding-bottom: 0.5rem;"><Sparkles :size="18" /> 有機JAS適合リアルタイム検証</h4>
              
              <div class="sim-metric-group card p-4 bg-white mb-4" style="background: white; border: 1.5px solid #e7dfd5; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: var(--shadow-xs);">
                <div class="flex justify-between items-center mb-2 border-b pb-2" style="display: flex; justify-content: space-between; border-bottom: 1px solid #fcfaf7; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                  <span class="text-sub font-semibold" style="color: #6e5c53; font-size: 0.8rem;">有機原材料総重量</span>
                  <span class="font-bold text-dark" style="font-size: 1.1rem; color: #801c15; font-family: monospace;">{{ simulationResult.organicWeight }} g</span>
                </div>
                <div class="flex justify-between items-center" style="display: flex; justify-content: space-between;">
                  <span class="text-sub font-semibold" style="color: #6e5c53; font-size: 0.8rem;">計算対象総重量 (水・塩除く)</span>
                  <span class="font-bold text-dark" style="font-size: 1.1rem; color: #5c3d2e; font-family: monospace;">{{ simulationResult.totalWeight }} g</span>
                </div>
              </div>

              <!-- 判定結果サマリーメーター -->
              <div :class="['designer-gauge card p-6 text-center mb-4', simulationResult.isValidOrganicMenu ? 'gauge-success' : 'gauge-danger']" :style="{ background: simulationResult.isValidOrganicMenu ? '#f0fdf4' : '#fef2f2', borderColor: simulationResult.isValidOrganicMenu ? '#bbf7d0' : '#fee2e2', color: simulationResult.isValidOrganicMenu ? '#15803d' : '#ef4444' }" style="border-radius: 10px; border: 1.5px solid; padding: 1.5rem; text-align: center; margin-bottom: 1rem; box-shadow: var(--shadow-xs);">
                <div class="gauge-ratio mb-1">
                  <span class="gauge-value" style="font-size: 3rem; font-weight: 800; font-family: monospace; line-height: 1;">{{ simulationResult.ratio }}</span> <span class="gauge-percent" style="font-size: 1.5rem; font-weight: bold;">%</span>
                </div>
                <div class="gauge-status font-bold flex items-center justify-center gap-2" style="font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
                  <Check v-if="simulationResult.isValidOrganicMenu" :size="20" />
                  <AlertTriangle v-else :size="20" />
                  {{ simulationResult.isValidOrganicMenu ? 'JAS 80% 適合基準をクリア' : '有機JAS不適合（80%未満）' }}
                </div>
              </div>

              <!-- プログレスゲージバー -->
              <div class="designer-progress-box mb-6" style="margin-bottom: 1.5rem;">
                <div class="designer-progress-track" style="height: 12px; background: #e2e8f0; border-radius: 9999px; position: relative; overflow: hidden;">
                  <div 
                    :class="['designer-progress-fill', simulationResult.isValidOrganicMenu ? 'valid' : 'invalid']"
                    :style="{ width: `${Math.min(simulationResult.ratio, 100)}%`, background: simulationResult.isValidOrganicMenu ? '#10b981' : '#ef4444' }"
                    style="height: 100%; border-radius: 9999px; transition: width 0.3s ease;"
                  ></div>
                  <div class="designer-target-line" style="position: absolute; top: 0; bottom: 0; width: 3px; background: #801c15; left: 80%;"></div>
                </div>
                <div class="flex justify-between text-xs text-sub font-semibold mt-1" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #8c786c; margin-top: 0.25rem; position: relative;">
                  <span>0%</span>
                  <span style="color: #801c15; font-weight: bold; position: absolute; left: 80%; transform: translateX(-50%);">基準(80%)</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer flex items-center justify-end gap-3 p-4 border-t no-print" style="background-color: #faf8f5; display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem; border-top: 1.5px solid #dcd1be;">
          <button class="btn btn-outline" @click="showRecipeModal = false" style="background: white; border-color: #cbd5e1; color: #475569;">キャンセル</button>
          <button class="btn btn-primary px-6 py-2.5 font-bold flex items-center gap-1" @click="saveMenu" style="background-color: #801c15; border-color: #6e1610; color: white;">
            <Check :size="18" /> {{ isEditing ? 'スペック・配合保存' : '新規スペック登録' }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- スペックプレビューモーダル (JAS 0004 帳票版) (v1.2.0 Teleport対応) (v1.4.0 帳票リニューアル) -->
    <Teleport to="body">
      <div v-if="showSpecSheet && selectedMenuForSpec" class="modal-backdrop">
      <div class="modal modal-spec animate-fade-in" style="max-width: 900px; width: 95vw; max-height: 95vh; display: flex; flex-direction: column;">
        <div class="modal-header no-print" style="background: linear-gradient(to right, #faf8f5, #f5f0e8); color: #5c3d2e; border-bottom: 1.5px solid #dcd1be; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <h3 class="flex items-center gap-2" style="color: #801c15 !important; margin: 0; font-size: 1.15rem; font-weight: bold; display: flex; align-items: center;">
            <FileText :size="20" style="color: #801c15;" /> 
            <span>JAS 0004 スペック管理票 (格付表示用)</span>
          </h3>
          <div class="flex items-center gap-3">
            <button class="btn btn-outline btn-xs flex items-center gap-1" style="color: #801c15 !important; border-color: #dcd1be !important; background: white !important; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 4px;" @click="handlePrint">
              <Printer :size="14" style="color: #801c15;" /> 帳票PDF出力
            </button>
            <button class="btn-close" style="color: #68645f !important; display: flex; align-items: center; justify-content: center;" @click="showSpecSheet = false"><X :size="20" /></button>
          </div>
        </div>
        <div class="modal-body print-area" style="flex-grow: 1; overflow-y: auto; padding: 1.5rem; background: #faf9f6;">
          
          <!-- A4サイズに収まる極上エクセル風JASスペック帳票デザイン -->
          
          <!-- モダンなダッシュボード風/マガジン風 JASスペック帳票デザイン -->
          
          <!-- モダンなダッシュボード風/マガジン風 JASスペック帳票デザイン (Vanilla CSS Fix) -->
          <div class="modern-spec-sheet" v-if="selectedMenuSpecData" style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; color: #333; padding: 10px;">
            
            <!-- 1. ヘッダーエリア -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #0d9488; padding-bottom: 8px;">
              <div>
                <span style="font-size: 0.7rem; font-weight: bold; color: #0f766e; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">JAS 0004 ORGANIC SPECIFICATION</span>
                <h1 style="font-size: 2rem; font-weight: 900; color: #111827; margin: 0; font-family: 'Hiragino Mincho ProN', serif; letter-spacing: -0.02em;">料理スペック</h1>
              </div>
              
              <div style="display: flex; gap: 12px;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #6b7280; margin-bottom: 4px;">調理責任者承認</span>
                  <div style="width: 56px; height: 56px; border: 1.5px solid #b91c1c; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b91c1c; transform: rotate(-3deg); font-family: serif;">
                    <span style="font-size: 0.55rem; border-bottom: 1px solid #b91c1c; width: 80%; text-align: center; padding-bottom: 1px;">厨房</span>
                    <span style="font-size: 0.5rem; font-family: monospace;">{{ selectedMenuSpecData.managerApprovalDateStamp }}</span>
                    <span style="font-size: 0.65rem; border-top: 1px solid #b91c1c; width: 80%; text-align: center; padding-top: 1px;">{{ (selectedMenuForSpec.managerApproved || '中村誠治').substring(0, 3) }}</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #6b7280; margin-bottom: 4px;">作成・格付担当</span>
                  <div style="width: 56px; height: 56px; border: 1.5px solid #b91c1c; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b91c1c; transform: rotate(2deg); font-family: serif;">
                    <span style="font-size: 0.55rem; border-bottom: 1px solid #b91c1c; width: 80%; text-align: center; padding-bottom: 1px;">厨房</span>
                    <span style="font-size: 0.5rem; font-family: monospace;">{{ selectedMenuSpecData.creatorDateStamp }}</span>
                    <span style="font-size: 0.65rem; border-top: 1px solid #b91c1c; width: 80%; text-align: center; padding-top: 1px;">{{ (selectedMenuForSpec.creatorApproved || '田中大輔').substring(0, 3) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. サマリー＆目標カード群 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 8px;">
              <!-- 基本情報カード -->
              <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280; font-weight: 600; margin-bottom: 8px;">
                  <span>{{ selectedMenuForSpec.category || '料理' }}</span>
                  <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">No.{{ selectedMenuForSpec.id }}</span>
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; line-height: 1.2;">{{ selectedMenuForSpec.name }}</h2>
                <div style="display: flex; gap: 4px;">
                  <img v-for="n in 4" :key="n" src="/tsubo.png" style="width: 16px; height: 16px; object-fit: contain;" :style="{ opacity: n <= getTsuboCount(selectedMenuForSpec.organicRatio) ? 1 : 0.2, filter: n <= getTsuboCount(selectedMenuForSpec.organicRatio) ? 'none' : 'grayscale(100%)' }" />
                </div>
              </div>

              <!-- スケジュールカード -->
              <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">目標作成日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuForSpec.targetCreatedDate || '未定' }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">開始予定日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuForSpec.startDate || '未定' }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">内容見直し日</span>
                    <span style="font-family: monospace; color: #374151;">{{ selectedMenuForSpec.reviewDate || '未定' }}</span>
                  </div>
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #6b7280; font-weight: bold; margin-bottom: 2px;">達成期限</span>
                    <span style="color: #374151; font-weight: 600;">{{ selectedMenuForSpec.deadline || '未定' }}</span>
                  </div>
                </div>
              </div>

              <!-- 目標・変更カード -->
              <div style="background: #f0fdfa; padding: 12px; border-radius: 8px; border: 1px solid #ccfbf1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div>
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">コース目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.85rem;">{{ selectedMenuForSpec.courseTargetNum || '年間3600食' }}</span>
                  </div>
                  <div style="text-align: right;">
                    <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 2px;">単品目標</span>
                    <span style="font-weight: bold; color: #134e4a; font-size: 0.85rem;">{{ selectedMenuForSpec.singleTargetNum || '年間60食' }}</span>
                  </div>
                </div>
                <div>
                  <span style="display: block; font-size: 0.65rem; color: #0f766e; font-weight: bold; margin-bottom: 4px;">変更内容</span>
                  <div style="font-size: 0.75rem; color: #134e4a; background: #ffffff; padding: 6px; border-radius: 4px; border: 1px solid #ccfbf1; font-weight: 500;">
                    {{ selectedMenuForSpec.changeDetails || '特になし' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. レシピ (2カラム) -->
            <div style="margin-bottom: 8px;">
              <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #0d9488; display: inline-block;"></span>
                原材料配合割合 (1食あたり)
              </h3>
              
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                <!-- 左カラム -->
                <div style="flex: 1; min-width: 0; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
                    <thead>
                      <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                        <th style="padding: 8px; font-weight: 600; text-align: center; width: 30px;">No</th>
                        <th style="padding: 8px; font-weight: 600;">原材料名</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">区分</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">重量</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">割合</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients.slice(0, Math.ceil(selectedMenuSpecData.ingredients.length / 2))" :key="idx" style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 8px; font-family: monospace; color: #6b7280; text-align: center;">{{ idx + 1 }}</td>
                        <td style="padding: 8px; font-weight: bold; color: #1f2937;">{{ item.name }}</td>
                        <td style="padding: 8px; text-align: center;">
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;" 
                                :style="{ background: item.organicType === 'organic' ? '#dcfce7' : (item.organicType === 'salt_water' ? '#dbeafe' : '#f3f4f6'), color: item.organicType === 'organic' ? '#166534' : (item.organicType === 'salt_water' ? '#1e40af' : '#4b5563') }">
                            {{ item.organicType === 'organic' ? '有機JAS' : (item.organicType === 'salt_water' ? '水/塩(除外)' : '一般') }}
                          </span>
                        </td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; color: #374151;">{{ item.amount }}g</td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;" :style="{ color: item.organicType === 'organic' ? '#15803d' : '#374151' }">{{ item.percentage }}%</td>
                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #15803d; font-family: monospace;">{{ item.symbol }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 右カラム -->
                <div style="flex: 1; min-width: 0; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem;">
                    <thead>
                      <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                        <th style="padding: 8px; font-weight: 600; text-align: center; width: 30px;">No</th>
                        <th style="padding: 8px; font-weight: 600;">原材料名</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">区分</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">重量</th>
                        <th style="padding: 8px; font-weight: 600; text-align: right;">割合</th>
                        <th style="padding: 8px; font-weight: 600; text-align: center;">JAS記号</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in selectedMenuSpecData.ingredients.slice(Math.ceil(selectedMenuSpecData.ingredients.length / 2))" :key="idx + Math.ceil(selectedMenuSpecData.ingredients.length / 2)" style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 8px; font-family: monospace; color: #6b7280; text-align: center;">{{ idx + 1 + Math.ceil(selectedMenuSpecData.ingredients.length / 2) }}</td>
                        <td style="padding: 8px; font-weight: bold; color: #1f2937;">{{ item.name }}</td>
                        <td style="padding: 8px; text-align: center;">
                          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: bold;" 
                                :style="{ background: item.organicType === 'organic' ? '#dcfce7' : (item.organicType === 'salt_water' ? '#dbeafe' : '#f3f4f6'), color: item.organicType === 'organic' ? '#166534' : (item.organicType === 'salt_water' ? '#1e40af' : '#4b5563') }">
                            {{ item.organicType === 'organic' ? '有機JAS' : (item.organicType === 'salt_water' ? '水/塩(除外)' : '一般') }}
                          </span>
                        </td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; color: #374151;">{{ item.amount }}g</td>
                        <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;" :style="{ color: item.organicType === 'organic' ? '#15803d' : '#374151' }">{{ item.percentage }}%</td>
                        <td style="padding: 8px; text-align: center; font-weight: bold; color: #15803d; font-family: monospace;">{{ item.symbol }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 合計フッター -->
              <div style="margin-top: 8px; display: flex; justify-content: flex-end; align-items: center; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem;">
                <span style="font-weight: bold; color: #1f2937; margin-right: 16px;">合計</span>
                <span style="font-family: monospace; font-weight: bold; color: #111827;">{{ selectedMenuSpecData.totalWeight }}g</span>
              </div>
              
              
            </div>

            <!-- 4. 有機サマリー・手順・写真 -->
            <div style="display: flex; gap: 12px; margin-bottom: 8px; align-items: flex-start;">
              
              <!-- 左: 作り方 -->
              <div style="flex: 2; min-width: 0;">
                <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #f97316; display: inline-block;"></span>
                  調理手順
                </h3>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div v-for="row in selectedMenuSpecData.instructionRows" :key="row.no" style="display: flex; gap: 12px; align-items: flex-start;">
                      <div style="flex-shrink: 0;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #ffedd5; color: #c2410c; font-size: 0.65rem; font-weight: bold;">{{ row.no }}</span>
                      </div>
                      <p style="margin: 0; font-size: 0.75rem; color: #374151; line-height: 1.6; font-weight: 500; white-space: pre-wrap; padding-top: 2px;">{{ row.text }}</p>
                    </div>
                  </div>
                                </div>
                
                <!-- 備考 (移動先) -->
                <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 12px 0 8px 0; display: flex; align-items: center; gap: 8px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #eab308; display: inline-block;"></span>
                  備考
                </h3>
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 0.75rem; color: #92400e; min-height: 60px;">
                  <div style="white-space: pre-wrap; line-height: 1.5;">{{ selectedMenuForSpec.remarks || '' }}</div>
                </div>
              </div>

              <!-- 右: 有機サマリー＆写真 -->
                  <!-- 右: 有機サマリー＆写真 -->
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px;">
                
                <!-- 有機・非有機サマリー -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
                    有機JAS 適合集計
                  </h3>
                  
                  <!-- 有機カード -->
                  <div style="background: #15803d; border-radius: 12px; padding: 16px; color: white; position: relative;">
                    <span style="color: #bbf7d0; font-size: 0.65rem; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 4px; display: block;">ORGANIC RATIO</span>
                    <div style="display: flex; align-items: baseline; justify-content: space-between;">
                      <span style="font-size: 2rem; font-weight: 900; letter-spacing: -0.05em; line-height: 1;">{{ selectedMenuSpecData.organicRatio }}<span style="font-size: 1.25rem; margin-left: 4px;">%</span></span>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                      <span style="color: #bbf7d0;">有機重量合計</span>
                      <span style="font-family: monospace; font-size: 1rem; font-weight: bold;">{{ selectedMenuSpecData.organicWeight }}g</span>
                    </div>
                  </div>

                  <!-- 非有機カード -->
                  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: center;">
                    <span style="color: #6b7280; font-size: 0.65rem; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 4px; display: block;">NON-ORGANIC RATIO</span>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                      <span style="color: #1f2937; font-weight: bold; font-size: 1.25rem; line-height: 1;">{{ selectedMenuSpecData.generalRatio }}%</span>
                      <span style="font-family: monospace; color: #4b5563; font-size: 0.85rem; font-weight: 600;">{{ selectedMenuSpecData.generalWeight }}g</span>
                    </div>
                    <!-- プログレスバー風 -->
                    <div style="width: 100%; background: #f3f4f6; border-radius: 4px; height: 8px; margin-top: 4px; overflow: hidden;">
                      <div style="background: #22c55e; height: 100%; border-radius: 4px;" :style="{ width: `${Math.min(selectedMenuSpecData.organicRatio, 100)}%` }"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: #9ca3af; margin-top: 4px; font-weight: bold;">
                      <span>0%</span>
                      <span>基準 80%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <!-- 写真 -->
                <div>
                  <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>
                    完成写真
                  </h3>
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; height: 240px; display: flex; align-items: center; justify-content: center;">
                    <img v-if="selectedMenuForSpec.imageUrl" :src="selectedMenuForSpec.imageUrl" style="width: 100%; height: 100%; object-fit: contain;" />
                    <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af;">
                      <Camera :size="24" style="margin-bottom: 4px; opacity: 0.5;" />
                      <span style="font-size: 0.65rem; font-weight: bold;">[画像未登録]</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <!-- 5. JAS規格フッター -->
            <div>
              <h3 style="font-size: 0.9rem; font-weight: bold; color: #1f2937; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #6366f1; display: inline-block;"></span>
                有機JAS格付・適合及び表示基準
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #3730a3;">格付表示対象の有無</span>
                  <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 2px 8px; border-radius: 12px; border: 1px solid #e0e7ff;">
                    <span style="width: 6px; height: 6px; border-radius: 50%;" :style="{ background: selectedMenuForSpec.isValidOrganic ? '#22c55e' : '#ef4444' }"></span>
                    <span style="font-size: 0.75rem; font-weight: bold; color: #1f2937;">Yes</span>
                  </div>
                </div>
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.65rem; font-weight: bold; color: #3730a3;">記号による表示</span>
                  <span style="font-size: 0.75rem; font-weight: bold; color: #1f2937;">{{ selectedMenuForSpec.displayStyle || '記号により表示' }}</span>
                </div>
                <div style="background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center;">
                  <span style="font-size: 0.6rem; font-weight: bold; color: #3730a3; margin-bottom: 2px;">適合の表示内容</span>
                  <span style="font-size: 0.7rem; font-weight: bold; color: #1f2937;">期間: {{ selectedMenuForSpec.displayPeriod || '通年' }} / 方法: {{ selectedMenuForSpec.displayMethod || 'メニュー掲載' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>


        <div class="modal-footer no-print" style="background-color: #f9fafb; display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #cbd5e1;">
          <button class="btn btn-outline" @click="showSpecSheet = false">閉じる</button>
                    <button class="btn btn-primary flex items-center gap-1" @click="handlePrint" style="background-color: #166534; border-color: #15803d; color: white; font-weight: bold; padding: 0.5rem 1.5rem;">
            <Printer :size="16" /> この帳票を印刷 (PDF出力)
          </button>
        </div>
      </div>
    </div>
    </Teleport>

  


  <!-- AIレシピ自動生成モーダル -->
  <Teleport to="body">
    <div v-if="showAiRecipeModal" class="modal-backdrop animate-fade-in" @click.self="showAiRecipeModal = false" style="z-index: 100000;">
      <div class="modal animate-slide-up" style="max-width: 500px; padding: 2rem; border-radius: 12px; background: white; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); z-index: 100001;">
        <div class="modal-header flex items-center justify-between mb-4">
          <h3 class="font-bold flex items-center gap-2" style="font-size: 1.25rem; color: #1e293b;">
            <Sparkles :size="24" style="color: #a855f7;" /> AIレシピ自動生成
          </h3>
          <button type="button" class="icon-btn text-sub" @click="showAiRecipeModal = false"><X :size="24" /></button>
        </div>
        
        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5;">
          指定した期間（前後10日間）の納品実績から食材を抽出し、有機JAS品の構成比を最大化するレシピをAIが自動考案します。
        </p>

        <div class="form-group mb-4">
          <label class="form-label font-bold text-dark">対象期間 (開始 - 終了)</label>
          <div class="flex gap-2">
            <input v-model="aiRecipeConfig.startDate" type="date" class="input-organic" />
            <span style="display: flex; align-items: center;">〜</span>
            <input v-model="aiRecipeConfig.endDate" type="date" class="input-organic" />
          </div>
        </div>
        
        <div v-if="!currentId" class="form-group mb-4">
          <label class="form-label font-bold text-dark">1食あたりの目標総重量 (g)</label>
          <input v-model.number="aiRecipeConfig.targetGrams" type="number" class="input-organic" placeholder="200" />
        </div>

        <div v-if="aiRecipeError" class="alert alert-danger mb-4" style="background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;">
          <AlertTriangle :size="16" style="display: inline; margin-top: -2px;" /> {{ aiRecipeError }}
        </div>

        <div class="modal-actions flex gap-2 justify-end mt-6">
          <button type="button" class="btn btn-outline" @click="showAiRecipeModal = false" :disabled="isGeneratingAiRecipe">キャンセル</button>
          <button type="button" class="btn" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; border: none; font-weight: bold;" @click.prevent="generateRecipeWithAi" :disabled="isGeneratingAiRecipe">
            <span v-if="isGeneratingAiRecipe" class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-right: 8px;"></span>
            {{ isGeneratingAiRecipe ? '生成中...' : '自動生成を実行' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<style scoped>
/* ============================================================================
   共通モーダル基本スタイル (画面全体へのオーバーレイと中央配置) (v1.2.0)
   ============================================================================ */
.modal-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(15, 23, 42, 0.6) !important; /* ガラスモーフィズム用の深みのあるダークオーバーレイ */
  backdrop-filter: blur(5px) !important; /* 背景を美しくぼかす */
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 1000 !important; /* ヘッダーやサイドバーの上に確実に浮かび上がらせる */
  animation: fadeIn 0.25s ease-out !important;
}

.modal {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08) !important;
  width: 90vw !important;
  max-width: 800px !important; /* 通常モーダルの上限幅 */
  max-height: 85vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}



.btn-close {
  background: transparent !important;
  border: none !important;
  color: #64748b !important;
  cursor: pointer !important;
  padding: 0.25rem !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
}

.btn-close:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

.modal-body {
  padding: 1.5rem !important;
  overflow-y: auto !important;
  flex: 1 !important;
}

.modal-footer {
  padding: 1rem 1.5rem !important;
  border-top: 1px solid #f1f5f9 !important;
  background: #f8fafc !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 0.75rem !important;
}

/* タブボタンのスタイリング */
.form-tabs {
  display: flex !important;
  gap: 0.5rem !important;
  border-bottom: 2px solid #e2e8f0 !important;
  padding: 0 1.5rem !important;
  background: #f8fafc !important;
}

.tab-btn {
  padding: 0.85rem 1rem !important;
  background: transparent !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  margin-bottom: -2px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}

.tab-btn:hover {
  color: #0f766e !important;
}

.tab-btn.active {
  color: #0f766e !important;
  border-bottom-color: #0f766e !important;
}

/* アニメーション定義 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ============================================================================
   配合デザイナー専用の大画面UI (v1.1.0 UXアップデート)
   ============================================================================ */
.modal-xlarge {
  width: 95vw !important;
  max-width: 1200px !important;
  height: 90vh !important;
  max-height: 850px !important;
  display: flex;
  flex-direction: column;
}

.recipe-designer-modal {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
}

.recipe-designer-body {
  flex: 1;
  overflow-y: auto !important;
  min-height: 0;
  max-height: calc(90vh - 120px) !important;
}

.designer-layout-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 1.5rem;
  height: 100%;
}

@media (max-width: 950px) {
  .designer-layout-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.designer-left-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.designer-recipe-rows {
  flex: 1;
  overflow-y: auto;
  max-height: 520px;
  padding-right: 0.5rem;
}

/* 印刷用メディアクエリはこの直後の <style>（非scoped）ブロックへ移動しました。
   scoped <style> 内では html / body / #app などのグローバル要素を指定できないため。 */

.designer-recipe-row {
  transition: all 0.2s ease;
}

.designer-recipe-row:hover {
  border-color: #0f766e !important;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.04);
}



.designer-weight-input:focus {
  outline: none !important;
  border: none !important;
}

.btn-delete-designer {
  transition: all 0.2s;
}

.btn-delete-designer:hover {
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
  color: #ef4444 !important;
  transform: scale(1.05);
}

/* 右側：シミュレーターカード内のプログレスカラー */
.designer-progress-fill.valid {
  background: linear-gradient(90deg, #10b981, #059669) !important;
}

.designer-progress-fill.invalid {
  background: linear-gradient(90deg, #f87171, #ef4444) !important;
}

.designer-gauge.gauge-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.designer-gauge.gauge-danger {
  background: #fff5f5;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.designer-target-line {
  top: 0;
  bottom: 0;
  width: 3px;
  background: #0f766e;
  box-shadow: 0 0 4px rgba(15, 118, 110, 0.4);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--primary);
  font-weight: 800;
}

/* メニューカードグリッド */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
}

.menu-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-top: 4px solid var(--border);
  padding: 1.25rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.menu-card.card-organic-valid {
  border-top-color: var(--primary);
}

.menu-card.card-discrepancy {
  border-top-color: var(--danger);
  background-color: rgba(220, 38, 38, 0.01);
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.05);
}

.menu-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.badges-row {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.discrepancy-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.menu-details {
  flex-grow: 1;
}

.menu-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.menu-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.menu-price {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-sans);
}

.menu-meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.meta-pill {
  font-size: 0.7rem;
  background-color: var(--bg-sub);
  color: var(--text-sub);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.menu-desc {
  font-size: 0.85rem;
  color: var(--text-sub);
  margin: 0 0 1rem;
  line-height: 1.5;
}

/* レシピサマリーボックス */
.recipe-summary-box {
  background-color: var(--bg-sub);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 0.5rem;
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.recipe-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.recipe-tag-item.org {
  background-color: var(--success-bg);
  color: #14532d;
  border-color: var(--success-border);
}

.recipe-tag-item.gen {
  background-color: #f5f5f4;
  color: #44403c;
  border-color: #e7e5e4;
}

.recipe-tag-item.salt {
  background-color: #fffbeb;
  color: #78350f;
  border-color: #fef3c7;
}

.recipe-tag-item .weight {
  font-family: var(--font-mono);
  font-weight: 600;
  opacity: 0.8;
}

.menu-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed var(--border);
  padding-top: 0.75rem;
}

.id-badge {
  font-size: 0.7rem;
  background-color: var(--bg-sub);
  color: var(--text-sub);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.card-actions {
  display: flex;
  gap: 0.375rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
}

/* フォームタブ */
.form-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  background-color: var(--bg-sub);
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--primary);
  border-radius: 3px 3px 0 0;
}

/* モーダル拡張 */
.modal-large {
  max-width: 950px;
}

.modal-spec {
  max-width: 1000px;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 1.5rem;
}

.grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.grid-3-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .grid-layout, .grid-2-col, .grid-3-col {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.tab-pane-content {
  padding: 1rem 0;
}

.recipe-pane {
  display: flex;
  flex-direction: column;
}

.simulator-pane {
  display: flex;
  flex-direction: column;
}

/* レシピエディタ */
.recipe-rows-container {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  padding: 0.75rem;
  max-height: 290px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed var(--border);
}

.recipe-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.select-recipe-ing {
  flex-grow: 1;
  min-width: 150px;
}

.weight-input-box {
  position: relative;
  width: 90px;
  flex-shrink: 0;
}

.weight-input-box input {
  padding-right: 1.5rem;
}

.unit-g {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--text-light);
}

.btn-delete-row {
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  border-radius: 4px;
  transition: var(--transition);
  display: flex;
  align-items: center;
}

.btn-delete-row:hover {
  background-color: var(--danger-bg);
}

.salt-water-tip {
  width: 100%;
  color: var(--warning);
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: -0.25rem;
  padding-left: 0.25rem;
}

.empty-recipe {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 0.85rem;
}

/* シミュレーターボード */
.simulator-panel {
  background: linear-gradient(135deg, #fdfbf7 0%, #f6f3eb 100%);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.simulator-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: var(--primary);
  font-weight: 700;
}

.simulator-details {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.sim-metric {
  display: flex;
  flex-direction: column;
}

.sim-label {
  font-size: 0.7rem;
  color: var(--text-sub);
}

.sim-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
  font-family: var(--font-mono);
}

.sim-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-sub);
}

/* プログレスバー */
.ratio-progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ratio-progress-bar {
  position: relative;
  height: 10px;
  background-color: #e5e5e0;
  border-radius: var(--radius-full);
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill.valid {
  background-color: var(--success);
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.3);
}

.progress-fill.invalid {
  background-color: var(--accent);
}

.target-marker {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 3px;
  background-color: var(--danger);
  z-index: 10;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-light);
  font-family: var(--font-mono);
  position: relative;
}

.target-label {
  position: absolute;
  color: var(--danger);
  font-weight: 700;
  transform: translateX(-50%);
}

/* 適合ボックス */
.sim-result-box {
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  border: 1px solid transparent;
}

.sim-result-box.result-success {
  background-color: var(--success-bg);
  border-color: var(--success-border);
  color: #14532d;
}

.sim-result-box.result-danger {
  background-color: var(--danger-bg);
  border-color: var(--danger-border);
  color: #7f1d1d;
}

.result-percentage {
  font-size: 0.95rem;
  font-weight: 500;
}

.percent-val {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: var(--font-mono);
}

.result-status {
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 0.125rem;
}

.icon-result {
  flex-shrink: 0;
}

.claim-discrepancy-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  color: var(--danger);
  font-weight: 600;
  border-top: 1px dashed var(--danger-border);
  padding-top: 0.5rem;
}

/* ----------------------------------------------------------------------------
 * エクセル風有機料理スペック帳票 (A4縦想定・印刷対応)
 * ---------------------------------------------------------------------------- */
.modern-spec-sheet {
  background-color: #ffffff;
  color: #000000;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif;
  border: 2px solid #000000;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  position: relative;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 帳票内のすべてのテーブル・枠線調整 */
.modern-spec-sheet table {
  border: 1.5px solid #000000 !important;
  border-collapse: collapse !important;
  width: 100%;
}

.modern-spec-sheet th,
.modern-spec-sheet td {
  border: 1px solid #000000 !important;
  padding: 0.35rem 0.5rem;
  color: #000000 !important;
  vertical-align: middle;
}

/* ヘッダーセルの和風プレミアム薄黄色 background */
.modern-spec-sheet th {
  background-color: #fffcf0 !important;
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "MS Gothic", sans-serif;
  font-weight: bold;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* 承認印 */
.stamp-circle {
  transition: transform 0.2s ease;
  background-color: rgba(220, 38, 38, 0.02);
  box-shadow: inset 0 0 1px rgba(220, 38, 38, 0.08);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.stamp-circle:hover {
  transform: scale(1.05) rotate(0deg) !important;
}

/* 壺のスタイル */
.tsubo-row svg {
  filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.15));
}

/* 写真枠のスタイル */
.photo-box {
  border: 1.5px solid #000000 !important;
  border-radius: 0px !important;
}

.photo-title {
  background-color: #fffcf0 !important;
  border-bottom: 1.5px solid #000000 !important;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* 適合 Yes 丸囲みの SVG ellipse 手書き風アニメーション */
.compliance-table svg ellipse {
  stroke-dasharray: 200;
  stroke-dashoffset: 0;
  animation: drawComplianceCircle 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes drawComplianceCircle {
  from {
    stroke-dashoffset: 200;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* 重複していた古い印刷用メディアクエリを完全に削除し、中盤の極限タイト版に一本化 */

.w-5 { width: 5%; }
.w-12 { width: 12%; }
.w-13 { width: 13%; }
.w-15 { width: 15%; }
.w-20 { width: 20%; }
.w-25 { width: 25%; }
.w-35 { width: 35%; }
.w-40 { width: 40%; }
.w-45 { width: 45%; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.pre-wrap { white-space: pre-wrap; }
.text-muted { color: #9ca3af; }
.text-danger-text { color: #b91c1c; }

/* --- 月別提供数・年間推移グラフおよび集計表スタイル --- */
.menu-stats-box {
  background-color: #f8fafc;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-sm, 6px);
  padding: 0.75rem 0.85rem;
}

.stats-header {
  font-size: 0.8rem;
}

/* CSSのみで作成する美しいレスポンシブ縦棒グラフ */
.monthly-trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 80px;
  background: #ffffff;
  border-left: 1.5px solid var(--border, #cbd5e1);
  border-bottom: 1.5px solid var(--border, #cbd5e1);
  padding: 0.5rem 0.4rem 0;
  border-radius: 2px;
}

.chart-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.chart-bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.chart-bar {
  width: 50%;
  max-width: 15px;
  background: linear-gradient(to top, #16a34a, #4ade80);
  border-radius: 3px 3px 0 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.chart-bar:hover {
  background: linear-gradient(to top, #15803d, #22c55e);
  transform: scaleX(1.1);
}

.chart-bar.has-value {
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.25);
}

.bar-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1e293b;
  color: #ffffff;
  font-size: 0.65rem;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  white-space: nowrap;
  font-family: monospace;
  z-index: 10;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.chart-month-label {
  font-size: 0.6rem;
  color: var(--text-sub, #64748b);
  margin-top: 0.2rem;
  font-weight: 600;
}

.stats-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.725rem;
}

.stats-mini-table th, .stats-mini-table td {
  border: 1px solid var(--border, #e2e8f0);
  text-align: center;
  padding: 0.25rem 0.1rem;
}

.stats-mini-table th {
  background-color: var(--bg-sub, #f1f5f9);
  color: var(--text-sub, #475569);
  font-weight: 600;
}

.stats-mini-table td {
  background-color: #ffffff;
  color: var(--text-sub, #94a3b8);
  font-family: monospace;
}

.stats-mini-table td.has-val {
  color: var(--text-main, #1e293b);
  font-weight: 700;
  background-color: #f0fdf4;
}

.spec-stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
}

.spec-stats-table th, .spec-stats-table td {
  border: 1px solid #cbd5e1;
  padding: 0.4rem;
}
</style>

<!-- ============================================================================
     印刷用スタイル（非scoped）
     scoped <style> では html / body / #app などのグローバル要素を指定できないため、
     印刷時のレイアウトリセットはこのブロックで一括定義する。
     - スペック帳票モーダルは <Teleport to="body"> で body 直下に配置されている
     - したがって #app を display:none にすればサイドバー・ヘッダー等が
       レイアウト計算からも完全に消え、空白ページが生まれない
============================================================================ -->
<style>
/* ============================================================
   A4 ネイティブ印刷設計
   @page margin: 0 にして、body の padding でマージンを管理する。
   これにより body の内側 = 印刷コンテンツ領域 (194mm) が確定し
   width:100% の子要素がはみ出しなく A4 に収まる。
   zoom ハックは一切使わない。
   ============================================================ */
@page {
  size: A4 portrait;
  margin: 0; /* Chrome の @page margin による clip を回避。余白は body で管理 */
}

@media print {
  html {
    width: 210mm !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* body の padding が印刷マージンを担う。
     box-sizing: border-box なので内寸 = 210 - 16 = 194mm が確定する */
  body {
    width: 210mm !important;
    height: auto !important;
    margin: 0 !important;
    padding: 10mm 8mm !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    overflow-x: hidden !important;
    overflow-y: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* #app を丸ごと非表示 */
  body > #app { display: none !important; }

  /* Teleport された modal-backdrop の flex centering を解除 */
  body > .modal-backdrop {
    position: static !important;
    display: block !important;
    align-items: unset !important;
    justify-content: unset !important;
    background: #ffffff !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    animation: none !important;
    z-index: auto !important;
  }

  /* モーダル本体の width:90% / max-width:900px / max-height:90vh を解除 */
  body > .modal-backdrop > .modal,
  body > .modal-backdrop > .modal-spec {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
    animation: none !important;
  }

  /* 帳票コンテンツ領域（modal-body） */
  .print-area {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    border: none !important;
    flex: none !important;
    flex-grow: 0 !important;
  }

  /* 印刷除外要素を完全非表示 */
  .no-print {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }

  /* スペック帳票本体
     body 内寸 194mm に対して width:100% で自然にフィットする。
     zoom ハックは不要 */
  .modern-spec-sheet {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 3mm !important;
    border: 1.5px solid #000000 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .modern-spec-sheet th {
    background-color: #fffcf0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .modern-spec-sheet td {
    background-color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .summary-total-row {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .approval-stamps-table td {
    height: 54px !important;
    padding: 0.15rem !important;
  }
  .stamp-circle {
    width: 44px !important;
    height: 44px !important;
    background-color: transparent !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .stamp-circle span.stamp-dept { font-size: 0.45rem !important; padding-bottom: 0px !important; }
  .stamp-circle span.stamp-date { font-size: 0.4rem !important; scale: 0.8 !important; }
  .stamp-circle span.stamp-name-jp { font-size: 0.55rem !important; padding-top: 0px !important; }

  .sheet-header-blocks { gap: 0.5rem !important; padding-bottom: 0.35rem !important; }
  .basic-info-blocks { margin-top: 0.25rem !important; gap: 0.5rem !important; }
  .tsubo-row { margin-top: 0.15rem !important; }

  .twin-recipe-tables-container { margin-top: 0.15rem !important; gap: 0.5rem !important; }
  .twin-recipe-tables-container td,
  .twin-recipe-tables-container th {
    padding: 0.1rem 0.3rem !important;
    height: 18px !important;
  }

  .summary-aggregate-row { margin-top: 0.25rem !important; }
  .bottom-blocks-container { margin-top: 0.25rem !important; gap: 0.5rem !important; }

  .instructions-rows-table td,
  .instructions-rows-table th {
    padding: 0.15rem 0.4rem !important;
    height: 26px !important;
  }

  .photo-body { height: 110px !important; }
  .legend-mini-table tr { height: 14px !important; }
  .footer-compliance-box { margin-top: 0.25rem !important; }
  .compliance-table tr { height: auto !important; }
  .compliance-table th, .compliance-table td {
    padding: 0.05rem 0.2rem !important;
    font-size: 0.7rem !important;
  }
}
</style>
