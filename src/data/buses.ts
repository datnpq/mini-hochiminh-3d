import type { TransitRoute } from '../types';

export const BUS_ROUTES: TransitRoute[] = [
  {
    id: 'bus-d4',
    code: 'D4',
    kind: 'bus',
    name: {
      vi: 'VinBus D4 (Vinhomes Grand Park – Bến xe buýt Sài Gòn)',
      en: 'VinBus D4 (Vinhomes Grand Park – Saigon Bus Station)'
    },
    operator: {
      vi: 'VinBus • Xe buýt điện',
      en: 'VinBus • Electric Bus'
    },
    color: '#22c55e',
    accentColor: '#86efac',
    headwaySec: 600,
    startHour: 5,
    endHour: 22,
    cruiseSpeedKmh: 34,
    dwellSec: 20,
    stations: [
      { id: 'd4-01', code: 'D4-1', name: { vi: 'Bến xe buýt Sài Gòn (23/9)', en: 'Saigon Bus Station (23/9 Park)' }, coord: [106.6952, 10.7689], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] },
      { id: 'd4-02', code: 'D4-2', name: { vi: 'Hàm Nghi – Bến Thành', en: 'Ham Nghi – Ben Thanh' }, coord: [106.7016, 10.7707], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] },
      { id: 'd4-03', code: 'D4-3', name: { vi: 'Hầm Thủ Thiêm / Mai Chí Thọ', en: 'Thu Thiem / Mai Chi Tho' }, coord: [106.7265, 10.7795], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] },
      { id: 'd4-04', code: 'D4-4', name: { vi: 'An Phú – Võ Nguyên Giáp', en: 'An Phu – Vo Nguyen Giap' }, coord: [106.7478, 10.7990], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] },
      { id: 'd4-05', code: 'D4-5', name: { vi: 'Ngã tư Thủ Đức', en: 'Thu Duc Intersection' }, coord: [106.7745, 10.8482], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] },
      { id: 'd4-06', code: 'D4-6', name: { vi: 'Vinhomes Grand Park', en: 'Vinhomes Grand Park' }, coord: [106.8355, 10.8422], altitude: 1, elevationType: 'ground', lineIds: ['bus-d4'] }
    ],
    path: [
      { coord: [106.6952, 10.7689], altitude: 1 },
      { coord: [106.7016, 10.7707], altitude: 1 },
      { coord: [106.7075, 10.7695], altitude: 1 },
      { coord: [106.7165, 10.7742], altitude: 1 },
      { coord: [106.7265, 10.7795], altitude: 1 },
      { coord: [106.7382, 10.7888], altitude: 1 },
      { coord: [106.7478, 10.7990], altitude: 1 },
      { coord: [106.7625, 10.8185], altitude: 1 },
      { coord: [106.7745, 10.8482], altitude: 1 },
      { coord: [106.7980, 10.8460], altitude: 1 },
      { coord: [106.8185, 10.8442], altitude: 1 },
      { coord: [106.8355, 10.8422], altitude: 1 }
    ]
  },
  {
    id: 'bus-152',
    code: '152',
    kind: 'bus',
    name: {
      vi: 'Xe buýt 152 (Sân bay Tân Sơn Nhất – Bến Thành – Trung Sơn)',
      en: 'Bus 152 (Tan Son Nhat Airport – Ben Thanh – Trung Son)'
    },
    operator: {
      vi: 'Sài Gòn Bus • Tuyến Sân bay',
      en: 'Saigon Bus • Airport Route'
    },
    color: '#0ea5e9',
    accentColor: '#7dd3fc',
    headwaySec: 660,
    startHour: 5.5,
    endHour: 20,
    cruiseSpeedKmh: 28,
    dwellSec: 20,
    stations: [
      { id: 'b152-01', code: '152-1', name: { vi: 'Sân bay Tân Sơn Nhất', en: 'Tan Son Nhat Airport' }, coord: [106.6645, 10.8148], altitude: 1, elevationType: 'ground', lineIds: ['bus-152', 'bus-109'] },
      { id: 'b152-02', code: '152-2', name: { vi: 'Công viên Hoàng Văn Thụ', en: 'Hoang Van Thu Park' }, coord: [106.6662, 10.8005], altitude: 1, elevationType: 'ground', lineIds: ['bus-152', 'bus-109'] },
      { id: 'b152-03', code: '152-3', name: { vi: 'Nguyễn Văn Trỗi – Nam Kỳ Khởi Nghĩa', en: 'Nguyen Van Troi – NKKN' }, coord: [106.6788, 10.7924], altitude: 1, elevationType: 'ground', lineIds: ['bus-152'] },
      { id: 'b152-04', code: '152-4', name: { vi: 'Dinh Độc Lập – Bến Thành', en: 'Independence Palace – Ben Thanh' }, coord: [106.6970, 10.7720], altitude: 1, elevationType: 'ground', lineIds: ['bus-152'] },
      { id: 'b152-05', code: '152-5', name: { vi: 'KDC Trung Sơn (Quận 8)', en: 'Trung Son Residential' }, coord: [106.6885, 10.7355], altitude: 1, elevationType: 'ground', lineIds: ['bus-152'] }
    ],
    path: [
      { coord: [106.6645, 10.8148], altitude: 1 },
      { coord: [106.6652, 10.8075], altitude: 1 },
      { coord: [106.6662, 10.8005], altitude: 1 },
      { coord: [106.6725, 10.7965], altitude: 1 },
      { coord: [106.6788, 10.7924], altitude: 1 },
      { coord: [106.6875, 10.7852], altitude: 1 },
      { coord: [106.6945, 10.7778], altitude: 1 },
      { coord: [106.6970, 10.7720], altitude: 1 },
      { coord: [106.6928, 10.7640], altitude: 1 },
      { coord: [106.6902, 10.7510], altitude: 1 },
      { coord: [106.6885, 10.7355], altitude: 1 }
    ]
  },
  {
    id: 'bus-109',
    code: '109',
    kind: 'bus',
    name: {
      vi: 'Xe buýt 109 (Sân bay Tân Sơn Nhất – Công viên 23/9)',
      en: 'Bus 109 (Tan Son Nhat Airport – 23/9 Park)'
    },
    operator: {
      vi: 'Phương Trang • Airport Express',
      en: 'Futa Bus • Airport Express'
    },
    color: '#eab308',
    accentColor: '#fef08a',
    headwaySec: 720,
    startHour: 5.5,
    endHour: 23.5,
    cruiseSpeedKmh: 30,
    dwellSec: 20,
    stations: [
      { id: 'b109-01', code: '109-1', name: { vi: 'Sân bay Tân Sơn Nhất', en: 'Tan Son Nhat Airport' }, coord: [106.6645, 10.8148], altitude: 1, elevationType: 'ground', lineIds: ['bus-109'] },
      { id: 'b109-02', code: '109-2', name: { vi: 'Võ Thị Sáu – Hai Bà Trưng', en: 'Vo Thi Sau – Hai Ba Trung' }, coord: [106.6922, 10.7865], altitude: 1, elevationType: 'ground', lineIds: ['bus-109'] },
      { id: 'b109-03', code: '109-3', name: { vi: 'Nhà thờ Đức Bà', en: 'Notre-Dame Cathedral' }, coord: [106.6990, 10.7798], altitude: 1, elevationType: 'ground', lineIds: ['bus-109'] },
      { id: 'b109-04', code: '109-4', name: { vi: 'Công viên 23/9', en: '23/9 Park' }, coord: [106.6938, 10.7685], altitude: 1, elevationType: 'ground', lineIds: ['bus-109'] }
    ],
    path: [
      { coord: [106.6645, 10.8148], altitude: 1 },
      { coord: [106.6662, 10.8005], altitude: 1 },
      { coord: [106.6788, 10.7924], altitude: 1 },
      { coord: [106.6922, 10.7865], altitude: 1 },
      { coord: [106.6990, 10.7798], altitude: 1 },
      { coord: [106.6995, 10.7732], altitude: 1 },
      { coord: [106.6938, 10.7685], altitude: 1 }
    ]
  },
  {
    id: 'bus-01',
    code: '01',
    kind: 'bus',
    name: {
      vi: 'Xe buýt 01 (Bến Thành – Bến xe Chợ Lớn)',
      en: 'Bus 01 (Ben Thanh – Cho Lon Bus Station)'
    },
    operator: {
      vi: 'Sài Gòn Bus • Tuyến Trung tâm – Chợ Lớn',
      en: 'Saigon Bus • Downtown – Cholon'
    },
    color: '#06b6d4',
    accentColor: '#67e8f9',
    headwaySec: 540,
    startHour: 5,
    endHour: 21,
    cruiseSpeedKmh: 25,
    dwellSec: 18,
    stations: [
      { id: 'b01-01', code: '01-1', name: { vi: 'Bến Thành', en: 'Ben Thanh' }, coord: [106.6975, 10.7705], altitude: 1, elevationType: 'ground', lineIds: ['bus-01'] },
      { id: 'b01-02', code: '01-2', name: { vi: 'Trần Hưng Đạo – Nguyễn Văn Cừ', en: 'Tran Hung Dao – Nguyen Van Cu' }, coord: [106.6845, 10.7588], altitude: 1, elevationType: 'ground', lineIds: ['bus-01'] },
      { id: 'b01-03', code: '01-3', name: { vi: 'Bệnh viện Chấn thương Chỉnh hình', en: 'Trauma Hospital (District 5)' }, coord: [106.6710, 10.7545], altitude: 1, elevationType: 'ground', lineIds: ['bus-01'] },
      { id: 'b01-04', code: '01-4', name: { vi: 'Bến xe Chợ Lớn (Bình Tây)', en: 'Cho Lon Bus Station' }, coord: [106.6525, 10.7510], altitude: 1, elevationType: 'ground', lineIds: ['bus-01'] }
    ],
    path: [
      { coord: [106.6975, 10.7705], altitude: 1 },
      { coord: [106.6915, 10.7642], altitude: 1 },
      { coord: [106.6845, 10.7588], altitude: 1 },
      { coord: [106.6780, 10.7562], altitude: 1 },
      { coord: [106.6710, 10.7545], altitude: 1 },
      { coord: [106.6615, 10.7528], altitude: 1 },
      { coord: [106.6525, 10.7510], altitude: 1 }
    ]
  }
];
