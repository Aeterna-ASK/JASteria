const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/function migrateMenuVersions[\s\S]*?console\.log\('\[store\] Migrated menus to support version management'\);\n  }\n}/);

if (match) {
  let funcBody = match[0];
  funcBody = funcBody.replace(/state\.menus/g, 'menus');
  
  const testCode = `
    let menus = [
      { name: '有機豆乳のポタージュ', versionName: '第1版', id: 'menu-968-nsc' },
      { name: '有機豆乳のポタージュ', versionName: '第2版', id: 'menu-740-ml2' }
    ];
    
    ${funcBody}
    
    migrateMenuVersions(null);
    console.log(menus);
  `;
  
  fs.writeFileSync('test_migrate.js', testCode, 'utf8');
  console.log('Wrote test_migrate.js');
} else {
  console.log('Could not find migrateMenuVersions');
}
