const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const d = parseDateString\(deadline\);\s*if \(isNaN\(d\.getTime\(\)\)\) return false;/g,
  `const d = parseDateString(deadline);
  if (!d || isNaN(d.getTime())) return false;`
);

content = content.replace(
  /const d = parseDateString\(reviewDate\);\s*if \(isNaN\(d\.getTime\(\)\)\) return false;/g,
  `const d = parseDateString(reviewDate);
  if (!d || isNaN(d.getTime())) return false;`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed null pointer in date parser usage');
