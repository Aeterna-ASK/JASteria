const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'App.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// Add sidebar button for Procurement Plan before Ingredients
const sidebarSearch = `<button 
              :class="['nav-item', currentTab === 'ingredients' ? 'active' : '']" 
              @click="setTab('ingredients')"
            >`;

const sidebarReplace = `<button 
              :class="['nav-item', currentTab === 'procurement' ? 'active' : '']" 
              @click="setTab('procurement')"
            >
              <CalendarRange :size="18" />
              <span>食材調達計画</span>
            </button>
            <button 
              :class="['nav-item', currentTab === 'ingredients' ? 'active' : '']" 
              @click="setTab('ingredients')"
            >`;

if (c.includes(sidebarSearch)) {
  c = c.replace(sidebarSearch, sidebarReplace);
  console.log('Sidebar updated.');
}

// Add drawer button for Procurement Plan before Ingredients
const drawerSearch = `<button @click="setTab('ingredients')" :class="['drawer-item', currentTab==='ingredients'?'active':'']">`;

const drawerReplace = `<button @click="setTab('procurement')" :class="['drawer-item', currentTab==='procurement'?'active':'']">
              <CalendarRange :size="18"/> 食材調達計画
            </button>
            <button @click="setTab('ingredients')" :class="['drawer-item', currentTab==='ingredients'?'active':'']">`;

if (c.includes(drawerSearch)) {
  c = c.replace(drawerSearch, drawerReplace);
  console.log('Drawer updated.');
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('App.vue patch completed.');
