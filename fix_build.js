const fs = require('fs');
const path = require('path');
const os = require('os');

const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache');

console.log('Đang sửa lỗi xác minh chứng chỉ (Signature Verification) của electron-builder...');

function fixCache(toolName, targetFolderName) {
  const toolDir = path.join(cacheDir, toolName);
  if (!fs.existsSync(toolDir)) return;

  const files = fs.readdirSync(toolDir);
  let tempFolder = null;

  // Tìm thư mục temp (tên là dãy số ngẫu nhiên)
  for (const file of files) {
    const fullPath = path.join(toolDir, file);
    if (fs.statSync(fullPath).isDirectory() && !file.includes(toolName)) {
      tempFolder = fullPath;
      break;
    }
  }

  const targetPath = path.join(toolDir, targetFolderName);

  if (tempFolder && !fs.existsSync(targetPath)) {
    console.log(`- Đang cấu hình ${toolName} thành ${targetFolderName}...`);
    fs.renameSync(tempFolder, targetPath);
    console.log(`✅ Đã fix xong ${toolName}!`);
  } else if (fs.existsSync(targetPath)) {
    console.log(`✅ ${toolName} đã được cài đặt sẵn.`);
  }

  // Dọn dẹp file .7z dư thừa
  for (const file of files) {
    if (file.endsWith('.7z')) {
      fs.unlinkSync(path.join(toolDir, file));
    }
  }
}

try {
  if (fs.existsSync(cacheDir)) {
    fixCache('winCodeSign', 'winCodeSign-2.6.0');
    // Có thể nsis cũng bị lỗi tương tự, fix luôn nếu có
    fixCache('nsis', 'nsis-3.0.4.1');
    console.log('✅ HOÀN TẤT! Bạn hãy chạy lại lệnh: npm run dist');
  } else {
    console.log('Không tìm thấy thư mục Cache.');
  }
} catch (error) {
  console.error('❌ Lỗi:', error.message);
}
