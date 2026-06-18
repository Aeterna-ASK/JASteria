const fs = require('fs');
const content = fs.readFileSync('c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/restore_data.js', 'utf8');
const lines = content.split('\n');
lines.forEach(l => {
  if (l.includes('deadline')) {
    console.log(l.trim());
  }
});
