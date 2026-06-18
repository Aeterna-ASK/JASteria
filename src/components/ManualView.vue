<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import {
  BookOpen, Plus, Edit, X, CheckCircle, History, FileText, ChevronDown,
  RefreshCw, Printer, AlertTriangle, Clock, ExternalLink, RotateCcw,
  Save, GitCommit, User, FileCheck, Library
} from 'lucide-vue-next';

const state = restaurantStore.state;

// --- ローカル通知（トースト） ---
const toasts = ref([]);
let toastSeq = 0;
const showToast = (message, type = 'info') => {
  const id = ++toastSeq;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3200);
};

// --- 文字列ユーティリティ（null安全） ---
const truncateString = (str, n) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
};

// --- 選択状態 ---
const selectedCatId = ref(null);
const selectedDocId = ref(null);

const selectedDoc = computed(() => {
  const cat = state.documents.find(c => c.id === selectedCatId.value);
  if (!cat) return null;
  return cat.items.find(d => d.id === selectedDocId.value) || null;
});

const selectDoc = (catId, docId) => {
  selectedCatId.value = catId;
  selectedDocId.value = docId;
  isEditing.value = false;
};

// --- 編集状態 ---
const isEditing = ref(false);
const editName = ref('');
const editSummary = ref('');
const editText = ref('');
const editAuditPoints = ref('');
const editOriginalRevisionDate = ref('');
const editReviewDate = ref('');
const applyDatesToAll = ref(false);

const startEdit = () => {
  const doc = selectedDoc.value;
  if (!doc) return;
  editName.value = doc.name || '';
  editSummary.value = doc.summary || '';
  editText.value = doc.text || '';
  editAuditPoints.value = doc.auditPoints || '';
  editOriginalRevisionDate.value = doc.originalRevisionDate || '';
  editReviewDate.value = doc.reviewDate || '';
  applyDatesToAll.value = false;
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const collectEditedFields = () => ({
  name: editName.value,
  summary: editSummary.value,
  text: editText.value,
  auditPoints: editAuditPoints.value,
  originalRevisionDate: editOriginalRevisionDate.value,
  reviewDate: editReviewDate.value
});

// 内容のみ保存（versionは上げない）
const saveContentOnly = () => {
  if (!selectedDoc.value) return;
  restaurantStore.updateDocument(selectedCatId.value, selectedDocId.value, collectEditedFields());
  if (applyDatesToAll.value) {
    restaurantStore.updateAllDocumentsDates(editOriginalRevisionDate.value, editReviewDate.value);
    showToast('内容を保存し、日付を全章へ一括適用しました', 'success');
  } else {
    showToast('内容を保存しました（バージョンは据え置き）', 'success');
  }
  isEditing.value = false;
};

// --- 改訂コミットモーダル (A) ---
const showRevisionModal = ref(false);
const revVersion = ref('');
const revApprover = ref('');
const revReason = ref('');

const openRevisionModal = () => {
  if (!selectedDoc.value) return;
  // 編集中の本文を反映してから改訂したいので、未保存の内容も持ち込む
  revVersion.value = nextMinorVersion(selectedDoc.value.version);
  revApprover.value = selectedDoc.value.approvedBy || state.restaurantInfo.manager;
  revReason.value = '';
  showRevisionModal.value = true;
};

const nextMinorVersion = (version) => {
  const parts = (version || 'v1.0.0').replace(/^v/i, '').split('.');
  const major = Number(parts[0]) || 1;
  const minor = Number((parts[1] || '0')) || 0;
  return `v${major}.${minor + 1}.0`;
};

const commitRevision = () => {
  if (!selectedDoc.value) return;
  if (!(revReason.value || '').trim()) {
    showToast('改訂理由は必須です', 'warning');
    return;
  }
  // 編集中なら本文・メタも一緒に保存してから履歴を記録
  const textToSave = isEditing.value ? editText.value : selectedDoc.value.text;
  if (isEditing.value) {
    restaurantStore.updateDocument(selectedCatId.value, selectedDocId.value, collectEditedFields());
    if (applyDatesToAll.value) {
      restaurantStore.updateAllDocumentsDates(editOriginalRevisionDate.value, editReviewDate.value);
    }
  }
  restaurantStore.addDocumentRevision(selectedCatId.value, selectedDocId.value, {
    version: (revVersion.value || '').trim() || undefined,
    comment: revReason.value.trim(),
    author: (revApprover.value || '').trim() || state.restaurantInfo.manager,
    text: textToSave
  });
  showRevisionModal.value = false;
  isEditing.value = false;
  showToast(`改訂を記録しました（${selectedDoc.value.version}）`, 'success');
};

// --- 履歴項目編集モーダル (B) ---
const showHistoryModal = ref(false);
const historyEditIndex = ref(-1);
const histVersion = ref('');
const histAuthor = ref('');
const histDate = ref('');
const histComment = ref('');

const openHistoryEdit = (index) => {
  const doc = selectedDoc.value;
  if (!doc || !doc.history || !doc.history[index]) return;
  const h = doc.history[index];
  historyEditIndex.value = index;
  histVersion.value = h.version || '';
  histAuthor.value = h.author || '';
  histDate.value = h.date || '';
  histComment.value = h.comment || '';
  showHistoryModal.value = true;
};

const saveHistoryEdit = () => {
  if (historyEditIndex.value < 0) return;
  restaurantStore.updateDocumentHistory(selectedCatId.value, selectedDocId.value, historyEditIndex.value, {
    version: histVersion.value,
    author: histAuthor.value,
    date: histDate.value,
    comment: histComment.value
  });
  showHistoryModal.value = false;
  showToast('改訂履歴を修正しました', 'success');
};

// --- 新規文書登録モーダル (C) ---
const showUploadModal = ref(false);
const uploadCatId = ref(null);
const newName = ref('');
const newSummary = ref('');
const newAuditPoints = ref('');
const newText = ref('');

const openUploadModal = (catId) => {
  uploadCatId.value = catId;
  newName.value = '';
  newSummary.value = '';
  newAuditPoints.value = '';
  newText.value = '';
  showUploadModal.value = true;
};

const submitUpload = () => {
  if (!(newName.value || '').trim()) {
    showToast('タイトルは必須です', 'warning');
    return;
  }
  const created = restaurantStore.uploadDocument(uploadCatId.value, {
    name: newName.value.trim(),
    summary: newSummary.value,
    text: newText.value,
    auditPoints: newAuditPoints.value
  });
  showUploadModal.value = false;
  if (created) {
    selectDoc(uploadCatId.value, created.id);
    showToast('新規規定を登録しました（下書き）', 'success');
  }
};

// --- ステータス切替 ---
const toggleStatus = () => {
  const doc = selectedDoc.value;
  if (!doc) return;
  const next = doc.status === 'approved' ? 'draft' : 'approved';
  restaurantStore.updateDocumentStatus(selectedCatId.value, selectedDocId.value, next, state.restaurantInfo.manager);
  showToast(next === 'approved' ? '承認済みにしました' : '下書きに戻しました', next === 'approved' ? 'success' : 'info');
};

// --- 外部公式情報の同期 ---
const isSyncing = ref(false);
const formatDateTime = (iso) => {
  if (!iso) return '未同期';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const syncExternal = async () => {
  if (isSyncing.value) return;
  isSyncing.value = true;
  try {
    await restaurantStore.syncExternalRegInfo();
    showToast('外部公式情報を最新に同期しました', 'success');
  } catch (e) {
    showToast('同期に失敗しました', 'error');
  } finally {
    isSyncing.value = false;
  }
};

const showAnnouncements = ref(true);

// --- 標準テンプレートへ一括同期 ---
const resetToDefault = () => {
  if (!window.confirm('すべての規定を標準テンプレートへ一括同期します。現在の編集内容は失われます。よろしいですか？')) {
    return;
  }
  restaurantStore.resetDocumentsToDefault();
  selectedCatId.value = null;
  selectedDocId.value = null;
  isEditing.value = false;
  showToast('標準テンプレートへ一括同期しました', 'success');
};

// --- 印刷 ---
const printMode = ref(null); // 'single' | 'all'
const printDoc = ref(null);

const allDocsFlat = computed(() => {
  const list = [];
  state.documents.forEach(cat => {
    cat.items.forEach(doc => list.push({ catTitle: cat.title, doc }));
  });
  return list;
});

const doPrint = () => {
  document.body.classList.add('doc-print-active');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
};

const printSelected = () => {
  if (!selectedDoc.value) {
    showToast('印刷する規定を選択してください', 'warning');
    return;
  }
  printDoc.value = selectedDoc.value;
  printMode.value = 'single';
  doPrint();
};

const printAll = () => {
  printMode.value = 'all';
  doPrint();
};

const handleAfterPrint = () => {
  document.body.classList.remove('doc-print-active');
  printMode.value = null;
  printDoc.value = null;
};

onMounted(() => {
  window.addEventListener('afterprint', handleAfterPrint);
});
onUnmounted(() => {
  window.removeEventListener('afterprint', handleAfterPrint);
});
</script>

<template>
  <div class="lib-view">
    <!-- ===== ヘッダー ===== -->
    <div class="lib-header glass">
      <div class="header-left">
        <Library class="header-icon" :size="28" />
        <div>
          <h2>
            規定・マニュアル管理ライブラリ
            <span class="pro-badge">v.Pro</span>
          </h2>
          <p>有機JAS認定レストランの運用規定・手順書・改訂履歴を一括管理</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-head" @click="resetToDefault">
          <RotateCcw :size="16" />
          <span>標準テンプレートへ一括同期</span>
        </button>
        <button class="btn-head" @click="printSelected" :disabled="!selectedDoc">
          <Printer :size="16" />
          <span>選択中の章のみ印刷</span>
        </button>
        <button class="btn-head btn-head-primary" @click="printAll">
          <FileText :size="16" />
          <span>全章一括印刷</span>
        </button>
      </div>
    </div>

    <!-- ===== 2カラム ===== -->
    <div class="lib-layout">
      <!-- ===== 左ペイン ===== -->
      <div class="left-pane">
        <!-- 外部公式情報 連携カード -->
        <div class="ext-card glass">
          <div class="ext-head">
            <div class="ext-title">
              <ExternalLink :size="16" />
              <span>外部公式情報 連携</span>
            </div>
            <button class="btn-sync" @click="syncExternal" :disabled="isSyncing">
              <RefreshCw :size="14" :class="{ spinning: isSyncing }" />
              <span>{{ isSyncing ? '同期中…' : '最新同期' }}</span>
            </button>
          </div>
          <div class="ext-synced">最終同期: {{ formatDateTime(state.externalRegInfo.lastSynced) }}</div>

          <div class="ext-links">
            <a
              v-for="link in state.externalRegInfo.links"
              :key="link.id"
              class="ext-link"
              :href="link.url"
              target="_blank"
              rel="noopener"
              :title="link.name"
            >
              <span class="link-type">{{ link.type }}</span>
              <span class="link-name">{{ truncateString(link.name, 22) }}</span>
              <span class="link-size">{{ link.size }}</span>
            </a>
          </div>

          <button class="ann-toggle" @click="showAnnouncements = !showAnnouncements">
            <span>最新のお知らせ・改正動向</span>
            <ChevronDown :size="16" :class="{ rotated: !showAnnouncements }" />
          </button>
          <div v-if="showAnnouncements" class="ann-list">
            <div v-for="ann in state.externalRegInfo.announcements" :key="ann.id" class="ann-item">
              <div class="ann-date">{{ ann.date }}</div>
              <div class="ann-title">{{ ann.title }}</div>
              <div class="ann-desc">{{ ann.desc }}</div>
              <a class="ann-link" :href="ann.url" target="_blank" rel="noopener">
                公式情報を開く <ExternalLink :size="12" />
              </a>
            </div>
          </div>
        </div>

        <!-- カテゴリブロック -->
        <div v-for="cat in state.documents" :key="cat.id" class="cat-block glass">
          <div class="cat-head">
            <h3>{{ cat.title }}</h3>
            <button class="btn-add" @click="openUploadModal(cat.id)">
              <Plus :size="14" />
              <span>規定追加</span>
            </button>
          </div>
          <div class="doc-cards">
            <div
              v-for="doc in cat.items"
              :key="doc.id"
              class="doc-card"
              :class="{ active: selectedDocId === doc.id }"
              @click="selectDoc(cat.id, doc.id)"
            >
              <div class="card-top">
                <FileText :size="16" class="doc-ico" />
                <span class="ver-badge">{{ doc.version }}</span>
                <span class="status-badge" :class="doc.status === 'approved' ? 'is-approved' : 'is-draft'">
                  {{ doc.status === 'approved' ? '承認済' : '下書き' }}
                </span>
              </div>
              <div class="card-mid">
                <div class="doc-name">{{ doc.name }}</div>
                <div class="doc-summary">{{ truncateString(doc.summary, 48) }}</div>
              </div>
              <div class="card-bottom">
                <span class="meta"><Clock :size="12" /> {{ doc.date }}</span>
                <span class="meta">{{ doc.size }}</span>
              </div>
            </div>
            <div v-if="cat.items.length === 0" class="cat-empty">この分類に規定はありません</div>
          </div>
        </div>
      </div>

      <!-- ===== 右ペイン（Wiki詳細） ===== -->
      <div class="right-pane">
        <!-- 空状態 -->
        <div v-if="!selectedDoc" class="empty-state glass">
          <BookOpen :size="48" class="empty-icon" />
          <p>左の一覧から規定・マニュアルを選択してください</p>
        </div>

        <!-- 詳細 -->
        <div v-else class="doc-detail glass">
          <!-- 詳細ヘッダー -->
          <div class="detail-header">
            <div class="dh-tags">
              <span class="ver-tag">{{ selectedDoc.version }}</span>
              <button
                class="status-toggle"
                :class="selectedDoc.status === 'approved' ? 'is-approved' : 'is-draft'"
                @click="toggleStatus"
                title="クリックで承認⇄下書きを切替"
              >
                <CheckCircle :size="13" />
                {{ selectedDoc.status === 'approved' ? '承認済み' : '下書き' }}
              </button>
              <span v-if="selectedDoc.status === 'approved' && selectedDoc.approvedBy" class="approver-tag">
                <User :size="13" />
                運営責任者：{{ selectedDoc.approvedBy }}
              </span>
            </div>
            <h2 class="detail-title">
              <template v-if="!isEditing">{{ selectedDoc.name }}</template>
              <template v-else>{{ editName || selectedDoc.name }}</template>
            </h2>
            <div class="date-bar">
              <span class="date-chip">{{ selectedDoc.originalRevisionDate || '原本改定日：未設定' }}</span>
              <span class="date-chip">{{ selectedDoc.reviewDate || '見直し日：未設定' }}</span>
            </div>

            <!-- 操作 -->
            <div class="detail-actions">
              <button v-if="!isEditing" class="btn-act btn-act-primary" @click="startEdit">
                <Edit :size="15" /> オンライン編集
              </button>
              <template v-else>
                <button class="btn-act" @click="saveContentOnly">
                  <Save :size="15" /> 内容のみ保存
                </button>
                <button class="btn-act btn-act-primary" @click="openRevisionModal">
                  <GitCommit :size="15" /> 改訂（履歴を記録）
                </button>
                <button class="btn-act btn-act-ghost" @click="cancelEdit">
                  <X :size="15" /> キャンセル
                </button>
              </template>
            </div>
          </div>

          <!-- 監査対応バナー -->
          <div v-if="selectedDoc.auditPoints && !isEditing" class="audit-banner">
            <AlertTriangle :size="18" class="audit-ico" />
            <div>
              <div class="audit-label">監査・レビュー対応ポイント</div>
              <div class="audit-text">{{ selectedDoc.auditPoints }}</div>
            </div>
          </div>

          <!-- 本文エリア -->
          <div class="body-area">
            <!-- 閲覧 -->
            <div v-if="!isEditing" class="body-display">{{ selectedDoc.text }}</div>

            <!-- 編集 -->
            <div v-else class="body-edit">
              <div class="meta-grid">
                <label class="fld">
                  <span>タイトル</span>
                  <input v-model="editName" class="input-organic" type="text" />
                </label>
                <label class="fld">
                  <span>原本改定日</span>
                  <input v-model="editOriginalRevisionDate" class="input-organic" type="text" placeholder="例：原本改定 2026年4月10日" />
                </label>
                <label class="fld">
                  <span>見直し日</span>
                  <input v-model="editReviewDate" class="input-organic" type="text" placeholder="例：次回見直し 2027年4月" />
                </label>
                <label class="fld fld-check">
                  <input v-model="applyDatesToAll" type="checkbox" />
                  <span>この日付を全章へ一括適用する</span>
                </label>
                <label class="fld fld-wide">
                  <span>概要</span>
                  <input v-model="editSummary" class="input-organic" type="text" />
                </label>
                <label class="fld fld-wide">
                  <span>監査・レビュー対応ポイント</span>
                  <textarea v-model="editAuditPoints" class="input-organic ta-small" rows="2"></textarea>
                </label>
              </div>
              <label class="fld fld-wide">
                <span>本文</span>
                <textarea v-model="editText" class="input-organic ta-body" placeholder="規定・手順の全文を入力してください…"></textarea>
              </label>
            </div>
          </div>

          <!-- 改訂履歴タイムライン -->
          <div class="history-section">
            <div class="history-head">
              <History :size="16" />
              <span>改訂履歴</span>
            </div>
            <div class="timeline">
              <div
                v-for="(h, idx) in (selectedDoc.history || [])"
                :key="idx"
                class="tl-item"
              >
                <div class="tl-dot"></div>
                <div class="tl-content">
                  <div class="tl-top">
                    <span class="tl-ver">{{ h.version }}</span>
                    <span class="tl-author"><span class="tl-avatar"><User :size="11" /></span>{{ h.author }}</span>
                    <span class="tl-date">{{ h.date }}</span>
                    <button class="tl-edit" @click="openHistoryEdit(idx)">
                      <Edit :size="12" /> 編集
                    </button>
                  </div>
                  <div class="tl-comment">{{ h.comment }}</div>
                </div>
              </div>
              <div v-if="!(selectedDoc.history && selectedDoc.history.length)" class="tl-empty">
                改訂履歴はまだありません
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 通知トースト ===== -->
    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="'toast-' + t.type">
        {{ t.message }}
      </div>
    </div>

    <!-- ===== モーダル(A) 改訂コミット ===== -->
    <teleport to="body">
      <div v-if="showRevisionModal" class="modal-backdrop" @click.self="showRevisionModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>改訂のコミット</h3>
            <button class="btn-close" @click="showRevisionModal = false"><X :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">新バージョン</label>
              <input v-model="revVersion" class="input-organic" type="text" placeholder="vX.Y.Z" />
            </div>
            <div class="form-group">
              <label class="form-label">承認責任者（運営責任者）</label>
              <input v-model="revApprover" class="input-organic" type="text" />
            </div>
            <div class="form-group">
              <label class="form-label">改訂理由 <span class="req">必須</span></label>
              <textarea v-model="revReason" class="input-organic ta-small" rows="3" placeholder="変更内容と理由を記載してください"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showRevisionModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="commitRevision">改訂を記録</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ===== モーダル(B) 履歴項目編集 ===== -->
    <teleport to="body">
      <div v-if="showHistoryModal" class="modal-backdrop" @click.self="showHistoryModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>改訂履歴の修正</h3>
            <button class="btn-close" @click="showHistoryModal = false"><X :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">バージョン</label>
              <input v-model="histVersion" class="input-organic" type="text" />
            </div>
            <div class="form-group">
              <label class="form-label">著者</label>
              <input v-model="histAuthor" class="input-organic" type="text" />
            </div>
            <div class="form-group">
              <label class="form-label">日付</label>
              <input v-model="histDate" class="input-organic" type="date" />
            </div>
            <div class="form-group">
              <label class="form-label">コメント</label>
              <textarea v-model="histComment" class="input-organic ta-small" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showHistoryModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="saveHistoryEdit">保存</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ===== モーダル(C) 新規文書登録 ===== -->
    <teleport to="body">
      <div v-if="showUploadModal" class="modal-backdrop" @click.self="showUploadModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>新規規定の登録</h3>
            <button class="btn-close" @click="showUploadModal = false"><X :size="18" /></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">タイトル <span class="req">必須</span></label>
              <input v-model="newName" class="input-organic" type="text" placeholder="例：教育・訓練規定" />
            </div>
            <div class="form-group">
              <label class="form-label">概要</label>
              <input v-model="newSummary" class="input-organic" type="text" />
            </div>
            <div class="form-group">
              <label class="form-label">監査・レビュー対応ポイント</label>
              <textarea v-model="newAuditPoints" class="input-organic ta-small" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">本文</label>
              <textarea v-model="newText" class="input-organic ta-body" placeholder="規定・手順の全文を入力してください…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showUploadModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="submitUpload">登録する</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ===== 印刷用（body直下へテレポート） ===== -->
    <Teleport to="body">
      <div class="doc-print-root">
        <!-- 全章一括 -->
        <template v-if="printMode === 'all'">
          <div class="print-cover">
            <div class="pc-sub">{{ state.restaurantInfo.name }}</div>
            <h1>規定・マニュアル管理ライブラリ</h1>
            <div class="pc-info">有機JAS認定番号：{{ state.restaurantInfo.certNumber }}</div>
            <div class="pc-info">印刷日：{{ new Date().toLocaleDateString('ja-JP') }}</div>
          </div>
          <div class="print-toc">
            <h2>目次</h2>
            <ol>
              <li v-for="(row, i) in allDocsFlat" :key="i">
                [{{ row.catTitle }}] {{ row.doc.name }}（{{ row.doc.version }}）
              </li>
            </ol>
          </div>
          <div v-for="(row, i) in allDocsFlat" :key="'p' + i" class="print-doc">
            <div class="print-doc-head">
              <span class="print-cat">{{ row.catTitle }}</span>
              <h2>{{ row.doc.name }}</h2>
              <span class="print-meta">{{ row.doc.version }} ／ {{ row.doc.date }} ／ {{ row.doc.status === 'approved' ? '承認済み（' + row.doc.approvedBy + '）' : '下書き' }}</span>
            </div>
            <div v-if="row.doc.auditPoints" class="print-audit">監査対応：{{ row.doc.auditPoints }}</div>
            <div class="print-body">{{ row.doc.text }}</div>
            <div class="print-history">
              <h3>改訂履歴</h3>
              <div v-for="(h, hi) in (row.doc.history || [])" :key="hi" class="print-h-item">
                {{ h.version }}｜{{ h.date }}｜{{ h.author }}：{{ h.comment }}
              </div>
            </div>
          </div>
        </template>

        <!-- 選択中のみ -->
        <template v-else-if="printMode === 'single' && printDoc">
          <div class="print-doc">
            <div class="print-doc-head">
              <span class="print-cat">{{ state.restaurantInfo.name }}</span>
              <h2>{{ printDoc.name }}</h2>
              <span class="print-meta">{{ printDoc.version }} ／ {{ printDoc.date }} ／ {{ printDoc.status === 'approved' ? '承認済み（' + printDoc.approvedBy + '）' : '下書き' }}</span>
            </div>
            <div v-if="printDoc.auditPoints" class="print-audit">監査対応：{{ printDoc.auditPoints }}</div>
            <div class="print-body">{{ printDoc.text }}</div>
            <div class="print-history">
              <h3>改訂履歴</h3>
              <div v-for="(h, hi) in (printDoc.history || [])" :key="hi" class="print-h-item">
                {{ h.version }}｜{{ h.date }}｜{{ h.author }}：{{ h.comment }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.lib-view {
  padding-bottom: 2rem;
}

/* グラスモーフィズム共通 */
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

/* ===== ヘッダー ===== */
.lib-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon {
  color: var(--primary);
  flex-shrink: 0;
}
.lib-header h2 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pro-badge {
  font-size: 0.6rem;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
}
.lib-header p {
  font-size: 0.82rem;
  color: var(--text-sub);
  margin: 0.25rem 0 0;
}
.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-head {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-head:hover:not(:disabled) {
  border-color: var(--primary-border);
  background: var(--primary-light);
}
.btn-head:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-head-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.btn-head-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  color: #fff;
}

/* ===== レイアウト ===== */
.lib-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
  align-items: start;
}
.left-pane {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding-right: 4px;
}

/* ===== 外部連携カード ===== */
.ext-card {
  border-radius: var(--radius-md);
  padding: 1rem;
  border-top: 3px solid var(--accent);
}
.ext-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.ext-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
}
.btn-sync {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent-border);
  background: var(--accent-light);
  color: var(--accent-hover);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-sync:disabled { opacity: 0.7; cursor: not-allowed; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ext-synced {
  font-size: 0.7rem;
  color: var(--text-light);
  margin-bottom: 0.6rem;
}
.ext-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.ext-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  border-radius: var(--radius-sm);
  background: var(--bg-sub);
  font-size: 0.75rem;
  color: var(--text-main);
}
.ext-link:hover { background: var(--primary-light); }
.link-type {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #fff;
}
.link-name { flex: 1; }
.link-size { flex-shrink: 0; color: var(--text-light); font-size: 0.68rem; }

.ann-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0.5rem 0.55rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--primary);
}
.ann-toggle .rotated { transform: rotate(-90deg); transition: transform 0.2s; }
.ann-list {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.ann-item {
  padding: 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
}
.ann-date { font-size: 0.66rem; color: var(--warning); font-weight: 700; }
.ann-title { font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin: 0.15rem 0; }
.ann-desc { font-size: 0.72rem; color: var(--text-sub); line-height: 1.5; }
.ann-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: var(--accent-hover);
  font-weight: 600;
}

/* ===== カテゴリ ===== */
.cat-block {
  border-radius: var(--radius-md);
  padding: 0.9rem;
}
.cat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.cat-head h3 {
  font-size: 0.9rem;
  margin: 0;
  color: var(--primary);
}
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary-border);
  background: var(--primary-light);
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-add:hover { background: var(--primary); color: #fff; }
.doc-cards { display: flex; flex-direction: column; gap: 0.55rem; }
.doc-card {
  padding: 0.7rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition);
}
.doc-card:hover { border-color: var(--primary-border); box-shadow: var(--shadow-sm); }
.doc-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
  background: var(--primary-light);
}
.card-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}
.doc-ico { color: var(--text-sub); }
.ver-badge {
  font-size: 0.62rem;
  font-weight: 700;
  font-family: var(--font-mono);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-full);
  background: var(--bg-sub);
  color: var(--text-sub);
}
.status-badge {
  margin-left: auto;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: var(--radius-full);
}
.status-badge.is-approved { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
.status-badge.is-draft { background: var(--bg-sub); color: var(--text-sub); border: 1px solid var(--border); }
.doc-name { font-size: 0.85rem; font-weight: 600; color: var(--text-main); }
.doc-summary { font-size: 0.72rem; color: var(--text-sub); margin-top: 0.15rem; line-height: 1.45; }
.card-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}
.meta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.66rem;
  color: var(--text-light);
}
.cat-empty { font-size: 0.74rem; color: var(--text-light); padding: 0.5rem; }

/* ===== 右ペイン ===== */
.right-pane { min-width: 0; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  border-radius: var(--radius-md);
  color: var(--text-sub);
}
.empty-icon { opacity: 0.3; margin-bottom: 1rem; }

.doc-detail {
  border-radius: var(--radius-md);
  padding: 1.75rem;
}
.detail-header {
  padding-bottom: 1.25rem;
  border-bottom: 2px solid var(--border);
}
.dh-tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}
.ver-tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #fff;
}
.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  border: 1px solid transparent;
}
.status-toggle.is-approved { background: var(--success-bg); color: var(--success); border-color: var(--success-border); }
.status-toggle.is-draft { background: var(--bg-sub); color: var(--text-sub); border-color: var(--border); }
.approver-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  background: var(--accent-light);
  color: var(--accent-hover);
  border: 1px solid var(--accent-border);
}
.detail-title {
  font-size: 1.5rem;
  margin: 0.25rem 0 0.7rem;
  color: var(--text-main);
}
.date-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.date-chip {
  font-size: 0.72rem;
  color: var(--text-sub);
  background: var(--bg-sub);
  border: 1px solid var(--border);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
}
.detail-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.btn-act {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.btn-act:hover { background: var(--bg-sub); }
.btn-act-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-act-primary:hover { background: var(--primary-hover); }
.btn-act-ghost { background: none; color: var(--text-sub); }

/* 監査バナー */
.audit-banner {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-left: 4px solid var(--warning);
}
.audit-ico { color: var(--warning); flex-shrink: 0; margin-top: 2px; }
.audit-label { font-size: 0.78rem; font-weight: 700; color: #78350f; }
.audit-text { font-size: 0.8rem; color: #78350f; line-height: 1.6; margin-top: 0.2rem; }

/* 本文 */
.body-area { margin-top: 1.25rem; }
.body-display {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.85;
  font-size: 0.92rem;
  color: var(--text-main);
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
}
.fld { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.78rem; font-weight: 600; color: var(--text-sub); }
.fld-wide { grid-column: 1 / -1; }
.fld-check {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-light);
  padding: 0.5rem 0.7rem;
  border-radius: var(--radius-sm);
  align-self: center;
}
.fld-check input { width: 16px; height: 16px; }
.ta-small { resize: vertical; font-family: var(--font-sans); }
.ta-body {
  min-height: 360px;
  resize: vertical;
  font-family: var(--font-mono);
  line-height: 1.7;
}

/* 履歴タイムライン */
.history-section { margin-top: 2rem; }
.history-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--primary);
  margin-bottom: 1rem;
}
.timeline { position: relative; padding-left: 1.25rem; }
.timeline::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: var(--border);
}
.tl-item { position: relative; padding-bottom: 1.1rem; }
.tl-dot {
  position: absolute;
  left: -1.25rem;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--bg-card);
}
.tl-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.tl-ver {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  color: var(--primary);
}
.tl-author {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-main);
}
.tl-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent-hover);
}
.tl-date { font-size: 0.72rem; color: var(--text-light); }
.tl-edit {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  color: var(--text-sub);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.15rem 0.4rem;
  cursor: pointer;
}
.tl-edit:hover { color: var(--primary); border-color: var(--primary-border); }
.tl-comment { font-size: 0.8rem; color: var(--text-sub); margin-top: 0.35rem; line-height: 1.6; }
.tl-empty { font-size: 0.78rem; color: var(--text-light); }

.req { font-size: 0.66rem; color: var(--danger); font-weight: 700; }

/* トースト */
.toast-stack {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 2000;
}
.toast {
  padding: 0.7rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.25s ease-out;
}
.toast-success { background: var(--success); }
.toast-warning { background: var(--warning); }
.toast-error { background: var(--danger); }
.toast-info { background: var(--primary); }

@media (max-width: 900px) {
  .lib-layout { grid-template-columns: 1fr; }
  .left-pane { max-height: none; }
  .meta-grid { grid-template-columns: 1fr; }
}
</style>

<!-- 印刷専用スタイル（非scoped: body直下のテレポート要素に適用） -->
<style>
.doc-print-root { display: none; }

@media print {
  body.doc-print-active #app { display: none !important; }
  body.doc-print-active .doc-print-root {
    display: block !important;
    padding: 0;
    color: #111;
    font-family: 'Noto Sans JP', sans-serif;
  }
  .doc-print-root .print-cover {
    text-align: center;
    padding: 5rem 2rem;
    page-break-after: always;
  }
  .doc-print-root .print-cover h1 { font-size: 2.2rem; margin: 1rem 0; color: #111; }
  .doc-print-root .pc-sub { font-size: 1rem; color: #555; }
  .doc-print-root .pc-info { font-size: 0.85rem; color: #777; margin-top: 0.4rem; }
  .doc-print-root .print-toc { page-break-after: always; padding: 1rem; }
  .doc-print-root .print-toc h2 { font-size: 1.4rem; border-bottom: 2px solid #111; padding-bottom: 0.4rem; }
  .doc-print-root .print-toc ol { line-height: 2; font-size: 0.95rem; }
  .doc-print-root .print-doc { page-break-inside: avoid; page-break-before: always; padding: 1rem; }
  .doc-print-root .print-doc:first-child { page-break-before: avoid; }
  .doc-print-root .print-cat { font-size: 0.8rem; color: #777; }
  .doc-print-root .print-doc-head h2 { font-size: 1.5rem; margin: 0.3rem 0; color: #111; border-bottom: 2px solid #111; padding-bottom: 0.4rem; }
  .doc-print-root .print-meta { font-size: 0.8rem; color: #555; }
  .doc-print-root .print-audit {
    margin: 0.8rem 0;
    padding: 0.6rem 0.8rem;
    border-left: 4px solid #d97706;
    background: #fffbeb;
    font-size: 0.85rem;
  }
  .doc-print-root .print-body {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.8;
    font-size: 0.92rem;
    margin: 1rem 0;
  }
  .doc-print-root .print-history { margin-top: 1.2rem; border-top: 1px dashed #999; padding-top: 0.6rem; }
  .doc-print-root .print-history h3 { font-size: 1rem; color: #111; }
  .doc-print-root .print-h-item { font-size: 0.8rem; color: #444; line-height: 1.7; }
}
</style>
