const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\{\s*selectedMenuForSpec\.deadline\s*\?\s*selectedMenuForSpec\.deadline\s*\+\s*'[^']*'\s*:\s*'[^']*'\s*\}\}/g;

let count = 0;
content = content.replace(regex, (match) => {
    count++;
    console.log('Replacing:', match);
    return `{{ selectedMenuForSpec.deadline || '未定' }}`;
});

if (count > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Replaced ${count} occurrences.`);
} else {
    console.log('No matches found.');
}
