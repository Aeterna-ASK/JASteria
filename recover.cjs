const fs = require('fs');
const lines = fs.readFileSync('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"step_index":131,')) {
    const obj = JSON.parse(lines[i]);
    fs.writeFileSync('store_1.txt', obj.content);
    console.log('Saved store_1.txt');
  }
  if (lines[i].includes('"step_index":135,')) {
    const obj = JSON.parse(lines[i]);
    fs.writeFileSync('store_2.txt', obj.content);
    console.log('Saved store_2.txt');
  }
  if (lines[i].includes('"step_index":139,')) {
    const obj = JSON.parse(lines[i]);
    fs.writeFileSync('store_3.txt', obj.content);
    console.log('Saved store_3.txt');
  }
}
