const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let content = fs.readFileSync(filePath, 'utf8');

// Add isReviewDatePassed function right after isDeadlinePassed
if (!content.includes('const isReviewDatePassed')) {
  content = content.replace(
    /const isDeadlinePassed = \(deadline\) => \{\s*if \(\!deadline\) return false;\s*const d = new Date\(deadline\);\s*if \(isNaN\(d\.getTime\(\)\)\) return false;\s*const today = new Date\(\);\s*today\.setHours\(0, 0, 0, 0\);\s*d\.setHours\(0, 0, 0, 0\);\s*return d < today;\s*\};/g,
    `const isDeadlinePassed = (deadline) => {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const isReviewDatePassed = (reviewDate) => {
  if (!reviewDate) return false;
  const d = new Date(reviewDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};`
  );
}

// Add the badge inside the badges-row if it doesn't exist
if (!content.includes('isReviewDatePassed(menu.reviewDate)')) {
  content = content.replace(
    /(\<span v-if="isDeadlinePassed\(menu\.deadline\)" class="badge"[^>]*\>\s*\<Check :size="12" \/\> 達成完了\s*\<\/span\>)/g,
    `$1\n            <span v-if="isReviewDatePassed(menu.reviewDate)" class="badge" style="background-color: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; display: inline-flex; align-items: center; gap: 4px;">\n              <AlertTriangle :size="12" /> 見直し期日超過\n            </span>`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed missing review date badge');
