const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'App.vue');
let c = fs.readFileSync(targetPath, 'utf8');

const searchTag = `<SettingsView v-else-if="currentTab === 'settings'" />`;
const replaceTag = `<SettingsView v-else-if="currentTab === 'settings'" />
          <ProcurementPlanView v-else-if="currentTab === 'procurement'" />`;

if (c.includes(searchTag) && !c.includes('<ProcurementPlanView v-else-if')) {
  c = c.replace(searchTag, replaceTag);
}

const breadcrumbSearch = `currentTab === 'settings' ? '店舗設定' : 'ホーム'`;
const breadcrumbReplace = `currentTab === 'settings' ? '店舗設定' :
              currentTab === 'procurement' ? '食材調達計画' : 'ホーム'`;

if (c.includes(breadcrumbSearch)) {
  c = c.replace(breadcrumbSearch, breadcrumbReplace);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('App.vue fixed.');
