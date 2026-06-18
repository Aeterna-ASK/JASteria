const fs = require('fs');

const filePath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'function migrateMenuVersions(parsed) {';
const endMarker = '  if (modified) {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers!");
    process.exit(1);
}

const correctFunction = `function migrateMenuVersions(parsed) {
  if (!Array.isArray(state.menus)) return;

  let modified = false;
  
  // Group by masterName or name
  const groups = {};
  state.menus.forEach(menu => {
    // ensure masterName is populated
    if (!menu.masterName) {
       menu.masterName = menu.name;
       modified = true;
    }
    
    // Group strictly by base name to avoid merging distinct recipes that share a masterName category
    // Strip version numbers like 第1版, No.2, and also parentheses like (第1版), （No.2）
    const baseName = (menu.name || '').replace(/\\s*[\\(（]?(第|No\\.?|v|ver\\.?)\\s*\\d+.*?([\\)）]|$)/gi, '').trim();
    
    // If the baseName ends up empty or it's a copy, we might need a special case, but trim() handles most.
    // Also, let's strip "(コピー)" from the baseName so clones group with their originals
    let finalBaseName = baseName.replace(/\\s*[\\(（]コピー[\\)）]?/g, '').trim();
    
    const groupKey = finalBaseName || menu.id;
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(menu);
  });

  Object.values(groups).forEach(group => {
    if (group.length === 1) {
      // Only one version
      const m = group[0];
      if (m.isActiveVersion !== true) {
        m.isActiveVersion = true;
        modified = true;
      }
      if (!m.versionName) {
        m.versionName = '初期版';
        modified = true;
      }
    } else {
      // Multiple versions, need to sort to find the newest.
      group.sort((a, b) => {
        const getNum = (name) => {
          if (!name) return 1;
          try {
            const match = name.match(/[\\(（]?(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+))[\\)）]?/i);
            if (match) return parseInt(match[2] || match[3] || match[4] || match[5], 10);
          } catch(e) {
            console.error("getNum error on name:", name, e);
          }
          return 1; // Base version is 1
        };
        const numA = getNum(a.name);
        const numB = getNum(b.name);
        if (numA !== numB) return numB - numA; // higher number first
        // fallback to creation date or just id if everything else fails
        return b.id.localeCompare(a.id);
      });
      
      group.forEach((m, index) => {
        const shouldBeActive = (index === 0);
        if (m.isActiveVersion !== shouldBeActive) {
          m.isActiveVersion = shouldBeActive;
          modified = true;
        }
        
        // Generate a version name based on the name suffix if not set
        if (!m.versionName) {
          const match = (m.name || '').match(/[\\(（]?(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+))[\\)）]?/i);
          if (match) {
            m.versionName = \`第\${match[2] || match[3] || match[4] || match[5]}版\`;
          } else {
            m.versionName = '初期版';
          }
          modified = true;
        }
      });
    }
  });

`;

const newContent = content.substring(0, startIndex) + correctFunction + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully replaced migrateMenuVersions with completely uncorrupted code.");
