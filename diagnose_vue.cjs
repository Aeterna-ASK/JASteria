const fs = require('fs');
const { parse } = require('@vue/compiler-sfc');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
const content = fs.readFileSync(file, 'utf8');

const result = parse(content);
if (result.errors && result.errors.length > 0) {
    console.log('Errors found:');
    result.errors.forEach(err => {
        console.log(err.message);
        if (err.loc) {
            console.log(`Line: ${err.loc.start.line}, Column: ${err.loc.start.column}`);
        }
    });
} else {
    console.log('No errors!');
}
