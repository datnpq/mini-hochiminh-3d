# 🌆 Mini Ho Chi Minh 3D

[![License: MIT](https://img.shields.io/badge/License-MIT-38bdf8.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000.svg)](https://threejs.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-v5-285aab.svg)](https://maplibre.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](CONTRIBUTING.md)

> **Bản sao số 3D thời gian thực & không gian khám phá WebGL của giao thông TP. Hồ Chí Minh** — lấy cảm hứng từ [Mini Tokyo 3D](https://github.com/nagix/mini-tokyo-3d).  
> **An open-source real-time 3D digital twin & interactive WebGL explorer of Ho Chi Minh City's public transit network**, inspired by Mini Tokyo 3D.

🔗 **Live Demo (GitHub Pages)**: https://datnpq.github.io/mini-hochiminh-3d/

---

## ✨ Tính năng nổi bật / Features

- **100% Miễn phí & Mở (Zero API Key)**: Sử dụng **MapLibre GL JS** + **OpenFreeMap** (bản đồ vector & tòa nhà 3D) kết hợp **Three.js WebGL**.
- **Hệ thống giao thông TP.HCM đa phương thức**:
  - 🚇 **Metro số 1 (Bến Thành – Suối Tiên)**: Đủ 14 ga (3 ga ngầm Bến Thành, Nhà hát Thành phố, Ba Son & 11 ga trên cao), cầu cạn 3D và đoàn tàu 3 toa khớp nối.
  - ⛴️ **Saigon Waterbus (Tuyến số 1)**: Tàu buýt sông 3D chạy dọc sông Sài Gòn (Bến Bạch Đằng → Bình An → Thanh Đa → Hiệp Bình Chánh → Linh Đông).
  - ✈️ **Sân bay Tân Sơn Nhất (SGN)**: Máy bay 3D cất/hạ cánh trên đường băng 25R/25L, hỗ trợ **dữ liệu ADS-B thời gian thực** (tự động dự phòng lịch trình).
  - 🚌 **Xe buýt & VinBus**: Tuyến điện VinBus D4, 152, 109 (sân bay), 01 (Bến Thành – Chợ Lớn).
  - 🗺️ **Metro quy hoạch (Tuyến 2, 3A, 4)**: Bật/tắt layer quy hoạch và chế độ chạy thử tàu tương lai.
- **🎮 Không gian 3D WebGL nhập vai toàn màn hình (`Khám phá`)**:
  - **🚗 Lái xe dạo phố**: Lái xe điện 3D quanh Quận 1, Bến Thành, Thủ Thiêm.
  - **🚶 Đi bộ trong phố**: Tản bộ dọc Phố đi bộ Nguyễn Huệ & Bến Bạch Đằng.
  - **🚇 Đi Metro ngắm phố**: Ngồi ngay buồng lái đầu tàu chui hầm ngầm phát sáng & băng cầu Sài Gòn.
  - **🛸 Lái Drone bay tự do**: Bay lượn 3D quanh **Landmark 81 (461m)**, **Bitexco**, **Cầu Ba Son**, **Chợ Bến Thành** và sông Sài Gòn.
- **📡 Dữ liệu thời gian thực & HUD hiện đại**:
  - Thời tiết TP.HCM trực tiếp qua [Open-Meteo](https://open-meteo.com/) & máy bay thật quanh SGN qua ADS-B.
  - Chế độ ngầm (**Underground Mode**), Ngày/Hoàng hôn/Đêm sao động, Radar trực tiếp, khóa camera theo dõi (**Follow Mode**) và giao diện song ngữ **VI / EN**.

---

## 🚀 Chạy cục bộ / Quick Start

```bash
git clone https://github.com/datnpq/mini-hochiminh-3d.git
cd mini-hochiminh-3d
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

### Phím tắt trong chế độ Khám phá 3D (`🎮 Khám phá`)

| Phím / Controls | Chức năng / Action |
|---|---|
| `W` `A` `S` `D` hoặc `↑` `↓` `←` `→` | Di chuyển / lái xe / rẽ hướng |
| `Shift` | Tăng tốc / chạy bộ / Drone Sport Mode |
| `Space` / `E` và `Q` / `C` | Bay lên / hạ độ cao (chế độ Drone) |
| Kéo chuột (Mouse Drag) | Xoay góc nhìn 360° xung quanh |
| `ESC` | Thoát về bản đồ tổng quan 3D |

---

## 🗂️ Cấu trúc dự án / Architecture

```text
src/
├── data/                 # Dữ liệu tuyến, ga, tọa độ & ngôn ngữ (dễ mở rộng nhất!)
│   ├── metro.ts          # Metro số 1 & các tuyến Metro quy hoạch (2, 3A, 4)
│   ├── waterbus.ts       # Saigon Waterbus trên sông Sài Gòn
│   ├── buses.ts          # Các tuyến xe buýt & VinBus
│   ├── flights.ts        # Đường băng & lịch trình sân bay Tân Sơn Nhất (SGN)
│   ├── presets.ts        # Các góc nhìn camera nhanh
│   └── i18n.ts           # Từ điển song ngữ Việt / Anh
├── engine/
│   ├── MapController.ts      # MapLibre GL JS + OpenFreeMap + các layer GeoJSON
│   ├── ThreeLayer.ts         # Custom WebGL 3D layer gắn lên MapLibre
│   ├── ImmersiveWorld.ts     # Thế giới 3D WebGL Three.js toàn màn hình (Khám phá)
│   ├── ImmersiveLandmarks.ts # Mô hình 3D Landmark 81, Bitexco, Cầu Ba Son, Chợ Bến Thành...
│   ├── VehicleModels.ts      # Mô hình 3D tàu Metro, Waterbus, Bus, Máy bay, Xe, Drone
│   ├── Simulator.ts          # Bộ mô phỏng lịch trình & động học phương tiện
│   ├── PlayerController.ts   # Điều khiển vật lý Drive / Walk / Metro Ride / Drone
│   ├── LiveData.ts           # Kết nối thời tiết Open-Meteo & máy bay ADS-B
│   ├── Clock.ts              # Đồng hồ mô phỏng giờ Việt Nam (ICT / UTC+7)
│   └── geo.ts                # Nội suy tọa độ địa lý & khoảng cách Haversine
└── ui/
    └── HUD.ts                # Giao diện HUD, Radar trực tiếp, Pilot Controls
```

---

## 🗺️ Lộ trình cộng đồng / Community Roadmap

Rất hoan nghênh mọi đóng góp (Issue / PR) từ cộng đồng lập trình viên & người yêu thích đô thị TP.HCM!

- [ ] Thêm các công trình biểu tượng 3D: Nhà thờ Đức Bà, Bưu điện Thành phố, Dinh Độc Lập, Cầu Phú Mỹ, Nhà ga T3 Tân Sơn Nhất
- [ ] Thêm nhiều tuyến xe buýt TP.HCM thực tế & dữ liệu GTFS mở
- [ ] Tích hợp dữ liệu GPS xe buýt / tàu thời gian thực (khi có nguồn dữ liệu mở)
- [ ] Thêm hiệu ứng thời tiết 3D (mưa rào Sài Gòn đồng bộ theo Open-Meteo)
- [ ] Hỗ trợ cảm ứng joystick mượt hơn trên điện thoại & chế độ VR/WebXR
- [ ] Bổ sung âm thanh môi trường tùy chọn (tiếng tàu Metro, sóng sông Sài Gòn, động cơ Drone)

---

## 🤝 Đóng góp / Contributing

Xem hướng dẫn chi tiết tại [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách thêm tuyến xe buýt mới, thêm công trình 3D Sài Gòn hoặc sửa lỗi chỉ trong vài phút!

---

## 🙏 Cảm ơn / Credits

- Lấy cảm hứng từ dự án tuyệt vời [Mini Tokyo 3D](https://github.com/nagix/mini-tokyo-3d) của **Akihiko Kusanagi**.
- Bản đồ vector & dữ liệu tòa nhà 3D miễn phí từ [OpenFreeMap](https://openfreemap.org/) & cộng đồng [OpenStreetMap](https://www.openstreetmap.org/).
- Dữ liệu thời tiết thời gian thực từ [Open-Meteo](https://open-meteo.com/).

Phát hành theo giấy phép [MIT License](LICENSE).
