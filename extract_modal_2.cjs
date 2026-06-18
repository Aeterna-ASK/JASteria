const fs = require('fs');

const logPath = 'C:\\Users\\dai72\\.gemini\\antigravity\\brain\\fffe4135-4b92-42b0-8ff4-d7451c842fef\\.system_generated\\logs\\transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');

const lines = content.split('\n');
let foundContent = '';
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('v-if="showModal"')) {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(call => {
        if (call.arguments && call.arguments.CodeContent && call.arguments.CodeContent.includes('v-if="showModal"')) {
          foundContent = call.arguments.CodeContent;
        } else if (call.arguments && call.arguments.ReplacementContent && call.arguments.ReplacementContent.includes('v-if="showModal"')) {
          foundContent = call.arguments.ReplacementContent;
        }
      });
      if (foundContent) break;
    }
    
    // Check view_file response
    if (obj.content && obj.content.includes('v-if="showModal"')) {
      foundContent = obj.content;
      break;
    }
  }
}

if (foundContent) {
  const match = foundContent.match(/(<Teleport to="body">\s*<div v-if="showModal"[\s\S]*?<\/Teleport>)/);
  if (match) {
     fs.writeFileSync('extracted_modal.txt', match[1]);
     console.log('Saved extracted_modal.txt');
  } else {
     fs.writeFileSync('extracted_modal.txt', foundContent);
     console.log('Saved raw content to extracted_modal.txt');
  }
} else {
  console.log('Not found in transcript json objects');
}
