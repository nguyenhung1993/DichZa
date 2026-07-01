const fs = require('fs');
const path = require('path');

const docsAssetsDir = path.join(__dirname, 'docs', 'assets');

// Create docs/assets if it doesn't exist
if (!fs.existsSync(docsAssetsDir)) {
  fs.mkdirSync(docsAssetsDir, { recursive: true });
}

// Copy icon
const iconSource = path.join(__dirname, 'resources', 'icon.png');
const iconDest = path.join(docsAssetsDir, 'icon.png');
if (fs.existsSync(iconSource)) {
  fs.copyFileSync(iconSource, iconDest);
  console.log('✅ Copied icon.png');
}

// Copy mockup
const mockupSource = 'C:\\\\Users\\\\Admin\\\\.gemini\\\\antigravity-ide\\\\brain\\\\cc4ae696-8650-4da0-9c77-d0b99ed4dc56\\\\dichza_mockup_1782891539379.png';
const mockupDest = path.join(docsAssetsDir, 'dichza_mockup.png');
if (fs.existsSync(mockupSource)) {
  fs.copyFileSync(mockupSource, mockupDest);
  console.log('✅ Copied dichza_mockup.png');
}

console.log('🎉 Assets copied successfully! You can now commit the docs folder.');
