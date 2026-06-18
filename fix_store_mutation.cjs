const fs = require('fs');
const path = require('path');

const storePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let s = fs.readFileSync(storePath, 'utf8');

if (!s.includes('function setTargetMenuToClone')) {
    s = s.replace(
        'function setTab(tabName) {',
        `function setTargetMenuToClone(menu) {
  state.targetMenuToClone = menu;
}

function setTab(tabName) {`
    );
    s = s.replace(
        'setTab,',
        'setTab,\n  setTargetMenuToClone,'
    );
    fs.writeFileSync(storePath, s, 'utf8');
}

const dashboardPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'DashboardView.vue');
let d = fs.readFileSync(dashboardPath, 'utf8');

d = d.replace('state.targetMenuToClone = menu;', 'restaurantStore.setTargetMenuToClone(menu);');
fs.writeFileSync(dashboardPath, d, 'utf8');

console.log('Fixed state mutation bug.');
