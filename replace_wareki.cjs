const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// Replace targetCreatedDateWareki
content = content.replace(
    /\{\{\s*selectedMenuSpecData\.targetCreatedDateWareki\s*\}\}/g,
    "{{ selectedMenuForSpec.targetCreatedDate || '未定' }}"
);

// Replace startDateWareki
content = content.replace(
    /\{\{\s*selectedMenuSpecData\.startDateWareki\s*\}\}/g,
    "{{ selectedMenuForSpec.startDate || '未定' }}"
);

// Replace reviewDateWareki
content = content.replace(
    /\{\{\s*selectedMenuSpecData\.reviewDateWareki\s*\}\}/g,
    "{{ selectedMenuForSpec.reviewDate || '未定' }}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced Wareki variables with YYYY-MM-DD format.');
