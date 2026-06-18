const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('syncFromRiRyLink') && (line.includes('const syncFromRiRyLink =') || line.includes('async function syncFromRiRyLink'))) {
       console.log("Found definition body!");
       let idx = line.indexOf('syncFromRiRyLink =');
       if (idx === -1) idx = line.indexOf('function syncFromRiRyLink');
       console.log(line.substring(Math.max(0, idx - 100), idx + 2000));
       break;
    }
  }
}
processLineByLine();
