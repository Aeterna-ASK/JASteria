const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore the regex string if it was corrupted by powershell
// Looking for corrupted: /[\(EE?(第(\d+)牁E|No\.?\s*(\d+)|v(\d+)|ver\.?\s*(\d+)|№\s*(\d+))[\)E]?/i
// Or similar mangled strings. I'll just use a direct replace.
const badRegex1 = /\[\\\(.*?\?\(\u7B2C\(\\d\+\).*?\|No\\\.\\\?\\s\*\\(\\\\d\\\+\\)\|v\\\(\\\\d\\\+\\)\|ver\\\.\\\?\\s\*\\\(\\\\d\\\+\\)\|№\\s\*\\\(\\\\d\\\+\\\)\).*?\?/g;

const correctRegex = `/[\\(（]?(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))[\\)）]?/i`;

// Just replace the specific regex in migrateMenuVersions
content = content.replace(/const match = name\.match\(.+?\);/g, `const match = name.match(${correctRegex});`);
content = content.replace(/const match = \(m\.name \|\| ''\)\.match\(.+?\);/g, `const match = (m.name || '').match(${correctRegex});`);

// Restore any corrupted "初期版"
content = content.replace(/初期牁E/g, '初期版');

// 2. Fix the getNum calls to use versionName OR name!
content = content.replace(/const numA = getNum\(a\.name\);/g, 'const numA = getNum(a.versionName || a.name);');
content = content.replace(/const numB = getNum\(b\.name\);/g, 'const numB = getNum(b.versionName || b.name);');

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully fixed store sorting and encoding.");
