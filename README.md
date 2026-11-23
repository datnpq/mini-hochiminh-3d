# Mini Ho Chi Minh 3D

Bản đồ mô phỏng giao thông công cộng 3D thời gian thực của TP. Hồ Chí Minh, lấy cảm hứng từ [Mini Tokyo 3D](https://minitokyo3d.com/).

## Tính năng nổi bật

- **100% miễn phí, không cần API key**: Sử dụng **MapLibre GL JS** + **OpenFreeMap** (bản đồ vector & tòa nhà 3D) kết hợp **Three.js** custom WebGL layer.
- **Metro số 1 (Bến Thành – Suối Tiên)**: Đầy đủ 14 ga (3 ga ngầm: Bến Thành, Nhà hát Thành phố, Ba Son & 11 ga trên cao đến Suối Tiên) với đoàn tàu 3 toa khớp nối chạy theo đường ray 3D.
- **Saigon Waterbus (Tuyến số 1)**: Tàu buýt sông chạy dọc sông Sài Gòn từ Bến Bạch Đằng → Bình An → Thanh Đa → Hiệp Bình Chánh → Linh Đông.
- **Sân bay Tân Sơn Nhất (SGN)**: Máy bay cất/hạ cánh 3D trên đường băng 25R/25L (Vietnam Airlines, Vietjet Air, Bamboo Airways, Singapore Airlines, ANA).
- **Xe buýt & VinBus**: Các tuyến chính D4 (VinBus điện), 152, 109 (sân bay), 01 (Bến Thành – Chợ Lớn).
- **Mạng lưới Metro quy hoạch (Tuyến 2, 3A, 4)**: Bật/tắt layer quy hoạch và chế độ chạy thử tàu tương lai.
- **Chế độ ngầm (Underground Mode)**: Làm mờ công trình mặt đất để quan sát rõ tuyến hầm và các đoàn tàu ngầm trung tâm Quận 1.
- **Điều khiển thời gian & Góc nhìn**: Tua thời gian 00:00–24:00 (giờ Việt Nam UTC+7), đổi tốc độ (`1x`, `5x`, `20x`, `60x`), chế độ Ngày/Đêm tự động, nhấn vào bất kỳ phương tiện nào để xem chi tiết & khóa camera theo dõi (**Follow Mode**).

## Chạy cục bộ

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.
