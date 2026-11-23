import type { CameraPreset } from '../types';

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    name: { vi: 'Trung tâm TP.HCM', en: 'HCMC Overview' },
    center: [106.706, 10.785],
    zoom: 13.4,
    pitch: 58,
    bearing: -24,
    underground: false
  },
  {
    id: 'metro1',
    name: { vi: 'Metro số 1 • Sông Sài Gòn', en: 'Metro 1 • Saigon Bridge' },
    center: [106.727, 10.799],
    zoom: 14.8,
    pitch: 62,
    bearing: 32,
    underground: false
  },
  {
    id: 'benthanh-subway',
    name: { vi: 'Ga ngầm Bến Thành', en: 'Ben Thanh Subway' },
    center: [106.702, 10.775],
    zoom: 15.6,
    pitch: 60,
    bearing: -15,
    underground: true
  },
  {
    id: 'waterbus',
    name: { vi: 'Bến Bạch Đằng & Landmark 81', en: 'Bach Dang & Landmark 81' },
    center: [106.716, 10.786],
    zoom: 14.6,
    pitch: 64,
    bearing: 18,
    underground: false
  },
  {
    id: 'sgn',
    name: { vi: 'Sân bay Tân Sơn Nhất (SGN)', en: 'Tan Son Nhat Airport' },
    center: [106.663, 10.818],
    zoom: 14.2,
    pitch: 58,
    bearing: -75,
    underground: false
  }
];
