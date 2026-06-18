const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let found = false;
  let codeBlock = [];
  for await (const line of rl) {
    if (line.includes('syncFromRiRyLink')) {
       console.log("Found in line!");
       let idx = line.indexOf('syncFromRiRyLink');
       console.log(line.substring(Math.max(0, idx - 200), idx + 2000));
       break;
    }
  }
}
processLineByLine();
