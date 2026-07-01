const fs = require('fs');
const path = require('path');
const os = require('os');

// Đường dẫn tới thư mục cache bị lỗi của electron-builder trên Windows
const cacheDir = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache');

try {
  if (fs.existsSync(cacheDir)) {
    console.log('Đang xóa bộ nhớ đệm (cache) bị lỗi...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Đã dọn dẹp cache thành công! Bạn có thể chạy lại lệnh npm run dist.');
  } else {
    console.log('✅ Không tìm thấy cache lỗi, môi trường đã sạch!');
  }
} catch (error) {
  console.error('❌ Có lỗi khi xóa cache:', error.message);
}
