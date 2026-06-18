const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/dai72/.gemini/antigravity/brain/fffe4135-4b92-42b0-8ff4-d7451c842fef/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('"source":"MODEL","type":"VIEW_FILE"')) {
      try {
        const obj = JSON.parse(line);
        if (obj.content && obj.content.includes('jas_restaurant_store_v2')) {
          fs.writeFileSync(`recovered_store_${obj.step_index}.js`, obj.content);
          console.log(`Saved recovered_store_${obj.step_index}.js`);
        }
      } catch (e) {}
    }
  }
}

processLineByLine();
