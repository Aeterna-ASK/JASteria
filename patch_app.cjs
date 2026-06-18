const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'App.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// 1. Add import for ProcurementPlanView
if (!c.includes('ProcurementPlanView.vue')) {
  c = c.replace(
    "import SettingsView from './components/SettingsView.vue';",
    "import SettingsView from './components/SettingsView.vue';\nimport ProcurementPlanView from './components/ProcurementPlanView.vue';"
  );
}

// 2. Add icon import (CalendarRange)
if (!c.includes('CalendarRange')) {
  c = c.replace(
    "import {\n  LayoutDashboard,",
    "import {\n  LayoutDashboard,\n  CalendarRange,"
  );
}

// 3. Add title map
if (c.includes("settings: '認証店舗設定'")) {
  c = c.replace(
    "settings: '認証店舗設定'",
    "settings: '認証店舗設定', procurement: '食材調達計画'"
  );
}

// 4. Add the component rendering in the <main> block
if (!c.includes('<ProcurementPlanView v-if="currentTab === \'procurement\'" />')) {
  c = c.replace(
    '<SettingsView v-if="currentTab === \'settings\'" />',
    '<SettingsView v-if="currentTab === \'settings\'" />\n          <ProcurementPlanView v-if="currentTab === \'procurement\'" />'
  );
}

// 5. Add sidebar link
const sidebarLinkRegex = /<li :class="\['nav-item', currentTab === 'ingredients' \? 'active' : ''\]" @click="setTab\('ingredients'\)">\s*<Sprout :size="20" \/>\s*<span>原材料マスター<\/span>\s*<\/li>/;
if (c.match(sidebarLinkRegex) && !c.includes("setTab('procurement')")) {
  const replacement = `<li :class="['nav-item', currentTab === 'procurement' ? 'active' : '']" @click="setTab('procurement')">
            <CalendarRange :size="20" />
            <span>食材調達計画</span>
          </li>
          <li :class="['nav-item', currentTab === 'ingredients' ? 'active' : '']" @click="setTab('ingredients')">
            <Sprout :size="20" />
            <span>原材料マスター</span>
          </li>`;
  c = c.replace(sidebarLinkRegex, replacement);
}

// Mobile drawer link
const drawerLinkRegex = /<li :class="\['nav-item', currentTab === 'ingredients' \? 'active' : ''\]" @click="setTab\('ingredients'\)">\s*<Sprout :size="20" \/>\s*<span>原材料マスター<\/span>\s*<\/li>/g;
const matches = [...c.matchAll(drawerLinkRegex)];
if (matches.length > 1) {
    const replacement = `<li :class="['nav-item', currentTab === 'procurement' ? 'active' : '']" @click="setTab('procurement')">
            <CalendarRange :size="20" />
            <span>食材調達計画</span>
          </li>
          <li :class="['nav-item', currentTab === 'ingredients' ? 'active' : '']" @click="setTab('ingredients')">
            <Sprout :size="20" />
            <span>原材料マスター</span>
          </li>`;
    c = c.replace(matches[1][0], replacement);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('App.vue updated successfully.');
