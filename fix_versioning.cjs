const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let c = fs.readFileSync(targetPath, 'utf8');

// The incorrect code we just injected
const badLogic = `
  // --- 版管理（バージョニング）の自動処理 ---
  const group = state.menus.filter(m => (m.masterName || m.name) === newMenu.masterName);
  
  if (group.length === 1) {
    // 新規作成
    newMenu.isActiveVersion = true;
    newMenu.versionName = '初期版';
  } else {
    // クローン（旧版が存在する場合）
    // 既存のものを全て非アクティブにする
    let maxVersion = 1;
    group.forEach(m => {
      if (m.id !== newMenu.id) {
        m.isActiveVersion = false;
        if (m.versionName) {
          const vMatch = m.versionName.match(/第(\\d+)版/);
          if (vMatch) {
            const num = parseInt(vMatch[1], 10);
            if (num > maxVersion) maxVersion = num;
          }
        }
      }
    });
    
    // 新しい版をアクティブにして、バージョンを上げる
    newMenu.isActiveVersion = true;
    newMenu.versionName = \`第\${maxVersion + 1}版\`;
  }
  
  state.menus.push(newMenu);
  saveStore();
  return newMenu;`;

const goodLogic = `
  // --- 版管理（バージョニング）の自動処理 ---
  const group = state.menus.filter(m => (m.masterName || m.name) === newMenu.masterName);
  
  if (group.length === 0) {
    // 完全な新規作成
    newMenu.isActiveVersion = true;
    newMenu.versionName = '初期版';
  } else {
    // クローン（旧版が存在する場合）
    // 既存のものを全て非アクティブにする
    let maxVersion = 1;
    group.forEach(m => {
      m.isActiveVersion = false;
      if (m.versionName) {
        const vMatch = m.versionName.match(/第(\\d+)版/);
        if (vMatch) {
          const num = parseInt(vMatch[1], 10);
          if (num > maxVersion) maxVersion = num;
        } else if (m.versionName === '初期版') {
          // 初期版が存在する場合、少なくとも maxVersion は 1 のまま
        }
      }
    });
    
    // 新しい版をアクティブにして、バージョンを上げる
    newMenu.isActiveVersion = true;
    newMenu.versionName = \`第\${maxVersion + 1}版\`;
  }
  
  state.menus.push(newMenu);
  saveStore();
  return newMenu;`;

if (c.includes(badLogic)) {
    c = c.replace(badLogic, goodLogic);
    fs.writeFileSync(targetPath, c, 'utf8');
    console.log('Fixed versioning logic.');
} else {
    console.log('Could not find bad logic to replace.');
}
