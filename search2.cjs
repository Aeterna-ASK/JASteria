const fs = require('fs');
const content = fs.readFileSync('c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Spec') || lines[i].includes('Modal') || lines[i].includes('Sheet')) {
    if (lines[i].trim().startsWith('const open')) console.log(i + 1, lines[i]);
  }
}
