const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

const dateParserStr = `const parseDateString = (dateStr) => {
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
};`;

content = content.replace(
  /const isDeadlinePassed = \(deadline\) => \{/g,
  `${dateParserStr}\n\nconst isDeadlinePassed = (deadline) => {`
);

content = content.replace(
  /const d = new Date\(deadline\);/g,
  `const d = parseDateString(deadline);`
);

content = content.replace(
  /const d = new Date\(reviewDate\);/g,
  `const d = parseDateString(reviewDate);`
);

// We need to fix the "isReviewDatePassed(menu.reviewDate)" condition in case it wasn't correct
// And also check the old implementation for "達成完了". The previous one used `isDeadlinePassed` successfully because maybe previously the dates were stored in Gregorian format!

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed date parsing');
