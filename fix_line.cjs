const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');
lines[63] = "    notes: '2026年度の衛生・清掃点検に関連する環境委託エビデンスとして保管',";
fs.writeFileSync(file, lines.join('\n'), 'utf8');
