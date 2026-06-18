const fs = require('fs');
const iconv = require('iconv-lite'); // May not be installed, let's just try Buffer

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/IngredientsView.vue';
const content = fs.readFileSync(file, 'utf8');

// The file was written as UTF-8 but the original bytes were Shift-JIS.
// Let's convert back to buffer using latin1 or binary to preserve the exact bytes.
const buffer = Buffer.from(content, 'utf8'); // Wait, if it was written as UTF-8, we can't just get Shift-JIS bytes.

// If the system read Shift-JIS as UTF-8, we have to encode it back to latin1 (or something) to get the raw bytes, then decode as utf8.
// Actually, `content` has the mojibake.
const bytes = Buffer.from(content, 'latin1'); // This gets the raw bytes if it was decoded as latin1.
console.log(bytes.slice(0, 100));
