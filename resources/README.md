# HotLingo Resources

Thư mục này chứa tài nguyên cho app.

## Icon
Copy file icon vào đây:
- `icon.png` — PNG icon (256x256) cho development
- `icon.ico` — ICO icon cho Windows production build

### Tạo icon.ico từ icon.png
Dùng tool online: https://convertio.co/png-ico/
Hoặc dùng ImageMagick:
```bash
magick icon.png -define icon:auto-resize=16,32,48,64,128,256 icon.ico
```
