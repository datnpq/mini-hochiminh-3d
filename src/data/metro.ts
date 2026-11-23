import type { TransitRoute } from '../types';

export const METRO_LINE_1: TransitRoute = {
  id: 'metro-1',
  code: 'M1',
  kind: 'metro',
  name: {
    vi: 'Tuyến Metro số 1 (Bến Thành – Suối Tiên)',
    en: 'Metro Line 1 (Ben Thanh – Suoi Tien)'
  },
  operator: {
    vi: 'HURC1 • Đường sắt Đô thị TP.HCM',
    en: 'HURC1 • HCMC Urban Railways'
  },
  color: '#0077c8',
  accentColor: '#38bdf8',
  planned: false,
  headwaySec: 270, // 4.5 minutes peak headway
  startHour: 5,
  endHour: 22.5,
  cruiseSpeedKmh: 62,
  dwellSec: 28,
  cars: 3,
  stations: [
    {
      id: 'm1-01',
      code: 'L1-01',
      name: { vi: 'Bến Thành', en: 'Ben Thanh' },
      coord: [106.6979, 10.7711],
      altitude: -20,
      elevationType: 'underground',
      lineIds: ['metro-1', 'metro-2', 'metro-3a', 'metro-4']
    },
    {
      id: 'm1-02',
      code: 'L1-02',
      name: { vi: 'Nhà hát Thành phố', en: 'Opera House' },
      coord: [106.7032, 10.7766],
      altitude: -22,
      elevationType: 'underground',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-03',
      code: 'L1-03',
      name: { vi: 'Ba Son', en: 'Ba Son' },
      coord: [106.7082, 10.7817],
      altitude: -16,
      elevationType: 'underground',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-04',
      code: 'L1-04',
      name: { vi: 'Công viên Văn Thánh', en: 'Van Thanh Park' },
      coord: [106.7156, 10.7959],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-05',
      code: 'L1-05',
      name: { vi: 'Tân Cảng', en: 'Tan Cang' },
      coord: [106.7233, 10.7985],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-06',
      code: 'L1-06',
      name: { vi: 'Thảo Điền', en: 'Thao Dien' },
      coord: [106.7336, 10.8005],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-07',
      code: 'L1-07',
      name: { vi: 'An Phú', en: 'An Phu' },
      coord: [106.7422, 10.8020],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-08',
      code: 'L1-08',
      name: { vi: 'Rạch Chiếc', en: 'Rach Chiec' },
      coord: [106.7556, 10.8086],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-09',
      code: 'L1-09',
      name: { vi: 'Phước Long', en: 'Phuoc Long' },
      coord: [106.7654, 10.8213],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-10',
      code: 'L1-10',
      name: { vi: 'Bình Thái', en: 'Binh Thai' },
      coord: [106.7745, 10.8327],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-11',
      code: 'L1-11',
      name: { vi: 'Thủ Đức', en: 'Thu Duc' },
      coord: [106.7798, 10.8464],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-12',
      code: 'L1-12',
      name: { vi: 'Khu Công nghệ cao', en: 'High Tech Park' },
      coord: [106.7897, 10.8588],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-13',
      code: 'L1-13',
      name: { vi: 'Đại học Quốc gia', en: 'National University' },
      coord: [106.8025, 10.8663],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    },
    {
      id: 'm1-14',
      code: 'L1-14',
      name: { vi: 'Bến xe Suối Tiên', en: 'Suoi Tien Terminal' },
      coord: [106.8141, 10.8794],
      altitude: 12,
      elevationType: 'elevated',
      lineIds: ['metro-1']
    }
  ],
  path: [
    // Underground section: Ben Thanh -> Le Loi -> Opera House -> Ba Son
    { coord: [106.6979, 10.7711], altitude: -20, underground: true },
    { coord: [106.7008, 10.7739], altitude: -21, underground: true },
    { coord: [106.7032, 10.7766], altitude: -22, underground: true },
    { coord: [106.7058, 10.7791], altitude: -19, underground: true },
    { coord: [106.7082, 10.7817], altitude: -16, underground: true },
    // Portal ramp emerging along Nguyen Huu Canh -> Van Thanh
    { coord: [106.7105, 10.7852], altitude: -8, underground: true },
    { coord: [106.7124, 10.7888], altitude: 0, underground: false },
    { coord: [106.7140, 10.7924], altitude: 8, underground: false },
    // Elevated viaduct: Van Thanh -> Tan Cang -> Saigon Bridge -> Vo Nguyen Giap
    { coord: [106.7156, 10.7959], altitude: 12, underground: false },
    { coord: [106.7195, 10.7975], altitude: 12, underground: false },
    { coord: [106.7233, 10.7985], altitude: 12, underground: false },
    { coord: [106.7279, 10.7995], altitude: 15, underground: false }, // Crossing Saigon River
    { coord: [106.7336, 10.8005], altitude: 12, underground: false },
    { coord: [106.7422, 10.8020], altitude: 12, underground: false },
    { coord: [106.7485, 10.8042], altitude: 12, underground: false },
    { coord: [106.7556, 10.8086], altitude: 12, underground: false },
    { coord: [106.7604, 10.8148], altitude: 12, underground: false },
    { coord: [106.7654, 10.8213], altitude: 12, underground: false },
    { coord: [106.7700, 10.8271], altitude: 12, underground: false },
    { coord: [106.7745, 10.8327], altitude: 12, underground: false },
    { coord: [106.7774, 10.8396], altitude: 12, underground: false },
    { coord: [106.7798, 10.8464], altitude: 12, underground: false },
    { coord: [106.7846, 10.8531], altitude: 12, underground: false },
    { coord: [106.7897, 10.8588], altitude: 12, underground: false },
    { coord: [106.7962, 10.8628], altitude: 12, underground: false },
    { coord: [106.8025, 10.8663], altitude: 12, underground: false },
    { coord: [106.8086, 10.8726], altitude: 12, underground: false },
    { coord: [106.8141, 10.8794], altitude: 12, underground: false }
  ]
};

export const PLANNED_METRO_LINES: TransitRoute[] = [
  {
    id: 'metro-2',
    code: 'M2',
    kind: 'future-metro',
    name: {
      vi: 'Tuyến Metro số 2 (Bến Thành – Tham Lương)',
      en: 'Metro Line 2 (Ben Thanh – Tham Luong)'
    },
    operator: {
      vi: 'MAUR • Quy hoạch (Đang triển khai)',
      en: 'MAUR • Planned / Under Construction'
    },
    color: '#f97316',
    accentColor: '#fdba74',
    planned: true,
    headwaySec: 540,
    startHour: 5.5,
    endHour: 22,
    cruiseSpeedKmh: 58,
    dwellSec: 25,
    cars: 3,
    stations: [
      { id: 'm2-01', code: 'L2-01', name: { vi: 'Bến Thành', en: 'Ben Thanh' }, coord: [106.6979, 10.7711], altitude: -26, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-02', code: 'L2-02', name: { vi: 'Tao Đàn', en: 'Tao Dan' }, coord: [106.6908, 10.7736], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-03', code: 'L2-03', name: { vi: 'Dân Chủ', en: 'Dan Chu' }, coord: [106.6820, 10.7776], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-04', code: 'L2-04', name: { vi: 'Hòa Hưng', en: 'Hoa Hung' }, coord: [106.6752, 10.7825], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-05', code: 'L2-05', name: { vi: 'Lê Thị Riêng', en: 'Le Thi Rieng' }, coord: [106.6665, 10.7867], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-06', code: 'L2-06', name: { vi: 'Phạm Văn Hai', en: 'Pham Van Hai' }, coord: [106.6594, 10.7915], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-07', code: 'L2-07', name: { vi: 'Bảy Hiền', en: 'Bay Hien' }, coord: [106.6531, 10.7938], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-08', code: 'L2-08', name: { vi: 'Nguyễn Hồng Đào', en: 'Nguyen Hong Dao' }, coord: [106.6435, 10.7995], altitude: -22, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-09', code: 'L2-09', name: { vi: 'Bà Quẹo', en: 'Ba Queo' }, coord: [106.6345, 10.8055], altitude: -20, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-10', code: 'L2-10', name: { vi: 'Phạm Văn Bạch', en: 'Pham Van Bach' }, coord: [106.6285, 10.8164], altitude: -16, elevationType: 'underground', lineIds: ['metro-2'] },
      { id: 'm2-11', code: 'L2-11', name: { vi: 'Tân Bình (Tham Lương)', en: 'Tan Binh (Tham Luong)' }, coord: [106.6242, 10.8286], altitude: 10, elevationType: 'elevated', lineIds: ['metro-2'] }
    ],
    path: [
      { coord: [106.6979, 10.7711], altitude: -26, underground: true },
      { coord: [106.6908, 10.7736], altitude: -22, underground: true },
      { coord: [106.6820, 10.7776], altitude: -22, underground: true },
      { coord: [106.6752, 10.7825], altitude: -22, underground: true },
      { coord: [106.6665, 10.7867], altitude: -22, underground: true },
      { coord: [106.6594, 10.7915], altitude: -22, underground: true },
      { coord: [106.6531, 10.7938], altitude: -22, underground: true },
      { coord: [106.6435, 10.7995], altitude: -22, underground: true },
      { coord: [106.6345, 10.8055], altitude: -20, underground: true },
      { coord: [106.6285, 10.8164], altitude: -14, underground: true },
      { coord: [106.6260, 10.8225], altitude: 2, underground: false },
      { coord: [106.6242, 10.8286], altitude: 10, underground: false }
    ]
  },
  {
    id: 'metro-3a',
    code: 'M3A',
    kind: 'future-metro',
    name: {
      vi: 'Tuyến Metro số 3A (Bến Thành – Tân Kiên)',
      en: 'Metro Line 3A (Ben Thanh – Tan Kien)'
    },
    operator: {
      vi: 'MAUR • Quy hoạch tương lai',
      en: 'MAUR • Future Planned Line'
    },
    color: '#ef4444',
    accentColor: '#fca5a5',
    planned: true,
    headwaySec: 600,
    startHour: 5.5,
    endHour: 22,
    cruiseSpeedKmh: 56,
    dwellSec: 25,
    cars: 3,
    stations: [
      { id: 'm3-01', code: 'L3-01', name: { vi: 'Bến Thành', en: 'Ben Thanh' }, coord: [106.6979, 10.7711], altitude: -24, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-02', code: 'L3-02', name: { vi: 'Phạm Ngũ Lão', en: 'Pham Ngu Lao' }, coord: [106.6915, 10.7686], altitude: -20, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-03', code: 'L3-03', name: { vi: 'Cộng Hòa (Ngã 6)', en: 'Cong Hoa Roundabout' }, coord: [106.6812, 10.7646], altitude: -20, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-04', code: 'L3-04', name: { vi: 'Bệnh viện Chợ Rẫy', en: 'Cho Ray Hospital' }, coord: [106.6624, 10.7574], altitude: -20, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-05', code: 'L3-05', name: { vi: 'Cây Gõ', en: 'Cay Go' }, coord: [106.6472, 10.7538], altitude: -18, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-06', code: 'L3-06', name: { vi: 'Phú Lâm', en: 'Phu Lam' }, coord: [106.6328, 10.7501], altitude: -16, elevationType: 'underground', lineIds: ['metro-3a'] },
      { id: 'm3-07', code: 'L3-07', name: { vi: 'Bến xe Miền Tây', en: 'Mien Tay Bus Terminal' }, coord: [106.6186, 10.7408], altitude: 11, elevationType: 'elevated', lineIds: ['metro-3a'] },
      { id: 'm3-08', code: 'L3-08', name: { vi: 'An Lạc', en: 'An Lac' }, coord: [106.6075, 10.7312], altitude: 11, elevationType: 'elevated', lineIds: ['metro-3a'] }
    ],
    path: [
      { coord: [106.6979, 10.7711], altitude: -24, underground: true },
      { coord: [106.6915, 10.7686], altitude: -20, underground: true },
      { coord: [106.6812, 10.7646], altitude: -20, underground: true },
      { coord: [106.6710, 10.7606], altitude: -20, underground: true },
      { coord: [106.6624, 10.7574], altitude: -20, underground: true },
      { coord: [106.6472, 10.7538], altitude: -18, underground: true },
      { coord: [106.6328, 10.7501], altitude: -16, underground: true },
      { coord: [106.6250, 10.7455], altitude: 0, underground: false },
      { coord: [106.6186, 10.7408], altitude: 11, underground: false },
      { coord: [106.6075, 10.7312], altitude: 11, underground: false }
    ]
  },
  {
    id: 'metro-4',
    code: 'M4',
    kind: 'future-metro',
    name: {
      vi: 'Tuyến Metro số 4 (Thạnh Xuân – Phú Mỹ Hưng)',
      en: 'Metro Line 4 (Thanh Xuan – Phu My Hung)'
    },
    operator: {
      vi: 'MAUR • Quy hoạch tương lai',
      en: 'MAUR • Future Planned Line'
    },
    color: '#10b981',
    accentColor: '#6ee7b7',
    planned: true,
    headwaySec: 600,
    startHour: 5.5,
    endHour: 22,
    cruiseSpeedKmh: 58,
    dwellSec: 25,
    cars: 3,
    stations: [
      { id: 'm4-01', code: 'L4-01', name: { vi: 'Thạnh Xuân', en: 'Thanh Xuan' }, coord: [106.6820, 10.8675], altitude: 12, elevationType: 'elevated', lineIds: ['metro-4'] },
      { id: 'm4-02', code: 'L4-02', name: { vi: 'Gò Vấp', en: 'Go Vap' }, coord: [106.6780, 10.8320], altitude: 12, elevationType: 'elevated', lineIds: ['metro-4'] },
      { id: 'm4-03', code: 'L4-03', name: { vi: 'Công viên Gia Định', en: 'Gia Dinh Park' }, coord: [106.6776, 10.8128], altitude: -18, elevationType: 'underground', lineIds: ['metro-4'] },
      { id: 'm4-04', code: 'L4-04', name: { vi: 'Phú Nhuận', en: 'Phu Nhuan' }, coord: [106.6838, 10.7985], altitude: -20, elevationType: 'underground', lineIds: ['metro-4'] },
      { id: 'm4-05', code: 'L4-05', name: { vi: 'Tân Định', en: 'Tan Dinh' }, coord: [106.6902, 10.7892], altitude: -22, elevationType: 'underground', lineIds: ['metro-4'] },
      { id: 'm4-06', code: 'L4-06', name: { vi: 'Bến Thành', en: 'Ben Thanh' }, coord: [106.6979, 10.7711], altitude: -28, elevationType: 'underground', lineIds: ['metro-4'] },
      { id: 'm4-07', code: 'L4-07', name: { vi: 'Khánh Hội (Quận 4)', en: 'Khanh Hoi (District 4)' }, coord: [106.7010, 10.7582], altitude: -20, elevationType: 'underground', lineIds: ['metro-4'] },
      { id: 'm4-08', code: 'L4-08', name: { vi: 'Tân Hưng (Quận 7)', en: 'Tan Hung (District 7)' }, coord: [106.7016, 10.7422], altitude: 12, elevationType: 'elevated', lineIds: ['metro-4'] },
      { id: 'm4-09', code: 'L4-09', name: { vi: 'Phú Mỹ Hưng', en: 'Phu My Hung' }, coord: [106.7032, 10.7265], altitude: 12, elevationType: 'elevated', lineIds: ['metro-4'] }
    ],
    path: [
      { coord: [106.6820, 10.8675], altitude: 12, underground: false },
      { coord: [106.6805, 10.8485], altitude: 12, underground: false },
      { coord: [106.6780, 10.8320], altitude: 12, underground: false },
      { coord: [106.6778, 10.8215], altitude: 0, underground: false },
      { coord: [106.6776, 10.8128], altitude: -18, underground: true },
      { coord: [106.6838, 10.7985], altitude: -20, underground: true },
      { coord: [106.6902, 10.7892], altitude: -22, underground: true },
      { coord: [106.6952, 10.7800], altitude: -24, underground: true },
      { coord: [106.6979, 10.7711], altitude: -28, underground: true },
      { coord: [106.7010, 10.7582], altitude: -20, underground: true },
      { coord: [106.7013, 10.7495], altitude: 0, underground: false },
      { coord: [106.7016, 10.7422], altitude: 12, underground: false },
      { coord: [106.7032, 10.7265], altitude: 12, underground: false }
    ]
  }
];
