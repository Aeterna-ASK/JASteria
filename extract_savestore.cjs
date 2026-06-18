const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"source":"MODEL","type":"VIEW_FILE"')) {
      try {
        const obj = JSON.parse(line);
        if (obj.content && obj.content.includes('jas_restaurant_store_v2')) {
          const content = obj.content;
          const match = content.match(/function saveStore\(\) \{[\s\S]*?\}/);
          if (match) {
            console.log("saveStore function found:");
            console.log(match[0]);
          } else {
            console.log("saveStore not found in this chunk");
          }
        }
      } catch (e) {}
    }
  }
}

processLineByLine();
