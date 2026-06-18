const fs = require('fs');
const path = require('path');

const dashboardPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'DashboardView.vue');
let d = fs.readFileSync(dashboardPath, 'utf8');

// 1. Add handleCloneAchievedMenu function
if (!d.includes('handleCloneAchievedMenu')) {
    d = d.replace(
        'const setTab = (tab) => {',
        `const handleCloneAchievedMenu = (menu) => {
  state.targetMenuToClone = menu;
  setTab('menus');
};

const setTab = (tab) => {`
    );
}

// 2. Add click handler to achieved menu card
if (!d.includes('@click="handleCloneAchievedMenu(menu)"')) {
    d = d.replace(
        '<div v-for="menu in achievedMenus" :key="menu.id" class="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">',
        '<div v-for="menu in achievedMenus" :key="menu.id" class="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer" @click="handleCloneAchievedMenu(menu)" title="クリックして新しい版を作成">'
    );
}
fs.writeFileSync(dashboardPath, d, 'utf8');


const menusPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let m = fs.readFileSync(menusPath, 'utf8');

// 1. import onMounted
if (!m.includes(', onMounted')) {
    m = m.replace("import { ref, computed, watch } from 'vue';", "import { ref, computed, watch, onMounted } from 'vue';");
}

// 2. Add openCloneModal function and onMounted
if (!m.includes('openCloneModal')) {
    m = m.replace(
        'const errorMessage = ref(\'\');',
        `const errorMessage = ref('');

const openCloneModal = (menu) => {
  isEditing.value = false;
  currentId.value = null;
  errorMessage.value = '';
  
  form.value = {
    name: menu.masterName || menu.name,
    masterName: menu.masterName || menu.name,
    price: menu.price || 0,
    isOrganicClaim: menu.isOrganicClaim !== undefined ? menu.isOrganicClaim : true,
    description: menu.description || '',
    recipe: menu.recipe ? menu.recipe.map(r => ({...r})) : [],
    category: menu.category || '有機料理スペック',
    changeDetails: '前回からの更新',
    targetCreatedDate: '',
    startDate: '',
    reviewDate: '',
    deadline: '',
    creatorApproved: menu.creatorApproved || '',
    managerApproved: menu.managerApproved || '',
    courseTargetNum: menu.courseTargetNum || '年間3600食',
    singleTargetNum: menu.singleTargetNum || '年間60食',
  };
  showAddModal.value = true;
};

onMounted(() => {
  if (state.targetMenuToClone) {
    openCloneModal(state.targetMenuToClone);
    state.targetMenuToClone = null;
  }
});`
    );
}
fs.writeFileSync(menusPath, m, 'utf8');

console.log('Successfully injected clone functionality.');
