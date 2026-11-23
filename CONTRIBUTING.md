# Hướng dẫn đóng góp / Contributing to Mini Ho Chi Minh 3D

Cảm ơn bạn đã quan tâm và muốn chung tay xây dựng **Mini Ho Chi Minh 3D**! Mọi đóng góp — từ việc thêm một tuyến xe buýt, chỉnh lại tọa độ một nhà ga, dựng thêm một công trình 3D của Sài Gòn, đến tối ưu hiệu năng WebGL — đều cực kỳ đáng quý.

## 1. Cách bắt đầu nhanh

1. **Fork** repository này về tài khoản GitHub của bạn.
2. Clone và cài đặt dependencies:
   ```bash
   git clone https://github.com/<your-username>/mini-hochiminh-3d.git
   cd mini-hochiminh-3d
   npm install
   npm run dev
   ```
3. Tạo nhánh mới cho tính năng hoặc bản sửa lỗi của bạn:
   ```bash
   git checkout -b feat/add-notre-dame-3d
   ```

## 2. Gợi ý những phần dễ đóng góp nhất

### 🚌 Thêm tuyến xe buýt / Metro mới
- Mở `src/data/buses.ts` hoặc `src/data/metro.ts`.
- Thêm một object `TransitRoute` mới gồm `stations` và `path` (tọa độ `[lng, lat]` theo chuẩn WGS84).
- Bộ mô phỏng `Simulator.ts` và lớp hiển thị 3D sẽ tự động nhận tuyến mới và cho xe chạy!

### 🏛️ Thêm công trình biểu tượng 3D của TP.HCM
- Mở `src/engine/ImmersiveLandmarks.ts`.
- Tạo một hàm `createYourLandmark(): THREE.Group` bằng Three.js và đặt vào đúng tọa độ thực qua `toWorld(lng, lat, 0)`.
- Gợi ý: Nhà thờ Đức Bà, Bưu điện Trung tâm, Dinh Độc Lập, Tòa nhà Vietcombank, Cầu Thủ Thiêm 1, Nhà ga T3 Tân Sơn Nhất...

### 🎨 Cải thiện UI / UX hoặc bản dịch
- Giao diện HUD nằm ở `src/ui/HUD.ts` và `src/styles/main.css`.
- Chuỗi ngôn ngữ nằm ở `src/data/i18n.ts` (hỗ trợ song ngữ `vi` và `en`).

## 3. Kiểm tra trước khi gửi Pull Request

Chạy lệnh build để chắc chắn không có lỗi TypeScript hoặc lỗi đóng gói:

```bash
npm run build
```

Sau đó mở Pull Request về nhánh `main`, mô tả ngắn gọn thay đổi và đính kèm ảnh chụp màn hình nếu có thay đổi về giao diện/đồ họa 3D.

Cảm ơn bạn đã đồng hành xây dựng bản đồ 3D cộng đồng cho TP. Hồ Chí Minh! 🌆
