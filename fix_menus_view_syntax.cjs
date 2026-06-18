const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(filePath, 'utf8');

const targetStr = `<div v-if="expandedStats[menu.id]" class="menu-stats-box mt-3 animate-fade-in">
                  <option :value="2025">2025年</option>`;

const replacementStr = `<div v-if="expandedStats[menu.id]" class="menu-stats-box mt-3 animate-fade-in">
            <div class="stats-header flex items-center justify-between mb-2">
              <span class="stats-title font-semibold text-xs text-sub">{{ currentYear }}年 提供実績 （合計: <strong class="text-forest font-bold text-sm">{{ getYearlyTotal(menu.id) }}食</strong>）</span>
              <div class="year-selector" @click.stop>
                <select v-model="currentYear" class="select-sm" style="font-size: 0.75rem; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid var(--border);">
                  <option :value="2026">2026年</option>
                  <option :value="2025">2025年</option>`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed syntax error in MenusView.');
} else {
    console.log('Could not find target string to fix.');
}
