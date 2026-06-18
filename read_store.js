import fs from 'fs';
const content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
const matches = [];
lines.forEach((line, idx) => {
  if (line.includes('CleaningLog') || line.includes('update')) {
    matches.push(`${idx + 1}: ${line.trim()}`);
  }
});
console.log('--- Matches ---');
console.log(matches.slice(0, 50).join('\n'));
