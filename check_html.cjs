const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
const s = fs.readFileSync(file, 'utf8');
const t = s.substring(s.indexOf('<template>'), s.indexOf('</template>')+11);
const lines = t.split('\n');

const stack = [];
const re = /<\/?([a-zA-Z0-9\-]+)(?:[^>]*?)(\/?)>/g;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m;
  while ((m = re.exec(line)) !== null) {
    const tag = m[1];
    const isSelfClosing = m[2] === '/' || ['img','input','br','hr','col','path','line','circle','rect','polyline','polygon','use','stop', 'Printer', 'Sparkles', 'X', 'FileText', 'Scale', 'Edit3', 'Trash2', 'Check', 'AlertCircle'].includes(tag);
    
    if (m[0].startsWith('</')) {
      if (stack.length === 0) {
        console.log(`Line ${i+1}: Unexpected closing tag </${tag}>`);
        continue;
      }
      
      let found = -1;
      for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].tag === tag) {
          found = j;
          break;
        }
      }
      
      if (found !== -1) {
        if (found !== stack.length - 1) {
          console.log(`Line ${i+1}: Closing </${tag}> matches open tag on line ${stack[found].line}, but tags ${stack.slice(found+1).map(x=>x.tag).join(', ')} were not closed!`);
        }
        stack.length = found;
      } else {
        console.log(`Line ${i+1}: Unexpected closing tag </${tag}>, no matching open tag found.`);
      }
    } else if (!isSelfClosing) {
      stack.push({tag: tag, line: i+1});
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags remaining:');
  stack.forEach(item => console.log(`- <${item.tag}> on line ${item.line}`));
} else {
  console.log('All tags matched properly!');
}
