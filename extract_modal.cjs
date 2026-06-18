const fs = require('fs');

const logPath = 'C:\\Users\\dai72\\.gemini\\antigravity\\brain\\fffe4135-4b92-42b0-8ff4-d7451c842fef\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('v-if="showModal"')) {
    console.log(lines[i].substring(0, 500) + '...');
    // We just want to find where the original template for showModal was and save it to a file
    // The easiest way is to find a full copy of MenusView.vue from an earlier step.
    const match = lines[i].match(/(<Teleport to="body">\s*<div v-if="showModal"[\s\S]*?<\/Teleport>)/);
    if (match) {
       fs.writeFileSync('extracted_modal.txt', match[1]);
       console.log('Saved extracted_modal.txt');
       break;
    }
  }
}
