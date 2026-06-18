const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add openSpecSheetModal
if (!content.includes('const openSpecSheetModal =')) {
  const specModalCode = `
const openSpecSheetModal = (menu) => {
  selectedMenuForSpec.value = menu;
  showSpecSheet.value = true;
};
`;
  content = content.replace(
    /(const openEditModal = \(menu\) => \{)/,
    `${specModalCode}\n$1`
  );
}

// 2. Add toYMD and apply it to openEditModal
if (!content.includes('const toYMD =')) {
  const toYMDCode = `
const toYMD = (dateStr) => {
  if (!dateStr) return '';
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return \`\${y}-\${m}-\${day}\`;
};
`;
  content = content.replace(
    /(const openEditModal = \(menu\) => \{)/,
    `${toYMDCode}\n$1`
  );
}

// Replace the direct assignments in openEditModal
content = content.replace(
  /targetCreatedDate: menu\.targetCreatedDate \|\| '',/g,
  `targetCreatedDate: toYMD(menu.targetCreatedDate),`
);
content = content.replace(
  /startDate: menu\.startDate \|\| '',/g,
  `startDate: toYMD(menu.startDate),`
);
content = content.replace(
  /reviewDate: menu\.reviewDate \|\| '',/g,
  `reviewDate: toYMD(menu.reviewDate),`
);
content = content.replace(
  /deadline: menu\.deadline \|\| '',/g,
  `deadline: toYMD(menu.deadline),`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed edit modal dates and JAS button');
