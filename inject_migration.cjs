const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

const migrationCode = `
  // Migration for 一年間 deadline
  setTimeout(() => {
    let changed = false;
    restaurantStore.state.menus.forEach(m => {
      if (m.deadline === '一年間' || m.deadline === '1年間' || m.deadline === '1年') {
        const d = parseDateString(m.startDate);
        if (d && !isNaN(d.getTime())) {
          d.setFullYear(d.getFullYear() + 1);
          const y = d.getFullYear();
          const reiwa = y - 2018;
          const rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
          m.deadline = rStr + (d.getMonth() + 1) + '月' + d.getDate() + '日';
          changed = true;
        }
      }
    });
    if (changed) {
      restaurantStore.saveToFirestore();
      console.log('Migrated deadlines from 一年間 to explicit dates');
    }
  }, 3000);
`;

if (!content.includes('Migrated deadlines from 一年間')) {
  content = content.replace(
    /(onMounted\(\(\) => \{)/,
    `$1\n${migrationCode}`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Injected deadline migration code');
} else {
  console.log('Migration code already present');
}
