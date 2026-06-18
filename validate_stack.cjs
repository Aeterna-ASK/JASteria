const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
const content = fs.readFileSync(file, 'utf8');

const stack = [];
const lines = content.split('\n');
const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?(\/?)>/g;

const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

let templateStarted = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        const isSelfClosing = match[2] === '/' || voidElements.has(tagName) || fullTag.endsWith('/>');
        const isCloseTag = fullTag.startsWith('</');
        
        if (tagName === 'template' && !isCloseTag) templateStarted = true;
        if (!templateStarted) continue;

        if (isCloseTag) {
            if (stack.length === 0) {
                console.log(`ERROR: Found </${tagName}> at line ${i+1} but stack is empty.`);
            } else {
                const top = stack.pop();
                if (top.tagName !== tagName) {
                    console.log(`ERROR: Found </${tagName}> at line ${i+1}, expected </${top.tagName}> (opened at line ${top.line}).`);
                    // recover by not popping? Or pop until we find it?
                    stack.push(top); // put it back for now
                }
            }
            if (tagName === 'template') {
                templateStarted = false;
                break;
            }
        } else if (!isSelfClosing) {
            stack.push({ tagName, line: i+1 });
        }
    }
}

if (stack.length > 0) {
    console.log('Unclosed tags remaining in stack:');
    stack.forEach(s => console.log(`- <${s.tagName}> from line ${s.line}`));
} else {
    console.log('Tags are balanced!');
}
