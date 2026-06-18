const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'DashboardView.vue');
let content = fs.readFileSync(filePath, 'utf8');

// Update upcomingDeadlines condition to include overdue items
content = content.replace(
  /return d >= today && d <= futureDate;/g,
  `return d <= futureDate; // 過去（超過）も含める`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed upcomingDeadlines to include overdue items');
