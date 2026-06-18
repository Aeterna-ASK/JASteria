const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
if (!fs.existsSync(historyDir)) {
  console.log('No VS Code history found');
  process.exit(0);
}

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  let results = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(searchDir(full));
    } else {
      if (full.endsWith('.js')) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('migrateMenuApprovers') && !content.includes('竹丁E義隁E')) {
            results.push({ file: full, time: stat.mtime.getTime() });
          }
        } catch(e) {}
      }
    }
  }
  return results;
}

const matches = searchDir(historyDir);
matches.sort((a, b) => b.time - a.time);

console.log('Found matches:');
matches.slice(0, 5).forEach(m => {
  console.log(new Date(m.time).toISOString(), m.file);
});
