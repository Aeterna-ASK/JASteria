const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/CookingLogsView.vue';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/点検・記録日/g, '対象年月');
content = content.replace(/type="date"/g, 'type="month"');
content = content.replace(/date:\s*new\s*Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "date: new Date().toISOString().slice(0, 7)");
content = content.replace(/date:\s*log\.date/g, "date: log.date.substring(0, 7)");

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced date to month successfully.');
