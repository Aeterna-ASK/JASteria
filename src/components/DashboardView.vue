<script setup>
import { computed } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  Sprout, 
  Award, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Plus, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check
} from 'lucide-vue-next';

const state = restaurantStore.state;
const stats = computed(() => restaurantStore.dashboardStats);
const recentReceipts = computed(() => restaurantStore.decodedReceipts.slice(0, 5));
const recentCookingLogs = computed(() => restaurantStore.decodedCookingLogs.slice(0, 5));


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

const upcomingDeadlines = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // within 30 days
  futureDate.setHours(0, 0, 0, 0);
  
  return state.menus.filter(m => {
    if (m.isActiveVersion === false) return false;
    if (!m.reviewDate) return false;
    
    // Check if achieved
    if (m.deadline) {
      const deadlineDate = parseDateString(m.deadline);
      if (deadlineDate && !isNaN(deadlineDate.getTime())) {
        deadlineDate.setHours(0, 0, 0, 0);
        if (deadlineDate < today) return false; // Already achieved
      }
    }

    const d = parseDateString(m.reviewDate);
    if (!d || isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d <= futureDate; // 過去（超過）も含める
  }).sort((a, b) => (parseDateString(a.reviewDate) || new Date(0)) - (parseDateString(b.reviewDate) || new Date(0)));
});

const achievedMenus = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return state.menus.filter(m => {
    if (m.isActiveVersion === false) return false;
    if (!m.deadline) return false;
    const d = parseDateString(m.deadline);
    if (!d || isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d < today;
  }).sort((a, b) => (parseDateString(b.deadline) || new Date(0)) - (parseDateString(a.deadline) || new Date(0))).slice(0, 10);
});

const handleCloneAchievedMenu = (menu) => {
  restaurantStore.setTargetMenuToClone(menu);
  setTab('menus');
};

const setTab = (tab) => {
  restaurantStore.setTab(tab);
};
</script>

<template>
  <div class="animate-fade-in">
    <!-- ヘッダーバナー -->
    <div class="dashboard-banner mb-6">
      <div class="banner-content">
        <span class="badge badge-success mb-2 pulse-soft">
          <ShieldCheck :size="12" /> 有機JAS格付・生産行程管理
        </span>
        <h2>{{ state.restaurantInfo.name }}</h2>
        <p class="text-sub flex items-center gap-1 mt-1">
          <MapPin :size="14" /> {{ state.restaurantInfo.address }}
        </p>
      </div>
      <div class="banner-badge">
        <Award class="accent-icon" :size="48" />
        <div>
          <span class="cert-label">JAS認証番号</span>
          <span class="cert-number">{{ state.restaurantInfo.certNumber }}</span>
        </div>
      </div>
    </div>

    <!-- 警告・アラート (UX Safety) -->
    <div v-if="stats.certAlertsCount > 0 || stats.hasDiscrepancy" class="dashboard-alerts mb-6">
      <!-- 証明書期限アラート -->
      <div v-for="alert in stats.certAlerts" :key="alert.id" class="alert alert-danger">
        <AlertTriangle class="text-danger shrink-0" :size="20" />
        <div>
          <strong>有機JAS証明書の期限切れ警告:</strong>
          「{{ alert.name }}」のJAS証明書が
          <span v-if="alert.isExpired" class="font-bold text-red-700">すでに期限切れです（期限: {{ alert.expiry }}）</span>
          <span v-else class="font-bold text-amber-700">残り {{ alert.daysLeft }} 日で期限が切れます（期限: {{ alert.expiry }}）</span>。
          仕入先への最新証明書の請求・更新を行ってください。
        </div>
      </div>

      <!-- 有機割合不整合アラート -->
      <div v-if="stats.hasDiscrepancy" class="alert alert-warning">
        <AlertTriangle class="text-warning shrink-0" :size="20" />
        <div>
          <strong>有機表示の不整合警告 ({{ stats.discrepancyCount }}件):</strong>
          「有機」メニューとして提供設定されている料理のうち、レシピ変更や原材料変更によって
          <strong>有機割合が95%を下回っているメニューがあります。</strong>
          表示の是正、またはレシピの再調整を行ってください。
        </div>
      </div>
    </div>

    <!-- メイン統計カード -->
    <div class="grid-cols-4 mb-6">
      <div class="card card-primary stat-card" @click="setTab('ingredients')">
        <div class="stat-icon bg-primary-light text-primary">
          <Sprout :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">原材料マスター</span>
          <span class="stat-value">{{ stats.totalIngredients }}<span class="unit">品目</span></span>
          <span class="stat-sub">うち有機JAS: {{ stats.organicIngredients }} 品目 ({{ stats.organicRatioOfIngredients }}%)</span>
        </div>
      </div>

      <div class="card card-accent stat-card" @click="setTab('menus')">
        <div class="stat-icon bg-accent-light text-accent">
          <FileText :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">登録レシピ・メニュー</span>
          <span class="stat-value">{{ stats.totalMenus }}<span class="unit">品</span></span>
          <span class="stat-sub">JAS適合(有機95%以上): {{ stats.compliantMenus }} 品</span>
        </div>
      </div>

      <div class="card stat-card" @click="setTab('receipts')">
        <div class="stat-icon bg-blue-50 text-blue-600">
          <TrendingUp :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">当月の仕入受入</span>
          <span class="stat-value">{{ state.receipts.length }}<span class="unit">件</span></span>
          <span class="stat-sub">受入点検100%実施中</span>
        </div>
      </div>

      <div class="card stat-card" @click="setTab('cookingLogs')">
        <div class="stat-icon bg-green-50 text-green-600">
          <CheckCircle :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">当月の調理・提供記録</span>
          <span class="stat-value">{{ state.cookingLogs.length }}<span class="unit">件</span></span>
          <span class="stat-sub">ロット追跡・洗浄確認済</span>
        </div>
      </div>
    </div>

    <!-- 目標達成状況 -->
    <div class="grid-cols-2 mb-6">
      <!-- 見直し期限間近 -->
      <div class="card">
        <div class="card-header-flex mb-4">
          <h3 class="flex items-center gap-2" style="color: #d97706;"><AlertTriangle :size="18" /> 見直し期限間近のメニュー</h3>
          <button class="btn-text flex items-center gap-1" @click="setTab('menus')">
            レシピ管理へ <ArrowRight :size="14" />
          </button>
        </div>
        <div v-if="upcomingDeadlines.length === 0" class="empty-state">
          期限間近のメニューはありません。
        </div>
        <div v-else class="activity-list">
          <div v-for="menu in upcomingDeadlines" :key="menu.id" class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background-color 0.2s;" @click="handleCloneAchievedMenu(menu)" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            <div>
              <span style="font-weight: 600; font-size: 0.85rem; color: #0284c7;">{{ menu.name }}</span>
              <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">(見直し期限: {{ menu.reviewDate }})</span>
            </div>
            <span class="badge" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;">間近</span>
          </div>
        </div>
      </div>

      <!-- 達成済み -->
      <div class="card">
        <div class="card-header-flex mb-4">
          <h3 class="flex items-center gap-2" style="color: #16a34a;"><CheckCircle :size="18" /> 達成済みのメニュー</h3>
          <button class="btn-text flex items-center gap-1" @click="setTab('menus')">
            レシピ管理へ <ArrowRight :size="14" />
          </button>
        </div>
        <div v-if="achievedMenus.length === 0" class="empty-state">
          達成済みのメニューはありません。
        </div>
        <div v-else class="activity-list">
          <div v-for="menu in achievedMenus" :key="menu.id" class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background-color 0.2s;" @click="handleCloneAchievedMenu(menu)" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            <div>
              <span style="font-weight: 600; font-size: 0.85rem; color: #0284c7;">{{ menu.name }}</span>
              <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">(達成期限: {{ menu.deadline }})</span>
            </div>
            <span class="badge" style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; display: inline-flex; align-items: center; gap: 4px;">
              <Check :size="12" /> 達成完了
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下段グリッド: アクティビティログ -->
    <div class="grid-cols-2">
      <!-- 最近の仕入受入記録 -->
      <div class="card">
        <div class="card-header-flex mb-4">
          <h3 class="flex items-center gap-2"><TrendingUp :size="18" /> 最近の仕入受入点検記録</h3>
          <button class="btn-text flex items-center gap-1" @click="setTab('receipts')">
            一覧表示 <ArrowRight :size="14" />
          </button>
        </div>
        <div v-if="recentReceipts.length === 0" class="empty-state">
          仕入受入記録がありません。
        </div>
        <div v-else class="activity-list">
          <div v-for="rec in recentReceipts" :key="rec.id" class="activity-item">
            <div class="activity-meta">
              <span class="activity-date">{{ rec.date }}</span>
              <span :class="['badge', rec.ingredientType === 'organic' ? 'badge-success' : 'badge-neutral']">
                {{ rec.ingredientType === 'organic' ? '有機' : '一般' }}
              </span>
            </div>
            <div class="activity-detail">
              <div class="activity-title">{{ rec.ingredientName }} <span class="text-sub font-mono">({{ rec.lotNumber }})</span></div>
              <div class="activity-sub">
                点検者: {{ rec.checkedBy }} | 数量: {{ rec.quantity }} kg |
                <span class="inline-flex gap-2">
                  <span :class="rec.isSeparated ? 'text-green-700' : 'text-red-600'">
                    {{ rec.isSeparated ? '✓分別' : '✗混入懸念' }}
                  </span>
                  <span v-if="rec.ingredientType === 'organic'" :class="rec.hasJasLabelVerified ? 'text-green-700' : 'text-red-600'">
                    {{ rec.hasJasLabelVerified ? '✓格付確認' : '✗JAS無' }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近の調理記録 -->
      <div class="card">
        <div class="card-header-flex mb-4">
          <h3 class="flex items-center gap-2"><CheckCircle :size="18" /> 最近の調理・提供記録</h3>
          <button class="btn-text flex items-center gap-1" @click="setTab('cookingLogs')">
            一覧表示 <ArrowRight :size="14" />
          </button>
        </div>
        <div v-if="recentCookingLogs.length === 0" class="empty-state">
          調理記録がありません。
        </div>
        <div v-else class="activity-list">
          <div v-for="log in recentCookingLogs" :key="log.id" class="activity-item">
            <div class="activity-meta">
              <span class="activity-date">{{ log.date }}</span>
              <span class="badge badge-success">提供</span>
            </div>
            <div class="activity-detail">
              <div class="activity-title">{{ log.menuName }} <span class="text-accent font-semibold">{{ log.quantity }}食</span></div>
              <div class="activity-sub">
                確認者: {{ log.checkedBy }} | 
                <span :class="log.isUtensilsClean ? 'text-green-700' : 'text-red-600'">
                  {{ log.isUtensilsClean ? '✓器具都度洗浄済' : '✗洗浄未確認' }}
                </span> |
                <span :class="log.isIngredientVerified ? 'text-green-700' : 'text-red-600'">
                  {{ log.isIngredientVerified ? '✓ロット一致確認済' : '✗ロット未確認' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-banner {
  background: linear-gradient(135deg, #fdfbf7 0%, #f5eedf 100%);
  border: 1px solid var(--border);
  border-left: 6px solid var(--primary);
  border-radius: var(--radius-md);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.banner-content h2 {
  margin: 0;
  color: var(--primary);
  font-size: 1.8rem;
  font-weight: 700;
}

.banner-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--bg-card);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.accent-icon {
  color: var(--accent);
}

.cert-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-sub);
  text-transform: uppercase;
}

.cert-number {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-main);
  font-size: 1.1rem;
}

/* 統計カード */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 1.25rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.825rem;
  color: var(--text-sub);
  font-weight: 500;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
  margin: 0.125rem 0;
}

.stat-value .unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-sub);
  margin-left: 0.125rem;
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--text-light);
}

/* カードヘッダー */
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-flex h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  color: var(--primary);
}

/* アクティビティリスト */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--border);
}

.activity-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  width: 90px;
  flex-shrink: 0;
}

.activity-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-sub);
}

.activity-detail {
  flex-grow: 1;
}

.activity-title {
  font-size: 0.925rem;
  font-weight: 500;
}

.activity-sub {
  font-size: 0.75rem;
  color: var(--text-sub);
  margin-top: 0.125rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 0.9rem;
}

.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.flex { display: flex; }
.items-center { align-items: center; }
.shrink-0 { flex-shrink: 0; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-mono { font-family: var(--font-mono); }

/* ブルースタイル (仕入用) */
.bg-blue-50 { background-color: #eff6ff; }
.text-blue-600 { color: #2563eb; }
/* グリーンスタイル (調理用) */
.bg-green-50 { background-color: #f0fdf4; }
.text-green-600 { color: #16a34a; }

@media (max-width: 1024px) {
  .dashboard-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
