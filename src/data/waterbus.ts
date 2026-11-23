import type { TransitRoute } from '../types';

export const SAIGON_WATERBUS: TransitRoute = {
  id: 'waterbus-1',
  code: 'SWB1',
  kind: 'waterbus',
  name: {
    vi: 'Saigon Waterbus • Tuyến số 1 (Bạch Đằng – Linh Đông)',
    en: 'Saigon Waterbus • Route 1 (Bach Dang – Linh Dong)'
  },
  operator: {
    vi: 'Saigon Waterbus • Sông Sài Gòn',
    en: 'Saigon Waterbus • Saigon River'
  },
  color: '#f59e0b',
  accentColor: '#fde047',
  planned: false,
  headwaySec: 600, // 10 minutes
  startHour: 6.5,
  endHour: 21.5,
  cruiseSpeedKmh: 26,
  dwellSec: 45,
  stations: [
    {
      id: 'wb-01',
      code: 'WB-01',
      name: { vi: 'Bến Bạch Đằng', en: 'Bach Dang Pier' },
      coord: [106.7068, 10.7734],
      altitude: 1,
      elevationType: 'water',
      lineIds: ['waterbus-1']
    },
    {
      id: 'wb-02',
      code: 'WB-02',
      name: { vi: 'Bến Bình An', en: 'Binh An Pier' },
      coord: [106.7244, 10.7905],
      altitude: 1,
      elevationType: 'water',
      lineIds: ['waterbus-1']
    },
    {
      id: 'wb-03',
      code: 'WB-03',
      name: { vi: 'Bến Thanh Đa', en: 'Thanh Da Pier' },
      coord: [106.7347, 10.8180],
      altitude: 1,
      elevationType: 'water',
      lineIds: ['waterbus-1']
    },
    {
      id: 'wb-04',
      code: 'WB-04',
      name: { vi: 'Bến Hiệp Bình Chánh', en: 'Hiep Binh Chanh Pier' },
      coord: [106.7295, 10.8315],
      altitude: 1,
      elevationType: 'water',
      lineIds: ['waterbus-1']
    },
    {
      id: 'wb-05',
      code: 'WB-05',
      name: { vi: 'Bến Linh Đông', en: 'Linh Dong Pier' },
      coord: [106.7456, 10.8414],
      altitude: 1,
      elevationType: 'water',
      lineIds: ['waterbus-1']
    }
  ],
  // Follows the actual Saigon River channel from District 1 past Landmark 81, Saigon Bridge, Thanh Da peninsula to Linh Dong
  path: [
    { coord: [106.7068, 10.7734], altitude: 1 },
    { coord: [106.7096, 10.7782], altitude: 1 },
    { coord: [106.7128, 10.7832], altitude: 1 },
    { coord: [106.7166, 10.7866], altitude: 1 },
    { coord: [106.7212, 10.7888], altitude: 1 },
    { coord: [106.7244, 10.7905], altitude: 1 },
    { coord: [106.7266, 10.7950], altitude: 1 },
    { coord: [106.7279, 10.7995], altitude: 1 }, // Under Saigon Bridge
    { coord: [106.7302, 10.8055], altitude: 1 },
    { coord: [106.7336, 10.8122], altitude: 1 },
    { coord: [106.7347, 10.8180], altitude: 1 },
    { coord: [106.7332, 10.8246], altitude: 1 },
    { coord: [106.7295, 10.8315], altitude: 1 },
    { coord: [106.7318, 10.8364], altitude: 1 },
    { coord: [106.7385, 10.8396], altitude: 1 },
    { coord: [106.7456, 10.8414], altitude: 1 }
  ]
};
