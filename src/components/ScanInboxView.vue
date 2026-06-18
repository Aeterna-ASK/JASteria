<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  Inbox, FileText, CheckCircle2, Search, Calendar, Package, Trash2, 
  ShieldCheck, Mail, Bot, Layers, FileDown, AlertTriangle, ArrowRightLeft
} from 'lucide-vue-next';

const state = restaurantStore.state;

// 選択されたドキュメントID
const selectedDocId = ref(null);
const selectedDoc = computed(() => {
  if (!selectedDocId.value) return null;
  return inboxDocs.value.find(d => d.id === selectedDocId.value) || null;
});

const previewBlobUrl = ref('');

// 安全にBase64データをBlob URLに変換する共通ヘルパー
const convertToBlobUrlIfNeeded = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:')) {
    try {
      const parts = fileUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Blob URLの変換に失敗しました:', e);
      return fileUrl;
    }
  }
  return fileUrl;
};

// 選択されたドキュメントのBlob URL自動監視
watch(selectedDoc, (newDoc) => {
  // 古いBlob URLがあれば解放してメモリリークを防ぐ
  if (previewBlobUrl.value && previewBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
  
  if (newDoc && newDoc.fileUrl) {
    previewBlobUrl.value = convertToBlobUrlIfNeeded(newDoc.fileUrl);
  } else {
    previewBlobUrl.value = '';
  }
}, { immediate: true });

// コンポーネント破棄時にBlob URLを解放
onUnmounted(() => {
  if (previewBlobUrl.value && previewBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
});

// PDF結合（複数選択モード）
const isMultiSelectMode = ref(false);
const selectedForMergeIds = ref([]);
const isMerging = ref(false);

// AI解析ステータス
const isAnalyzing = ref(false);
const analysisError = ref('');

// APIキーの取得と検証 (デモ回避・設定エラー強制化)
const geminiApiKey = computed(() => {
  const key = state.restaurantInfo?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  return key.trim();
});

const isApiKeyConfigured = computed(() => {
  const key = geminiApiKey.value;
  return key && key.length > 10 && !key.includes('入力') && !key.includes('API_KEY');
});

const toggleMultiSelectMode = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value;
  selectedForMergeIds.value = [];
};

const toggleDocForMerge = (docId) => {
  const idx = selectedForMergeIds.value.indexOf(docId);
  if (idx === -1) {
    selectedForMergeIds.value.push(docId);
  } else {
    selectedForMergeIds.value.splice(idx, 1);
  }
};

const handleCardClick = (doc) => {
  if (isMultiSelectMode.value) {
    toggleDocForMerge(doc.id);
  } else {
    handleSelect(doc);
  }
};

const dataUrlToBytes = (dataUrl) => {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = e => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

// PDF結合アクション
const mergeSelectedToPDF = async () => {
  const docsToMerge = inboxDocs.value.filter(d => selectedForMergeIds.value.includes(d.id));
  if (docsToMerge.length < 2) {
    alert('2件以上のスキャンを選択してください');
    return;
  }

  isMerging.value = true;
  try {
    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (const doc of docsToMerge) {
      const fileUrl = doc.fileUrl;
      const isPdf = (fileUrl && fileUrl.startsWith('data:application/pdf')) ||
                    (doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf'));

      if (isPdf) {
        const pdfBytes = dataUrlToBytes(fileUrl);
        const existingPdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } else {
        const page = mergedPdf.addPage([595.28, 841.89]);
        const imageBytes = fileUrl.startsWith('data:')
          ? dataUrlToBytes(fileUrl)
          : new Uint8Array(await (await fetch(fileUrl)).arrayBuffer());

        let image;
        if ((fileUrl.includes('data:image/png')) || doc.fileName?.toLowerCase().endsWith('.png')) {
          image = await mergedPdf.embedPng(imageBytes);
        } else {
          image = await mergedPdf.embedJpg(imageBytes);
        }

        const { width, height } = image.scale(1);
        const pW = 595.28, pH = 841.89;
        const scale = Math.min(pW / width, pH / height) * 0.95;
        page.drawImage(image, {
          x: (pW - width * scale) / 2,
          y: (pH - height * scale) / 2,
          width: width * scale,
          height: height * scale,
        });
      }
    }

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfDataUrl = await blobToDataUrl(blob);

    const partnerName = docsToMerge[0].parsedData?.partnerName || '';
    const dateStr = new Date().toISOString().split('T')[0];
    const mergedFileName = `結合_${partnerName ? partnerName + '_' : ''}${dateStr}.pdf`;

    restaurantStore.addInboxDocument({
      fileName: mergedFileName,
      fileUrl: pdfDataUrl,
      status: 'unread',
      suggestedType: docsToMerge[0].suggestedType || 'マスタ証明書',
      parsedData: { ...docsToMerge[0].parsedData }
    });

    for (const doc of docsToMerge) {
      restaurantStore.deleteInboxDocument(doc.id);
    }

    selectedForMergeIds.value = [];
    isMultiSelectMode.value = false;
    alert(`${docsToMerge.length}枚のスキャンを1つのPDFに結合しました！`);
  } catch (err) {
    console.error('PDF結合エラー:', err);
    alert('PDFの結合に失敗しました: ' + err.message);
  } finally {
    isMerging.value = false;
  }
};

const inboxDocs = computed(() => state.t_inbox_documents || []);

// ファイルURLがプレビュー可能か判定
const isValidFileUrl = (url) =>
  !!url && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('/'));

const fileUrlStatus = (url) => {
  if (!url) return 'loading';
  if (isValidFileUrl(url)) return 'ready';
  return 'error';
};

const selectDocument = (doc) => {
  selectedDocId.value = doc?.id || null;
};

const getStatusBadgeClass = (status) => {
  if (status === 'unread') return 'badge-unread';
  if (status === 'processing') return 'badge-processing';
  return 'badge-neutral';
};

const selectedDocType = ref('receipt'); // 'receipt', 'master_cert', 'audit_doc'
const auditDocType = ref(state.auditCategories?.contract || '委託契約書'); // 監査ドキュメントカテゴリ名設定と連動
const customAuditDocType = ref('');
const auditDocTitle = ref('');
const auditDocNotes = ref('');

// フォームのモデル（AI推論結果とバインド）
const formData = ref({
  date: '',
  expiryDate: '',
  partnerName: '',
  items: [
    { ingredientName: '', quantity: '1', unit: 'kg', type: 'organic' }
  ],
  lotNumber: ''
});

// オートサジェスト用マスタデータ
const ingredientSuggestions = computed(() => {
  const ings = state.ingredients || [];
  return [...new Set(ings.map(i => i.name))];
});

const partnerSuggestions = computed(() => {
  // ingredientsマスタにあるすべての取引先（仕入先）
  const ings = state.ingredients || [];
  const suppliers = ings.map(i => i.supplier).filter(Boolean);
  
  // receiptsにあるすべての仕入先
  const recs = state.receipts || [];
  const recSuppliers = recs.map(r => r.supplier).filter(Boolean);
  
  return [...new Set([...suppliers, ...recSuppliers])];
});

const isFormValid = computed(() => {
  const hasValidItems = formData.value.items.length > 0 && formData.value.items.every(item => (item.ingredientName || '').trim() !== '');
  return formData.value.date && formData.value.partnerName && hasValidItems && formData.value.lotNumber;
});

const isMasterCertValid = computed(() => {
  // 適合証明書登録には、最低限1つ目の食材名指定が必要
  return formData.value.items.length > 0 && (formData.value.items[0].ingredientName || '').trim() !== '';
});

const isAuditDocValid = computed(() => {
  const hasType = auditDocType.value === 'その他' ? customAuditDocType.value.trim() !== '' : !!auditDocType.value;
  return formData.value.date && auditDocTitle.value.trim() !== '' && hasType;
});

// 選択時のフォームバインド
const handleSelect = (doc) => {
  selectDocument(doc);
  analysisError.value = '';
  
  // ファイル名から拡張子を除いたものをデフォルトタイトルにする
  auditDocTitle.value = doc.fileName ? doc.fileName.replace(/\.[^/.]+$/, "") : '新規監査資料';
  auditDocNotes.value = '';
  customAuditDocType.value = '';

  // AIの提案タイプに基づいてデフォルトの仕分けカテゴリを設定
  if (doc.suggestedType === 'マスタ証明書' || doc.suggestedType === '証明書') {
    selectedDocType.value = 'master_cert';
  } else if (doc.suggestedType === '納品書' || doc.suggestedType === '領収書') {
    selectedDocType.value = 'receipt';
  } else if (doc.suggestedType) {
    selectedDocType.value = 'audit_doc';
    const standardTypes = [
      state.auditCategories.contract,
      state.auditCategories.analysis,
      state.auditCategories.machine
    ];
    if (standardTypes.includes(doc.suggestedType)) {
      auditDocType.value = doc.suggestedType;
    } else {
      auditDocType.value = 'その他';
      customAuditDocType.value = doc.suggestedType;
    }
  } else {
    selectedDocType.value = 'receipt'; // フォールバック
  }
  
  if (doc.parsedData) {
    let initialItems = [];
    if (doc.parsedData.items && doc.parsedData.items.length > 0) {
      initialItems = doc.parsedData.items.map(i => ({
        ingredientName: i.ingredientName || i.materialName || '',
        quantity: i.quantity || '1',
        unit: i.unit || 'kg',
        type: i.type || 'organic'
      }));
    } else {
      initialItems = [{
        ingredientName: doc.parsedData.ingredientName || doc.parsedData.materialName || '',
        quantity: doc.parsedData.quantity || '1',
        unit: doc.parsedData.unit || 'kg',
        type: doc.parsedData.type || 'organic'
      }];
    }

    formData.value = {
      date: doc.parsedData.date || new Date().toISOString().split('T')[0],
      expiryDate: doc.parsedData.expiryDate || '',
      partnerName: doc.parsedData.partnerName || doc.parsedData.supplier || '',
      lotNumber: doc.parsedData.lotNumber || `LOT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
      items: initialItems
    };
  } else {
    // 解析が行われていない場合、初期化
    formData.value = {
      date: new Date().toISOString().split('T')[0],
      expiryDate: '',
      partnerName: '',
      lotNumber: `LOT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
      items: [{ ingredientName: '', quantity: '1', unit: 'kg', type: 'organic' }]
    };
  }
};

// --- 本物の Gemini 2.5 Flash を用いた OCR 解析処理 ---
const triggerAiAnalysis = async (doc) => {
  if (!isApiKeyConfigured.value) {
    analysisError.value = 'Gemini APIキーが設定されていないため、解析を実行できません。';
    return;
  }

  isAnalyzing.value = true;
  analysisError.value = '';
  restaurantStore.updateInboxDocument(doc.id, { status: 'processing' });

  try {
    const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.startsWith('data:application/pdf');
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (doc.fileUrl.startsWith('data:')) {
      const parts = doc.fileUrl.split(',');
      base64Data = parts[1];
      mimeType = parts[0].split(';')[0].split(':')[1];
    } else {
      // 外部URLなどの場合はフェッチしてBase64化
      const res = await fetch(doc.fileUrl);
      const blob = await res.blob();
      mimeType = blob.type;
      const dataUrl = await blobToDataUrl(blob);
      base64Data = dataUrl.split(',')[1];
    }

    // SVG形式はGemini APIで未サポートのため、CanvasでPNGのBase64に自動変換する
    if (mimeType.includes('svg')) {
      base64Data = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 1066;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const pngDataUrl = canvas.toDataURL('image/png');
            resolve(pngDataUrl.split(',')[1]);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('SVG画像の描画・PNG変換に失敗しました'));
        
        let srcUrl = doc.fileUrl;
        if (srcUrl.startsWith('data:image/svg+xml;utf8,')) {
          const rawSvg = srcUrl.replace('data:image/svg+xml;utf8,', '');
          srcUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(rawSvg)));
        }
        img.src = srcUrl;
      });
      mimeType = 'image/png';
    }

    const prompt = `
      有機JAS認定レストランが仕入れた原材料（食材）の納品書・領収書、または有機JAS証明書（適合証明書）の画像・PDFです。
      
      文書から以下の情報を高精度に抽出し、JSONフォーマットのみで厳密に返してください。余計な説明やMarkdownマークアップは一切含めないでください。
      
      1. 「partnerName」: 発行元・仕入先会社名・店名
      2. 「date」: 発行日・受入日 (YYYY-MM-DD 形式)
      3. 「lotNumber」: 納品書に記載された伝票番号、ロット番号、または識別コード。なければ今日の日付にランダムな3文字の英数字を足したもの（例: "20260525-ABC"）
      4. 「expiryDate」: JAS適合証明書の場合、有効期限の終了日 (YYYY-MM-DD 形式)。納品書の場合は空欄 ""
      5. 「suggestedType」: 書類が納品書や領収書なら "納品書"、有機JASマークの証明書や適合証明書なら "マスタ証明書"
      6. 「items」: 記載されているすべての購入食材のリスト。各項目は以下のプロパティを持ちます。
         - 「ingredientName」: 具体的な食材名・商品名（例：「有機人参」「有機黒酢」など。可能な限り正確に）
         - 「quantity」: 数量（数値のみ、例: 10, 2.5 など）
         - 「unit」: 単位（例: "kg", "g", "個", "袋", "本"）
         - 「type」: 有機JAS品であることが明示されている（有機、オーガニックなどの表記がある）場合は "organic"、そうでない一般食材は "general"

      出力JSONスキーマ:
      {
        "partnerName": "仕入先名",
        "date": "YYYY-MM-DD",
        "lotNumber": "伝票・ロット番号",
        "expiryDate": "YYYY-MM-DD または空文字",
        "suggestedType": "納品書 または マスタ証明書",
        "items": [
          { "ingredientName": "食材名", "quantity": "数量(数値)", "unit": "単位", "type": "organic|general" }
        ]
      }
    `;

    const model = 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    if (!response.ok) {
      let errMsg = `ステータス ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error && errJson.error.message) {
          errMsg = errJson.error.message;
        }
      } catch (e) {}
      throw new Error(`Gemini API エラー: ${errMsg}`);
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // ストアのドキュメントの解析データをアップデート
      restaurantStore.updateInboxDocument(doc.id, {
        parsedData: {
          date: parsed.date || new Date().toISOString().split('T')[0],
          expiryDate: parsed.expiryDate || '',
          partnerName: parsed.partnerName || '',
          lotNumber: parsed.lotNumber || `LOT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
          items: parsed.items || []
        },
        suggestedType: parsed.suggestedType || '納品書',
        status: 'unread'
      });
      
      // フォームに適用
      const updatedDoc = inboxDocs.value.find(d => d.id === doc.id);
      if (updatedDoc) {
        handleSelect(updatedDoc);
      }
    } else {
      throw new Error('AIの応答からJSONデータを検出できませんでした。');
    }
  } catch (err) {
    console.error('Gemini OCR 解析エラー:', err);
    restaurantStore.updateInboxDocument(doc.id, { status: 'unread' });
    analysisError.value = '自動解析に失敗しました: ' + err.message;
  } finally {
    isAnalyzing.value = false;
  }
};

// 納品記録として登録
const processAsReceipt = () => {
  if (!selectedDoc.value || !isFormValid.value) return;
  
  const data = {
    ...formData.value,
    fileUrl: selectedDoc.value.fileUrl
  };
  
  restaurantStore.processInboxDocument(selectedDoc.value.id, 'receipt', data);
  selectedDocId.value = null;
  alert('仕入・受入点検記録を登録しました！');
};

// マスタ適合証明書として登録
const processAsMasterCert = () => {
  if (!selectedDoc.value || !isMasterCertValid.value) return;

  const data = {
    ...formData.value,
    fileUrl: selectedDoc.value.fileUrl
  };

  restaurantStore.processInboxDocument(selectedDoc.value.id, 'master_cert', data);
  selectedDocId.value = null;
  alert('適合証明書を食材マスタに登録・同期しました！');
};

// 監査その他資料として登録
const processAsAuditDoc = () => {
  if (!selectedDoc.value || !isAuditDocValid.value) return;
  
  const finalType = auditDocType.value === 'その他' 
    ? customAuditDocType.value.trim() || 'その他資料' 
    : auditDocType.value;
    
  const data = {
    date: formData.value.date || new Date().toISOString().split('T')[0],
    documentType: finalType,
    title: auditDocTitle.value.trim() || '監査その他資料',
    partnerName: formData.value.partnerName || '不明な発行元',
    notes: auditDocNotes.value.trim() || 'スキャン受信箱から取り込み',
    fileUrl: selectedDoc.value.fileUrl
  };
  
  restaurantStore.processInboxDocument(selectedDoc.value.id, 'audit_doc', data);
  selectedDocId.value = null;
  alert(`監査ドキュメント（${finalType}）を登録しました！「監査ドキュメント」タブで確認できます。`);
};

// ゴミ箱へ
const deleteDoc = () => {
  if (!selectedDoc.value) return;
  if (confirm('このスキャン書類を受信トレイから完全に削除しますか？')) {
    restaurantStore.deleteInboxDocument(selectedDoc.value.id);
    selectedDocId.value = null;
  }
};

// 全件クリア
const clearAllDocs = () => {
  if (inboxDocs.value.length === 0) return;
  if (confirm('受信トレイにあるすべてのスキャン書類を完全に消去しますか？')) {
    restaurantStore.clearInboxDocuments();
    selectedDocId.value = null;
  }
};

// ページ切り替え（設定へのジャンプ用）
const goToSettings = () => {
  restaurantStore.setTab('settings');
};
</script>

<template>
  <div class="inbox-container animate-fade-in">
    <!-- ページヘッダー -->
    <div class="page-header card mb-6">
      <div class="title-wrap">
        <div class="icon-wrap bg-primary-grad">
          <Inbox size="24" />
        </div>
        <div class="header-text-wrap">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <h2>スキャン受信箱 (Inbox)</h2>
            <a href="mailto:scan-inbox@jasteria.com" class="scan-email-link" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #0f766e; background: #ccfbf1; padding: 4px 10px; border-radius: 999px; text-decoration: none; border: 1px solid #99f6e4; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#99f6e4'" onmouseout="this.style.background='#ccfbf1'">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              スキャン送信用アドレス: scan-inbox@jasteria.com
            </a>
          </div>
          <p class="text-sub">複合機等から自動転送された有機食材の納品書やJAS証明書を、AI (Gemini) が高度に自動識別・OCR解析して仕分けを待機しています。</p>
        </div>
        <div class="badge-wrap">
          <span class="count-badge">{{ inboxDocs.length }}件の未処理</span>
          <button v-if="inboxDocs.length > 0" class="btn btn-outline btn-xs btn-clear-all" @click="clearAllDocs">
            <Trash2 size="13" /> 全削除
          </button>
        </div>
      </div>
    </div>

    <!-- メインレイアウト -->
    <div class="inbox-layout">
      <!-- 左ペイン：未処理リスト -->
      <div class="inbox-list card">
        <div class="list-header">
          <Mail size="18" class="text-sub" />
          <h3>書類リスト</h3>
          <button
            class="btn-multiselect"
            :class="{ active: isMultiSelectMode }"
            @click="toggleMultiSelectMode"
            title="複数のスキャンを選択して1枚のPDFに結合"
          >
            <Layers size="13" />
            {{ isMultiSelectMode ? 'キャンセル' : '複数結合' }}
          </button>
        </div>
        
        <div v-if="inboxDocs.length === 0" class="empty-state">
          <Inbox size="48" class="text-light mb-2" />
          <p class="font-semibold text-sub">新しいスキャン書類はありません。</p>
          <span class="sub text-xs text-light">複合機からスキャン送信されると、自動的にここにドキュメントが蓄積されます。</span>
        </div>

        <div v-else class="doc-cards">
          <div
            v-for="doc in inboxDocs"
            :key="doc.id"
            class="doc-card"
            :class="{
              active: !isMultiSelectMode && selectedDoc?.id === doc.id,
              'selected-for-merge': isMultiSelectMode && selectedForMergeIds.includes(doc.id)
            }"
            @click="handleCardClick(doc)"
          >
            <div class="doc-card-top">
              <div v-if="isMultiSelectMode" class="merge-checkbox" :class="{ checked: selectedForMergeIds.includes(doc.id) }">
                <CheckCircle2 v-if="selectedForMergeIds.includes(doc.id)" size="16" class="icon-checked" />
                <div v-else class="checkbox-empty" />
              </div>
              <span class="badge" :class="getStatusBadgeClass(doc.status)">
                {{ doc.status === 'unread' ? '未確認' : (doc.status === 'processing' ? '解析中' : '確認済') }}
              </span>
              <span class="doc-date font-mono">{{ doc.receivedAt }}</span>
            </div>
            <h4 class="doc-name truncate">{{ doc.fileName }}</h4>
            <div class="doc-suggest">
              <Bot size="14" class="icon-ai" />
              <span class="text-xs">AI識別: <strong>{{ doc.suggestedType || '未解析' }}</strong></span>
            </div>
          </div>
        </div>

        <!-- 結合フッター -->
        <div v-if="isMultiSelectMode" class="merge-footer" :class="{ 'can-merge': selectedForMergeIds.length >= 2 }">
          <p class="merge-info text-xs">
            <span v-if="selectedForMergeIds.length === 0">結合する書類をタップして選択...</span>
            <span v-else-if="selectedForMergeIds.length === 1">あと1件以上選択してください</span>
            <span v-else>{{ selectedForMergeIds.length }}件選択中 → 1つのPDFにマージ</span>
          </p>
          <button
            class="btn btn-primary btn-sm w-full"
            :disabled="selectedForMergeIds.length < 2 || isMerging"
            @click="mergeSelectedToPDF"
          >
            <span v-if="isMerging">PDF結合中...</span>
            <template v-else>
              <FileDown size="15" />
              マージして結合PDFを出力
            </template>
          </button>
        </div>
      </div>

      <!-- 右ペイン：プレビューと処理 -->
      <div class="inbox-detail card">
        <div v-if="isMultiSelectMode" class="detail-empty merge-mode-hint text-center">
          <Layers size="48" class="text-accent mb-2" />
          <h4 style="color: var(--accent);">複数選択（PDF結合）モード</h4>
          <span class="sub text-xs text-sub">左のリストからマージしたいスキャンを複数選んで<br>「マージして結合PDFを出力」を押してください。</span>
        </div>
        
        <div v-else-if="!selectedDoc" class="detail-empty text-center">
          <Search size="48" class="text-light mb-2" />
          <p class="text-sub font-semibold">左側のリストから書類を選択してください</p>
          <span class="text-xs text-light">選択したファイルのプレビューとAIの自動仕分けフォームが表示されます。</span>
        </div>
        
        <div v-else class="detail-content">
          <!-- プレビュー枠 (左半分) -->
          <div class="preview-pane">
            <div class="preview-header flex items-center gap-2">
              <FileText size="18" class="text-sub" />
              <span class="truncate text-sm font-semibold">{{ selectedDoc.fileName }}</span>
            </div>
            
            <div class="preview-frame">
              <!-- ローディング -->
              <div v-if="fileUrlStatus(selectedDoc.fileUrl) === 'loading'" class="preview-loading text-center">
                <div class="preview-spinner" />
                <p class="text-xs text-light mt-2">ファイルをロードしています...</p>
              </div>
              
              <!-- エラー -->
              <div v-else-if="fileUrlStatus(selectedDoc.fileUrl) === 'error'" class="preview-error text-center">
                <AlertTriangle size="40" class="text-warning mb-2" />
                <p class="text-sm font-bold text-amber-800">プレビューをロードできません</p>
                <p class="text-xs text-light mt-1">PDFのサイズが大きすぎるか、破損している可能性があります。</p>
              </div>
              
              <!-- PDF表示 -->
              <template v-else-if="selectedDoc.fileName && selectedDoc.fileName.toLowerCase().endsWith('.pdf')">
                <iframe :src="previewBlobUrl + '#toolbar=0'" class="preview-pdf" frameborder="0" width="100%" height="100%"></iframe>
              </template>
              
              <!-- 画像表示 -->
              <template v-else>
                <img :src="previewBlobUrl" alt="Scan Document Preview" class="preview-image" />
              </template>
            </div>
          </div>

          <!-- 振り分けアクション枠 (右半分) -->
          <div class="action-pane">
            <div class="action-header ai-powered mb-4">
              <div class="ai-title-wrap">
                <div class="flex items-center gap-2">
                  <Bot size="22" class="text-primary icon-ai-pulse" />
                  <h3 style="margin: 0; font-size: 1.15rem;">AI自動解析と店舗仕分け</h3>
                </div>
                <span class="ai-badge mt-1 inline-block">✨ Gemini 2.5 Flash 解析</span>
              </div>
            </div>

            <!-- APIキー未設定エラーバナー (強固なブロック・デモ不可) -->
            <div v-if="!isApiKeyConfigured" class="alert alert-danger flex flex-col gap-2 mb-4" style="border-radius: var(--radius-md);">
              <div class="flex items-center gap-2 font-bold" style="color: #7f1d1d;">
                <AlertTriangle size="20" />
                <span>Gemini APIキーが設定されていません</span>
              </div>
              <p style="margin: 0; font-size: 0.825rem; line-height: 1.4; color: #991b1b;">
                AI OCR自動解析機能（Gemini 2.5 Flash）を利用するには、有効なAPIキーの登録が必要です。
                認証店舗設定画面の「PDF解析用AIキー」にキーを入力し、保存してください。
              </p>
              <button class="btn btn-outline btn-xs mt-2" @click="goToSettings" style="align-self: flex-start; background: #ffffff; border-color: #fca5a5; font-size: 0.75rem; padding: 0.2rem 0.5rem;">
                店舗設定へ登録に行く →
              </button>
            </div>

            <!-- 解析エラー表示 -->
            <div v-if="analysisError" class="alert alert-warning text-xs mb-4">
              <AlertTriangle size="14" />
              <span>{{ analysisError }}</span>
            </div>

            <!-- 解析実行・再実行ボタン (APIキーが設定されている場合に表示) -->
            <div v-if="isApiKeyConfigured" class="text-center py-5 card mb-4" style="border: 2px dashed var(--primary); background: var(--primary-light); margin-bottom: 1.5rem;">
              <Bot size="36" class="text-primary mb-2" :class="{ 'animate-bounce': !selectedDoc.parsedData && !isAnalyzing, 'animate-spin': isAnalyzing }" />
              <p class="text-sm font-semibold mb-2" style="color: var(--primary-hover);">
                {{ selectedDoc.parsedData ? 'AI解析済みの書類です' : 'AI解析待ちの書類です' }}
              </p>
              <button 
                class="btn btn-primary btn-sm px-6" 
                :disabled="isAnalyzing"
                @click="triggerAiAnalysis(selectedDoc)"
                style="min-width: 200px;"
              >
                <span v-if="isAnalyzing">OCR自動解析を実行中...</span>
                <span v-else-if="selectedDoc.parsedData">✨ AI OCRで再解析する</span>
                <span v-else>✨ AI OCR自動解析を開始</span>
              </button>
            </div>

            <!-- 解析済みまたは手動入力フォーム -->
            <div class="form-grid-scroll">
              <div class="form-grid">
                <!-- 1. 書類種別（仕分け）の選択 -->
                <div class="form-group full-width-field" style="grid-column: span 2; border-bottom: 2px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.5rem;">
                  <label class="form-label flex items-center gap-1 font-bold text-emerald-950" style="font-size: 0.95rem; color: var(--primary);"><Layers size="16"/> 📂 書類の仕分け先を選択してください <span class="text-red-500 font-bold">*</span></label>
                  <select v-model="selectedDocType" class="input-organic select-organic" style="font-weight: 600; border-color: var(--primary-border); background-color: var(--primary-light);">
                    <option value="receipt">仕入・受入点検記録（納品書・受入エビデンス等）</option>
                    <option value="master_cert">マスタ適合証明書（有機JAS適合判定書等）</option>
                    <option value="audit_doc">その他監査資料（委託契約書、分析表、清掃実績等）</option>
                  </select>
                </div>

                <!-- 共通項目：日付・発行元 -->
                <div class="form-group">
                  <label class="form-label flex items-center gap-1"><Calendar size="14"/> 発行日・受入日 <span class="text-red-500 font-bold">*</span></label>
                  <input v-model="formData.date" type="date" class="input-organic" />
                </div>

                <div class="form-group">
                  <label class="form-label flex items-center gap-1"><Package size="14"/> 発行元・取引先名 <span class="text-red-500 font-bold">*</span></label>
                  <input v-model="formData.partnerName" type="text" class="input-organic" placeholder="例：黒酢本家 桷志田" list="partner-options" />
                  <datalist id="partner-options">
                    <option v-for="name in partnerSuggestions" :key="name" :value="name" />
                  </datalist>
                </div>

                <!-- A. 仕入・受入点検用フィールド -->
                <template v-if="selectedDocType === 'receipt'">
                  <div class="form-group full-width-field" style="grid-column: span 2;">
                    <label class="form-label flex items-center gap-1"><Bot size="14"/> ロット番号/伝票番号 <span class="text-red-500 font-bold">*</span></label>
                    <input v-model="formData.lotNumber" type="text" class="input-organic font-mono" placeholder="伝票Noまたはロット符号" />
                  </div>

                  <!-- 食材リスト項目ループ -->
                  <div class="items-container" style="grid-column: span 2;">
                    <span class="form-label flex items-center gap-1 font-semibold mb-2"><Package size="14"/> 検出された食材明細</span>
                    
                    <div v-for="(item, index) in formData.items" :key="index" class="item-row card mb-2" style="padding: 0.75rem; border-color: var(--primary-border); background-color: var(--primary-light);">
                      <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-emerald-900 font-mono">項目 #{{ index + 1 }}</span>
                        <button v-if="formData.items.length > 1" @click="formData.items.splice(index, 1)" class="text-xs text-red-700 font-semibold" style="background: none; border: none; cursor: pointer;">
                          ✕ 削除
                        </button>
                      </div>
                      
                      <div class="grid-cols-2 mb-2" style="gap: 0.5rem;">
                        <div class="form-group mb-0">
                          <label class="text-xs text-sub mb-1 block">食材名 <span class="text-red-500 font-bold">*</span></label>
                          <input v-model="item.ingredientName" type="text" class="input-organic py-1" style="font-size: 0.85rem;" placeholder="例：有機にんじん" list="ingredient-options" />
                        </div>
                        
                        <div class="form-group mb-0">
                          <label class="text-xs text-sub mb-1 block">受入区分</label>
                          <select v-model="item.type" class="input-organic select-organic py-1" style="font-size: 0.85rem;">
                            <option value="organic">有機JAS品</option>
                            <option value="general">一般食品</option>
                            <option value="salt_water">水・塩</option>
                          </select>
                        </div>
                      </div>

                      <div class="flex gap-2">
                        <div style="flex: 2;">
                          <label class="text-xs text-sub mb-1 block">数量</label>
                          <input v-model="item.quantity" type="text" class="input-organic py-1" style="font-size: 0.85rem;" placeholder="例: 10" />
                        </div>
                        <div style="flex: 1;">
                          <label class="text-xs text-sub mb-1 block">単位</label>
                          <select v-model="item.unit" class="input-organic select-organic py-1" style="font-size: 0.85rem;">
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="個">個</option>
                            <option value="袋">袋</option>
                            <option value="本">本</option>
                            <option value="ケース">ケース</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <button class="btn btn-outline btn-xs w-full mt-2" @click="formData.items.push({ ingredientName: '', quantity: '1', unit: 'kg', type: 'organic' })" style="font-size: 0.75rem; padding: 0.3rem 0.5rem; background: #ffffff;">
                      + 明細行を追加
                    </button>
                    
                    <datalist id="ingredient-options">
                      <option v-for="name in ingredientSuggestions" :key="name" :value="name" />
                    </datalist>
                  </div>
                </template>

                <!-- B. マスタ適合証明書用フィールド -->
                <template v-else-if="selectedDocType === 'master_cert'">
                  <div class="items-container" style="grid-column: span 2;">
                    <span class="form-label flex items-center gap-1 font-semibold mb-2"><Package size="14"/> 対象の原材料名</span>
                    <div v-for="(item, index) in formData.items" :key="index" class="item-row card mb-2" style="padding: 0.75rem; border-color: var(--primary-border); background-color: var(--primary-light);">
                      <div class="form-group mb-0">
                        <label class="text-xs text-sub mb-1 block">食材名（この証明書が適用される食材） <span class="text-red-500 font-bold">*</span></label>
                        <input v-model="item.ingredientName" type="text" class="input-organic py-1" style="font-size: 0.85rem;" placeholder="例：有機にんじん" list="ingredient-options" />
                      </div>
                    </div>
                    <datalist id="ingredient-options">
                      <option v-for="name in ingredientSuggestions" :key="name" :value="name" />
                    </datalist>
                  </div>

                  <div class="form-group full-width-field mt-2" style="grid-column: span 2; background-color: var(--accent-light); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px dashed var(--accent-border);">
                    <label class="form-label flex items-center gap-1 font-semibold" style="color: var(--accent-hover);"><ShieldCheck size="15" /> 適合証明書の有効期限 <span class="text-red-500 font-bold">*</span></label>
                    <input v-model="formData.expiryDate" type="date" class="input-organic" style="border-color: var(--accent-border);" />
                    <p class="checkbox-help text-xs mt-1" style="color: var(--text-sub);">※2025年監査改善項目：適合証明書の「有効期限」をマスタ側にも自動同期保存します。</p>
                  </div>
                </template>

                <!-- C. その他監査資料用フィールド -->
                <template v-else-if="selectedDocType === 'audit_doc'">
                  <div class="form-group full-width-field" style="grid-column: span 2;">
                    <label class="form-label flex items-center gap-1 font-semibold"><FileText size="14"/> 📂 資料の種別・区分 <span class="text-red-500 font-bold">*</span></label>
                    <select v-model="auditDocType" class="input-organic select-organic">
                      <option :value="state.auditCategories.contract">{{ state.auditCategories.contract }}</option>
                      <option :value="state.auditCategories.analysis">{{ state.auditCategories.analysis }}</option>
                      <option :value="state.auditCategories.machine">{{ state.auditCategories.machine }}</option>
                      <option value="その他">その他（以下に自由入力）</option>
                    </select>
                  </div>

                  <div v-if="auditDocType === 'その他'" class="form-group full-width-field" style="grid-column: span 2;">
                    <label class="form-label flex items-center gap-1"><FileText size="14"/> 自由入力の資料種別名 <span class="text-red-500 font-bold">*</span></label>
                    <input v-model="customAuditDocType" type="text" class="input-organic" placeholder="例: 研修会修了証、水質検査書など" />
                  </div>

                  <div class="form-group full-width-field" style="grid-column: span 2;">
                    <label class="form-label flex items-center gap-1"><FileText size="14"/> 資料の名称・タイトル <span class="text-red-500 font-bold">*</span></label>
                    <input v-model="auditDocTitle" type="text" class="input-organic" placeholder="例: 2026年度生ゴミ委託処理契約書" />
                  </div>

                  <div class="form-group full-width-field" style="grid-column: span 2;">
                    <label class="form-label">備考・特記事項（監査員向けの補足）</label>
                    <textarea v-model="auditDocNotes" class="input-organic" rows="3" placeholder="この書類に関する補足説明、JAS監査時の確認用メモなど..."></textarea>
                  </div>
                </template>
              </div>
            </div>

            <!-- 操作ボタン群 (APIキーがない場合は登録ボタンを不活性化して安全化) -->
            <div class="action-buttons mt-6">
              <template v-if="selectedDocType === 'receipt'">
                <button 
                  class="btn btn-primary flex-1" 
                  :disabled="!isFormValid || !isApiKeyConfigured" 
                  @click="processAsReceipt"
                  style="height: 42px;"
                >
                  <CheckCircle2 size="18" />
                  仕入・受入点検として登録 📥
                </button>
              </template>
              
              <template v-else-if="selectedDocType === 'master_cert'">
                <button 
                  class="btn btn-accent flex-1" 
                  :disabled="!isMasterCertValid || !formData.expiryDate || !isApiKeyConfigured" 
                  @click="processAsMasterCert"
                  style="height: 42px;"
                >
                  <ShieldCheck size="18" />
                  マスタ適合証明書として適用 🛡️
                </button>
              </template>

              <template v-else-if="selectedDocType === 'audit_doc'">
                <button 
                  class="btn btn-primary flex-1" 
                  :disabled="!isAuditDocValid || !isApiKeyConfigured" 
                  @click="processAsAuditDoc"
                  style="height: 42px; background-color: var(--primary); border-color: var(--primary);"
                >
                  <FileText size="18" />
                  監査ドキュメントとして登録 📁
                </button>
              </template>
            </div>
            
            <div class="action-buttons-sub mt-3 flex justify-between">
              <button class="btn btn-outline text-danger btn-sm" @click="deleteDoc">
                <Trash2 size="14" /> この書類を破棄
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inbox-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.page-header {
  padding: 1.25rem 1.5rem;
  border-left: 5px solid var(--primary);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-text-wrap {
  flex-grow: 1;
}

.header-text-wrap h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.header-text-wrap p {
  margin: 0;
  font-size: 0.8rem;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.bg-primary-grad {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
}

.badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.count-badge {
  background: var(--danger);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.btn-clear-all {
  color: var(--danger) !important;
  border-color: var(--danger-border) !important;
}
.btn-clear-all:hover {
  background-color: var(--danger-bg) !important;
}

.inbox-layout {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

/* 左ペイン：リスト */
.inbox-list {
  width: 340px;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-color: var(--border);
}

.list-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-sub);
}

.list-header h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary);
  flex-grow: 1;
}

.btn-multiselect {
  font-family: var(--font-sans);
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--accent);
  background: white;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: var(--transition);
}
.btn-multiselect.active {
  background-color: var(--accent);
  color: white;
}
.btn-multiselect:hover {
  background-color: var(--accent-light);
}
.btn-multiselect.active:hover {
  background-color: var(--accent-hover);
}

.doc-cards {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.doc-card {
  padding: 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  background-color: #ffffff;
}
.doc-card:hover {
  border-color: var(--primary-border);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.doc-card.active {
  border-color: var(--accent);
  background-color: var(--accent-light);
  box-shadow: var(--shadow-sm);
}
.doc-card.selected-for-merge {
  border-color: var(--primary);
  background-color: var(--primary-light);
}

.doc-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.doc-date {
  font-size: 0.7rem;
  color: var(--text-light);
}

.badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.badge-unread {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
}
.badge-processing {
  background-color: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning-border);
}

.doc-name {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-main);
}

.doc-suggest {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--primary);
  background-color: var(--primary-light);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  width: max-content;
  border: 1px solid var(--primary-border);
}
.icon-ai {
  color: var(--primary);
}

.merge-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}
.checkbox-empty {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--text-light);
  border-radius: 50%;
  background: white;
}
.icon-checked {
  color: var(--primary);
}

.merge-footer {
  padding: 0.875rem 1rem;
  border-top: 1px dashed var(--border);
  background-color: var(--bg-sub);
}
.merge-info {
  margin: 0 0 0.5rem 0;
  text-align: center;
  color: var(--text-sub);
}
.can-merge .merge-info {
  color: var(--primary);
  font-weight: 600;
}

/* 右ペイン：プレビューと処理 */
.inbox-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-color: var(--border);
}

.detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-light);
}

.detail-empty h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.detail-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* プレビュー枠 (左側半分) */
.preview-pane {
  flex: 1.1;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background-color: var(--bg-sub);
}

.preview-header {
  padding: 0.75rem 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border);
}

.preview-frame {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-loading, .preview-error {
  margin-top: 5rem;
}

.preview-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-pdf {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: white;
  box-shadow: var(--shadow-sm);
}

.preview-image {
  max-width: 100%;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

/* アクション・フォーム枠 (右側半分) */
.action-pane {
  flex: 0.9;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
}

.ai-powered {
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
}

.ai-badge {
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.form-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
}

.form-group.full-width-field {
  grid-column: span 2;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
}

.input-organic {
  padding: 0.45rem 0.65rem;
  font-size: 0.85rem;
}

.items-container {
  border-top: 1px dashed var(--border);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-buttons-sub {
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

.text-danger {
  color: var(--danger) !important;
}
.text-danger:hover {
  background-color: var(--danger-bg) !important;
}

.checkbox-help {
  font-size: 0.7rem;
  color: var(--text-sub);
}

.alert-danger {
  border-color: #fca5a5;
  background-color: #fff5f5;
  padding: 0.875rem;
}

.icon-ai-pulse {
  animation: pulse-glow 2s infinite ease-in-out;
}
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(28, 58, 39, 0)); }
  50% { filter: drop-shadow(0 0 6px var(--primary)); }
}

@media (max-width: 1024px) {
  .detail-content {
    flex-direction: column;
  }
  .preview-pane {
    height: 350px;
    flex: none;
  }
  .action-pane {
    flex: 1;
  }
}
</style>
