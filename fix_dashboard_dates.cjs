const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'DashboardView.vue');
let content = fs.readFileSync(filePath, 'utf8');

const parserCode = `
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  const reiwaMatch = dateStr.match(/令和(\\d+|元)年(\\d+)月(\\d+)日/);
  if (reiwaMatch) {
    const yearStr = reiwaMatch[1];
    const year = yearStr === '元' ? 2019 : 2018 + parseInt(yearStr, 10);
    const month = parseInt(reiwaMatch[2], 10) - 1;
    const day = parseInt(reiwaMatch[3], 10);
    return new Date(year, month, day);
  }
  return null;
};
`;

if (!content.includes('const parseDateString')) {
  content = content.replace(
    /(const upcomingReviewMenus = computed\(\(\) => \{)/,
    parserCode + '\n$1'
  );
}

content = content.replace(
  /const d = new Date\(m\.reviewDate\);\s*if \(isNaN\(d\.getTime\(\)\)\) return false;/g,
  `const d = parseDateString(m.reviewDate);\n    if (!d || isNaN(d.getTime())) return false;`
);

content = content.replace(
  /const d = new Date\(m\.deadline\);\s*if \(isNaN\(d\.getTime\(\)\)\) return false;/g,
  `const d = parseDateString(m.deadline);\n    if (!d || isNaN(d.getTime())) return false;`
);

// We should also replace the sort functions which do `new Date(a.reviewDate) - new Date(b.reviewDate)`
content = content.replace(
  /\.sort\(\(a, b\) => new Date\(a\.reviewDate\) - new Date\(b\.reviewDate\)\)/g,
  `.sort((a, b) => (parseDateString(a.reviewDate) || new Date(0)) - (parseDateString(b.reviewDate) || new Date(0)))`
);

content = content.replace(
  /\.sort\(\(a, b\) => new Date\(b\.deadline\) - new Date\(a\.deadline\)\)/g,
  `.sort((a, b) => (parseDateString(b.deadline) || new Date(0)) - (parseDateString(a.deadline) || new Date(0)))`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed dates in DashboardView.vue');
