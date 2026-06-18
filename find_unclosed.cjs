const fs = require('fs');
const { parse } = require('@vue/compiler-sfc');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
const content = fs.readFileSync(file, 'utf8');

const result = parse(content);
console.log(result.errors);
