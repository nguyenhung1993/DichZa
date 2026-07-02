const fs = require('fs');
const path = require('path');

const dirsToScan = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'README.md'),
  path.join(__dirname, 'package.json'),
  path.join(__dirname, 'electron-builder.yml'),
  path.join(__dirname, 'electron.vite.config.ts')
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    callback(dir);
    return;
  }
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

let modifiedCount = 0;

function processFile(filePath) {
  // Skip binary files or non-text files if any, but src should only have text.
  if (filePath.endsWith('.png') || filePath.endsWith('.ico') || filePath.endsWith('.woff2')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace exact case matches first to be safe
  content = content.replace(/HotLingo/g, 'DichZa');
  content = content.replace(/hotlingo/g, 'dichza');
  content = content.replace(/HOTLINGO/g, 'DICHZA');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Modified: ${filePath}`);
    modifiedCount++;
  }
}

dirsToScan.forEach(dir => {
  walkDir(dir, processFile);
});

console.log(`Finished. Modified ${modifiedCount} files.`);
