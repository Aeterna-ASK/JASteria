const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'store', 'restaurantStore.js');
let content = fs.readFileSync(file, 'utf8');

const injectionCode = `
function migrateMenuVersions(parsed) {
  if (parsed && parsed.excelDataMenuVersionsV1) return;
  
  if (!Array.isArray(state.menus)) return;

  let modified = false;
  
  // Group by masterName or name
  const groups = {};
  state.menus.forEach(menu => {
    const master = menu.masterName || menu.name;
    // ensure masterName is populated
    if (!menu.masterName) {
       menu.masterName = master;
       modified = true;
    }
    
    if (!groups[master]) {
      groups[master] = [];
    }
    groups[master].push(menu);
  });

  Object.values(groups).forEach(group => {
    if (group.length === 1) {
      // Only one version
      const m = group[0];
      if (m.isActiveVersion === undefined) {
        m.isActiveVersion = true;
        m.versionName = '初期版';
        modified = true;
      }
    } else {
      // Multiple versions, need to sort to find the newest.
      // Usually "№2" is newer than "no number", "№3" is newer than "№2".
      // Let's sort by checking if name has "№" and parsing the number.
      group.sort((a, b) => {
        const getNum = (name) => {
          const match = name.match(/№(\\d+)/);
          return match ? parseInt(match[1], 10) : 1;
        };
        const numA = getNum(a.name);
        const numB = getNum(b.name);
        if (numA !== numB) return numB - numA; // higher number first
        // fallback to creation date or just id if everything else fails
        return b.id.localeCompare(a.id);
      });
      
      group.forEach((m, index) => {
        if (m.isActiveVersion === undefined) {
          m.isActiveVersion = (index === 0); // newest is active
          
          // Generate a version name based on the name suffix if not set
          if (!m.versionName) {
            const match = m.name.match(/№(\\d+)/);
            if (match) {
              m.versionName = \`第\${match[1]}版\`;
              // We could also strip the № from the actual name, but maybe keep it for now so users recognize it
            } else {
              m.versionName = '初期版';
            }
          }
          modified = true;
        }
      });
    }
  });

  if (modified) {
    console.log('[store] Migrated menus to support version management');
  }
}
`;

if (!content.includes('migrateMenuVersions(parsed)')) {
  content = content.replace('// 受入点検の点検者を調理責任者へ一度だけ移行する', injectionCode + '\n// 受入点検の点検者を調理責任者へ一度だけ移行する');
  
  content = content.replace('migrateExcelDataZeros(rawData ? JSON.parse(rawData) : null);', 'migrateExcelDataZeros(rawData ? JSON.parse(rawData) : null);\n    migrateMenuVersions(rawData ? JSON.parse(rawData) : null);');
  
  content = content.replace('excelDataZerosImportedV1: true,', 'excelDataZerosImportedV1: true,\n      excelDataMenuVersionsV1: true,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected menu versions migration.');
} else {
  console.log('Already injected.');
}
