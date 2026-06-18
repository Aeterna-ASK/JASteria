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
    /const upcomingDeadlines = computed\(\(\) => \{/,
    parserCode + '\nconst upcomingDeadlines = computed(() => {'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed: Injected parseDateString');
} else {
  console.log('parseDateString already exists');
}
