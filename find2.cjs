const fs = require('fs');
const lines = fs.readFileSync('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '') continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.content && typeof obj.content === 'string' && obj.content.includes('function initFirestoreSync')) {
      console.log('Found at step:', obj.step_index);
      fs.writeFileSync(`extracted_${obj.step_index}.txt`, obj.content);
    }
  } catch(e) {}
}
