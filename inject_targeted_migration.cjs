const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

// I will just append this to the script setup block
const newMigrationCode = `
// Target specific menus that had 一年間 or 3か月 originally
setTimeout(() => {
  const ids1Year = [
    'menu-nukaduke-2', 'menu-orgcourse-1', 'menu-orgcourse-2', 
    'menu-salad-0', 'menu-blueberry-1', 'menu-potage-1', 
    'menu-salsa-0', 'menu-kurozu-defg', 'menu-kurozu-steak', 
    'menu-kurozu-maguro', 'menu-coffee-1'
  ];
  const ids3Months = ['menu-coffee-0'];
  let changed = false;
  
  if (restaurantStore.state.menus) {
    restaurantStore.state.menus.forEach(m => {
      if (ids1Year.includes(m.id) && (!m.deadline || m.deadline === '' || m.deadline === '一年間' || m.deadline === '1年間' || m.deadline === '1年')) {
        const d = parseDateString(m.startDate);
        if (d && !isNaN(d.getTime())) {
          d.setFullYear(d.getFullYear() + 1);
          const y = d.getFullYear();
          const reiwa = y - 2018;
          const rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
          m.deadline = rStr + (d.getMonth() + 1) + '月' + d.getDate() + '日';
          changed = true;
          console.log('Fixed 1 year for', m.name);
        }
      }
      
      if (ids3Months.includes(m.id) && (!m.deadline || m.deadline === '' || m.deadline === '3か月' || m.deadline === '3ヶ月')) {
        const d = parseDateString(m.startDate);
        if (d && !isNaN(d.getTime())) {
          d.setMonth(d.getMonth() + 3);
          const y = d.getFullYear();
          const reiwa = y - 2018;
          const rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
          m.deadline = rStr + (d.getMonth() + 1) + '月' + d.getDate() + '日';
          changed = true;
          console.log('Fixed 3 months for', m.name);
        }
      }
    });
    
    if (changed) {
      restaurantStore.saveToFirestore();
      console.log('Migrated target IDs deadlines');
    }
  }
}, 4000);
`;

content = content.replace(
  /onMounted\(\(\) => \{/,
  `onMounted(() => {\n${newMigrationCode}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Injected targeted migration');
