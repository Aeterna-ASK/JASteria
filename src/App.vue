<script setup>
import { computed, watchEffect, ref } from 'vue';
import { restaurantStore } from './store/restaurantStore';

// ビューコンポーネントのインポート
import DashboardView from './components/DashboardView.vue';
import IngredientsView from './components/IngredientsView.vue';
import MenusView from './components/MenusView.vue';
import ReceiptsView from './components/ReceiptsView.vue';
import CookingLogsView from './components/CookingLogsView.vue';
import CleaningLogsView from './components/CleaningLogsView.vue'; // 新規追加
import AuditView from './components/AuditView.vue';             // 新規追加
import ManualView from './components/ManualView.vue';           // 新規追加
import SettingsView from './components/SettingsView.vue';
import ProcurementPlanView from './components/ProcurementPlanView.vue';
import ScanInboxView from './components/ScanInboxView.vue';     // 新規追加：スキャン受信箱
import AuditDocsView from './components/AuditDocsView.vue';     // 新規追加：監査ドキュメントセンター

// Lucide アイコン
import {
  LayoutDashboard,
  CalendarRange,
  Sprout,
  FileText,
  TrendingUp,
  CheckCircle,
  Settings,
  Award,
  AlertTriangle,
  User,
  LogOut,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Inbox,
  FolderArchive,
  Menu as MenuIcon,
  X
} from 'lucide-vue-next';

const state = restaurantStore.state;
const stats = computed(() => restaurantStore.dashboardStats);

const currentTab = computed(() => state.activeTab);

// 未確認スキャンドキュメント数のカウント
const inboxDocsCount = computed(() => (state.t_inbox_documents || []).length);

const setTab = (tabName) => {
  restaurantStore.setTab(tabName);
  drawerOpen.value = false;
};

// スマホ用ドロワー
const drawerOpen = ref(false);

// ボトムナビ（主要5項目）
const bottomNavItems = [
  { tab: 'dashboard',    icon: LayoutDashboard, label: 'ホーム' },
  { tab: 'menus',        icon: FileText,        label: 'レシピ' },
  { tab: 'cookingLogs',  icon: CheckCircle,     label: '調理点検' },
  { tab: 'receipts',     icon: TrendingUp,      label: '仕入点検' },
  { tab: '_more',        icon: MenuIcon,        label: 'その他' },
];

// ページタイトル
const pageTitle = computed(() => {
  const map = {
    dashboard: 'ダッシュボード', ingredients: '原材料マスター',
    menus: 'レシピ・メニュー', scanInbox: 'スキャン受信箱',
    auditDocs: '監査ドキュメント', receipts: '仕入・受入点検',
    cookingLogs: '調理・提供点検', cleaningLogs: '衛生・清掃点検',
    auditView: 'JAS審査員ポータル', manual: 'マニュアル', settings: '認証店舗設定', procurement: '食材調達計画'
  };
  return map[state.activeTab] || '';
});

// 初期化完了後にFirestore同期を開始
watchEffect(() => {
  if (state.initialized) {
    restaurantStore.initFirestoreSync();
  }
});
</script>

<template>
  <div class="app-layout">
    <!-- サイドバーナビゲーション (プレミアムな木調オリーチE -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo pulse-soft" style="background: none; box-shadow: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <img src="/logo.png" alt="JASteria Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.2);" />
        </div>
        <div class="brand-text">
          <span class="brand-title">JASteria</span>
          <span class="brand-subtitle">有機JAS外食監査アシスト</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li>
            <button 
              :class="['nav-item', currentTab === 'dashboard' ? 'active' : '']" 
              @click="setTab('dashboard')"
            >
              <LayoutDashboard :size="18" />
              <span>ダッシュボード</span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'procurement' ? 'active' : '']" 
              @click="setTab('procurement')"
            >
              <CalendarRange :size="18" />
              <span>食材調達計画</span>
            </button>
            <button 
              :class="['nav-item', currentTab === 'ingredients' ? 'active' : '']" 
              @click="setTab('ingredients')"
            >
              <Sprout :size="18" />
              <span>原材料マスター</span>
              <!-- 証明書警告がある場合、バッジを表示 (UX Safety) -->
              <span v-if="stats.certAlertsCount > 0" class="nav-badge badge-danger">
                {{ stats.certAlertsCount }}
              </span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'menus' ? 'active' : '']" 
              @click="setTab('menus')"
            >
              <FileText :size="18" />
              <span>レシピ・メニュー</span>
              <!-- 有機割合不整合がある場合、警告バッジを表示 (UX Safety) -->
              <span v-if="stats.hasDiscrepancy" class="nav-badge badge-warning">
                !
              </span>
            </button>
          </li>
          <li class="nav-divider">点検記録簿</li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'scanInbox' ? 'active' : '']" 
              @click="setTab('scanInbox')"
            >
              <Inbox :size="18" />
              <span>スキャン受信箱</span>
              <span v-if="inboxDocsCount > 0" class="nav-badge badge-danger">
                {{ inboxDocsCount }}
              </span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'auditDocs' ? 'active' : '']" 
              @click="setTab('auditDocs')"
            >
              <FolderArchive :size="18" />
              <span>監査ドキュメント</span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'receipts' ? 'active' : '']" 
              @click="setTab('receipts')"
            >
              <TrendingUp :size="18" />
              <span>仕入・受入点検</span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'cookingLogs' ? 'active' : '']" 
              @click="setTab('cookingLogs')"
            >
              <CheckCircle :size="18" />
              <span>調理・提供点検</span>
            </button>
          </li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'cleaningLogs' ? 'active' : '']" 
              @click="setTab('cleaningLogs')"
            >
              <ClipboardCheck :size="18" />
              <span>衛生・清掃点検</span>
            </button>
          </li>
          <li class="nav-divider" v-show="false">JAS監査検証</li>
          <li v-show="false">
            <button
              :class="['nav-item', currentTab === 'auditView' ? 'active' : '']"
              @click="setTab('auditView')"
            >
              <ShieldCheck :size="18" class="text-accent" />
              <span class="font-semibold text-accent">JAS審査員ポータル</span>
            </button>
          </li>
          <li>
            <button
              :class="['nav-item', currentTab === 'manual' ? 'active' : '']"
              @click="setTab('manual')"
            >
              <BookOpen :size="18" />
              <span>マニュアル</span>
            </button>
          </li>
          <li class="nav-divider">管理設定</li>
          <li>
            <button 
              :class="['nav-item', currentTab === 'settings' ? 'active' : '']" 
              @click="setTab('settings')"
            >
              <Settings :size="18" />
              <span>認証店舗設定</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- ユーザーフッター -->
      <div class="sidebar-footer">
        <div class="user-avatar">
          <User :size="16" />
        </div>
        <div class="user-info">
          <span class="user-name">{{ state.restaurantInfo.manager }}</span>
          <span class="user-role">運営責任者</span>
        </div>
      </div>
    </aside>

    <!-- ===== スマホ用モバイルヘッダー ===== -->
    <header class="mobile-header">
      <div class="mobile-header-inner">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <img src="/logo.png" style="width:30px;height:30px;border-radius:50%;object-fit:contain;" />
          <span style="font-weight:700;font-size:1rem;color:#fff;">JASteria</span>
        </div>
        <span style="font-size:0.85rem;font-weight:600;color:rgba(255,255,255,0.85);">{{ pageTitle }}</span>
        <div style="width:30px;"></div>
      </div>
    </header>

    <!-- ===== スマホ用ドロワー（その他メニュー） ===== -->
    <transition name="drawer">
      <div v-if="drawerOpen" class="drawer-backdrop" @click="drawerOpen=false">
        <div class="drawer-panel" @click.stop>
          <div class="drawer-header">
            <span style="font-weight:700;font-size:1rem;">メニュー</span>
            <button @click="drawerOpen=false" style="background:none;border:none;cursor:pointer;color:#5c3d2e;"><X :size="20"/></button>
          </div>
          <nav class="drawer-nav">
            <button @click="setTab('procurement')" :class="['drawer-item', currentTab==='procurement'?'active':'']">
              <CalendarRange :size="18"/> 食材調達計画
            </button>
            <button @click="setTab('ingredients')" :class="['drawer-item', currentTab==='ingredients'?'active':'']">
              <Sprout :size="18"/> 原材料マスター
              <span v-if="stats.certAlertsCount>0" class="nav-badge badge-danger ml-auto">{{stats.certAlertsCount}}</span>
            </button>
            <button @click="setTab('scanInbox')" :class="['drawer-item', currentTab==='scanInbox'?'active':'']">
              <Inbox :size="18"/> スキャン受信箱
              <span v-if="inboxDocsCount>0" class="nav-badge badge-danger ml-auto">{{inboxDocsCount}}</span>
            </button>
            <button @click="setTab('auditDocs')" :class="['drawer-item', currentTab==='auditDocs'?'active':'']">
              <FolderArchive :size="18"/> 監査ドキュメント
            </button>
            <button @click="setTab('cleaningLogs')" :class="['drawer-item', currentTab==='cleaningLogs'?'active':'']">
              <ClipboardCheck :size="18"/> 衛生・清掃点検
            </button>
            <button v-show="false" @click="setTab('auditView')" :class="['drawer-item', currentTab==='auditView'?'active':'']">
              <ShieldCheck :size="18"/> JAS審査員ポータル
            </button>
            <button @click="setTab('manual')" :class="['drawer-item', currentTab==='manual'?'active':'']">
              <BookOpen :size="18"/> マニュアル
            </button>
            <button @click="setTab('settings')" :class="['drawer-item', currentTab==='settings'?'active':'']">
              <Settings :size="18"/> 認証店舗設定
            </button>
          </nav>
          <div class="drawer-footer">
            <User :size="14"/>
            <span>{{ state.restaurantInfo.manager }}</span>
            <span style="font-size:0.7rem;color:#8c786c;">運営責任者</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- メインコンテンツエリア -->
    <div class="main-area">
      <!-- トップヘッダー -->
      <header class="top-header">
        <div class="header-breadcrumb">
          <span class="root-path">JASteria システム</span>
          <span class="path-separator">/</span>
          <span class="current-path font-semibold">
            {{
              currentTab === 'dashboard' ? 'ダッシュボード' :
              currentTab === 'ingredients' ? '原材料マスター' :
              currentTab === 'menus' ? 'レシピ・メニュー管理' :
              currentTab === 'scanInbox' ? 'スキャン受信箱' :
              currentTab === 'auditDocs' ? '監査ドキュメントセンター' :
              currentTab === 'receipts' ? '仕入・受入点検記録' :
              currentTab === 'cookingLogs' ? '調理・提供点検記録' :
              currentTab === 'cleaningLogs' ? '衛生・清掃点検記録' :
              currentTab === 'auditView' ? 'JAS審査官ポータル' :
              currentTab === 'manual' ? 'マニュアル' : '店舗設定'
            }}
          </span>
        </div>

        <div class="header-actions">
          <div class="store-badge">
            <Award :size="16" class="text-accent" />
            <span class="store-name font-medium">{{ state.restaurantInfo.name }}</span>
          </div>
        </div>
      </header>

      <!-- ビュー表示ポート -->
      <main class="content-container">
        <div class="container py-6">
          <DashboardView v-if="currentTab === 'dashboard'" />
          <IngredientsView v-else-if="currentTab === 'ingredients'" />
          <MenusView v-else-if="currentTab === 'menus'" />
          <ScanInboxView v-else-if="currentTab === 'scanInbox'" />
          <AuditDocsView v-else-if="currentTab === 'auditDocs'" />
          <ReceiptsView v-else-if="currentTab === 'receipts'" />
          <CookingLogsView v-else-if="currentTab === 'cookingLogs'" />
          <CleaningLogsView v-else-if="currentTab === 'cleaningLogs'" />
          <AuditView v-else-if="currentTab === 'auditView'" />
          <ManualView v-else-if="currentTab === 'manual'" />
          <SettingsView v-else-if="currentTab === 'settings'" />
          <ProcurementPlanView v-else-if="currentTab === 'procurement'" />
        </div>
      </main>
    </div>
  </div>

  <!-- ===== スマホ用ボトムナビゲーション ===== -->
  <nav class="bottom-nav">
    <template v-for="item in bottomNavItems" :key="item.tab">
      <button
        v-if="item.tab !== '_more'"
        :class="['bottom-nav-item', currentTab===item.tab ? 'active' : '']"
        @click="setTab(item.tab)"
      >
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
        <span v-if="item.tab==='menus' && stats.hasDiscrepancy" class="bottom-badge">!</span>
        <span v-if="item.tab==='receipts' && stats.certAlertsCount>0" class="bottom-badge">{{stats.certAlertsCount}}</span>
      </button>
      <button v-else class="bottom-nav-item" @click="drawerOpen=true">
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
        <span v-if="inboxDocsCount>0" class="bottom-badge">{{inboxDocsCount}}</span>
      </button>
    </template>
  </nav>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* サイドバー */
.sidebar {
  width: 260px;
  background-color: var(--primary); /* オリーブグリーン */
  color: #ffffff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid var(--primary-border);
  box-shadow: 4px 0 20px rgba(45, 74, 52, 0.08);
  z-index: 50;
}

.sidebar-brand {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-logo {
  background-color: var(--accent); /* 木目アンバー */
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(180, 83, 9, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 500;
  margin-top: 0.125rem;
}

.sidebar-nav {
  flex-grow: 1;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.925rem;
  text-align: left;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.nav-item.active {
  background-color: var(--accent); /* アンバーにハイライト */
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25);
}

.nav-divider {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.nav-badge {
  margin-left: auto;
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  line-height: 1;
}

/* ユーザーフッター */
.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
}

.user-role {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

/* メメインエリア */
.main-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* フレックス縮小を許可 */
}

/* トップヘッダー */
.top-header {
  height: 64px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-sub);
}

.path-separator {
  color: var(--text-light);
}

.current-path {
  color: var(--primary);
}

.store-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-sub);
  border: 1px solid var(--border);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.825rem;
}

.store-name {
  color: var(--primary);
}

/* コンテンツ表示エリア */
.content-container {
  flex-grow: 1;
  overflow-y: auto;
}

.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.font-semibold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

/* ============================================================
   スマホ用モバイルUI (≤768px) — PC表示は一切変更しない
   ============================================================ */

/* モバイルヘッダー・ボトムナビ・ドロワー: PCでは完全非表示 */
.mobile-header,
.bottom-nav,
.drawer-backdrop {
  display: none;
}

@media (max-width: 768px) {
  /* サイドバー・PCトップヘッダーを隠す */
  .sidebar { display: none; }
  .top-header { display: none; }

  /* レイアウトをフルスクリーン縦積みに */
  .app-layout {
    flex-direction: column;
  }
  .main-area {
    padding-top: 52px;   /* モバイルヘッダー分 */
    padding-bottom: 60px; /* ボトムナビ分 */
  }
  .content-container {
    height: calc(100dvh - 52px - 60px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .container {
    padding: 0.75rem !important;
  }

  /* モバイルヘッダー */
  .mobile-header {
    display: block;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 52px;
    background: var(--primary, #1c3a27);
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .mobile-header-inner {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
  }

  /* ボトムナビ */
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: #fff;
    border-top: 1px solid #e2e8f0;
    z-index: 200;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
  }
  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.6rem;
    font-weight: 600;
    color: #94a3b8;
    position: relative;
    transition: color 0.15s;
    padding: 4px 0;
    -webkit-tap-highlight-color: transparent;
  }
  .bottom-nav-item.active {
    color: var(--primary, #1c3a27);
  }
  .bottom-nav-item.active svg {
    color: var(--accent, #b45309);
  }
  .bottom-badge {
    position: absolute;
    top: 4px; right: calc(50% - 18px);
    background: #ef4444;
    color: #fff;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 9999px;
    min-width: 14px;
    text-align: center;
    line-height: 1.4;
  }

  /* ドロワー */
  .drawer-backdrop {
    display: flex;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 300;
    align-items: flex-end;
  }
  .drawer-panel {
    width: 100%;
    background: #fff;
    border-radius: 16px 16px 0 0;
    padding: 0 0 env(safe-area-inset-bottom, 0) 0;
    max-height: 80dvh;
    overflow-y: auto;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }
  .drawer-nav {
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .drawer-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 0.75rem;
    border: none;
    border-radius: 8px;
    background: none;
    font-size: 0.95rem;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
  }
  .drawer-item.active {
    background: #f0fdf4;
    color: var(--primary, #1c3a27);
    font-weight: 700;
  }
  .drawer-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem 1rem;
    border-top: 1px solid #f1f5f9;
    font-size: 0.8rem;
    color: #475569;
  }
  .ml-auto { margin-left: auto; }
}

/* ドロワーアニメーション */
.drawer-enter-active, .drawer-leave-active {
  transition: opacity 0.2s;
}
.drawer-enter-active .drawer-panel, .drawer-leave-active .drawer-panel {
  transition: transform 0.25s cubic-bezier(0.32,0.72,0,1);
}
.drawer-enter-from, .drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel {
  transform: translateY(100%);
}
</style>
