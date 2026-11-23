import type { FlightRoute, LocalizedText, TrackPoint } from '../types';

// Tan Son Nhat International Airport (SGN / VVTS)
// Runway 25R/07L: East threshold [106.6708, 10.8195] -> West end [106.6435, 10.8205]
// Runway 25L/07R: East threshold [106.6765, 10.8160] -> West end [106.6435, 10.8172]
export const SGN_RUNWAYS = {
  rwy25R: [
    [106.6708, 10.8195],
    [106.6435, 10.8205]
  ] as [number, number][],
  rwy25L: [
    [106.6765, 10.8160],
    [106.6435, 10.8172]
  ] as [number, number][],
  terminal: [106.6632, 10.8138] as [number, number]
};

// Realistic 3-degree glideslope approach from the East (over Thu Duc / Go Vap) onto Runway 25R
function makeArrivalPath(runway: '25R' | '25L'): TrackPoint[] {
  const latOffset = runway === '25R' ? 0 : -0.0034;
  return [
    { coord: [106.820, 10.8135 + latOffset], altitude: 920 },
    { coord: [106.780, 10.8152 + latOffset], altitude: 680 },
    { coord: [106.745, 10.8166 + latOffset], altitude: 470 },
    { coord: [106.715, 10.8178 + latOffset], altitude: 280 },
    { coord: [106.690, 10.8188 + latOffset], altitude: 130 },
    { coord: [106.674, 10.8194 + latOffset], altitude: 28 },
    { coord: [106.668, 10.8196 + latOffset], altitude: 6 }, // Touchdown
    { coord: [106.658, 10.8200 + latOffset], altitude: 4 }, // Decelerate
    { coord: [106.652, 10.8182 + latOffset], altitude: 3 }, // Exit taxiway
    { coord: [106.662, 10.8152], altitude: 3 } // Gate
  ];
}

// Realistic takeoff from Runway 25L climbing west & banking slightly
function makeDeparturePath(runway: '25R' | '25L', turnNorth: boolean): TrackPoint[] {
  const latOffset = runway === '25R' ? 0 : -0.0034;
  const turn = turnNorth ? 1 : -1;
  return [
    { coord: [106.674, 10.8194 + latOffset], altitude: 3 }, // Line up
    { coord: [106.662, 10.8198 + latOffset], altitude: 4 }, // Takeoff roll
    { coord: [106.650, 10.8202 + latOffset], altitude: 22 }, // Liftoff
    { coord: [106.634, 10.8208 + latOffset], altitude: 150 }, // Initial climb
    { coord: [106.612, 10.8218 + latOffset + turn * 0.004], altitude: 360 },
    { coord: [106.582, 10.8240 + latOffset + turn * 0.015], altitude: 660 },
    { coord: [106.545, 10.8280 + latOffset + turn * 0.032], altitude: 1050 }
  ];
}

interface AirlineSpec {
  code: FlightRoute['airlineCode'];
  airline: string;
  primary: string;
  secondary: string;
  cities: { code: string; name: LocalizedText }[];
}

const AIRLINES: AirlineSpec[] = [
  {
    code: 'VN',
    airline: 'Vietnam Airlines',
    primary: '#006885',
    secondary: '#e6b800',
    cities: [
      { code: 'HAN', name: { vi: 'Hà Nội (HAN)', en: 'Hanoi (HAN)' } },
      { code: 'DAD', name: { vi: 'Đà Nẵng (DAD)', en: 'Da Nang (DAD)' } },
      { code: 'NRT', name: { vi: 'Tokyo Narita (NRT)', en: 'Tokyo Narita (NRT)' } },
      { code: 'PQC', name: { vi: 'Phú Quốc (PQC)', en: 'Phu Quoc (PQC)' } }
    ]
  },
  {
    code: 'VJ',
    airline: 'Vietjet Air',
    primary: '#e11d48',
    secondary: '#facc15',
    cities: [
      { code: 'HAN', name: { vi: 'Hà Nội (HAN)', en: 'Hanoi (HAN)' } },
      { code: 'CXR', name: { vi: 'Nha Trang (CXR)', en: 'Nha Trang (CXR)' } },
      { code: 'ICN', name: { vi: 'Seoul (ICN)', en: 'Seoul (ICN)' } },
      { code: 'DLI', name: { vi: 'Đà Lạt (DLI)', en: 'Da Lat (DLI)' } }
    ]
  },
  {
    code: 'QH',
    airline: 'Bamboo Airways',
    primary: '#0284c7',
    secondary: '#22c55e',
    cities: [
      { code: 'HAN', name: { vi: 'Hà Nội (HAN)', en: 'Hanoi (HAN)' } },
      { code: 'DAD', name: { vi: 'Đà Nẵng (DAD)', en: 'Da Nang (DAD)' } },
      { code: 'UIH', name: { vi: 'Quy Nhơn (UIH)', en: 'Quy Nhon (UIH)' } }
    ]
  },
  {
    code: 'SQ',
    airline: 'Singapore Airlines',
    primary: '#1d4ed8',
    secondary: '#f59e0b',
    cities: [{ code: 'SIN', name: { vi: 'Singapore (SIN)', en: 'Singapore (SIN)' } }]
  },
  {
    code: 'NH',
    airline: 'ANA All Nippon',
    primary: '#1e3a8a',
    secondary: '#38bdf8',
    cities: [{ code: 'HND', name: { vi: 'Tokyo Haneda (HND)', en: 'Tokyo Haneda (HND)' } }]
  }
];

const SGN_LABEL: LocalizedText = {
  vi: 'TP.HCM – Tân Sơn Nhất (SGN)',
  en: 'Ho Chi Minh City (SGN)'
};

export function generateSgnFlightSchedule(): FlightRoute[] {
  const flights: FlightRoute[] = [];
  let seq = 100;

  // Generate steady realistic traffic every 3 minutes from 05:00 to 23:45 (plus a few red-eye flights)
  for (let sec = 0; sec < 86400; sec += 165) {
    const hour = sec / 3600;
    // Lower frequency during 01:00 - 04:45
    if (hour >= 1 && hour < 4.75 && sec % 495 !== 0) continue;

    const spec = AIRLINES[seq % AIRLINES.length];
    const city = spec.cities[seq % spec.cities.length];
    const isArrival = seq % 2 === 0;
    const runway: '25R' | '25L' = isArrival ? '25R' : '25L';
    const flightNum = `${spec.code}${100 + ((seq * 17) % 850)}`;

    flights.push({
      id: `sgn-${seq}`,
      flightNumber: flightNum,
      airline: spec.airline,
      airlineCode: spec.code,
      liveryPrimary: spec.primary,
      liverySecondary: spec.secondary,
      origin: isArrival ? city.name : SGN_LABEL,
      destination: isArrival ? SGN_LABEL : city.name,
      type: isArrival ? 'arrival' : 'departure',
      runway,
      departureSec: sec,
      durationSec: isArrival ? 260 : 210,
      path: isArrival
        ? makeArrivalPath(runway)
        : makeDeparturePath(runway, seq % 4 === 1)
    });
    seq++;
  }

  return flights;
}

export const SGN_FLIGHTS: FlightRoute[] = generateSgnFlightSchedule();
