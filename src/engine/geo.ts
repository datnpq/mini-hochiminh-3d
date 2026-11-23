import type { TrackPoint } from '../types';

const EARTH_RADIUS_M = 6371000;
const DEG2RAD = Math.PI / 180;

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const dLat = (b[1] - a[1]) * DEG2RAD;
  const dLng = (b[0] - a[0]) * DEG2RAD;
  const lat1 = a[1] * DEG2RAD;
  const lat2 = b[1] * DEG2RAD;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeBearingRad(a: [number, number], b: [number, number]): number {
  const lat1 = a[1] * DEG2RAD;
  const lat2 = b[1] * DEG2RAD;
  const dLng = (b[0] - a[0]) * DEG2RAD;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x); // 0 = North, +PI/2 = East
}

export interface SampledPath {
  points: TrackPoint[];
  cumDist: number[]; // cumulative horizontal distance in meters
  totalDist: number;
}

export interface PathSample {
  lng: number;
  lat: number;
  altitude: number;
  bearing: number;
  pitch: number;
  underground: boolean;
}

export function buildSampledPath(points: TrackPoint[]): SampledPath {
  const cumDist: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversineMeters(points[i - 1].coord, points[i].coord);
    total += Math.max(0.1, d);
    cumDist.push(total);
  }
  return { points, cumDist, totalDist: total };
}

export function samplePathAtDistance(
  sp: SampledPath,
  distMeters: number,
  reverse = false
): PathSample {
  const clamped = Math.max(0, Math.min(sp.totalDist, distMeters));
  const d = reverse ? sp.totalDist - clamped : clamped;

  // Binary search in cumDist
  let lo = 0;
  let hi = sp.cumDist.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (sp.cumDist[mid] <= d) lo = mid;
    else hi = mid;
  }

  const p0 = sp.points[lo];
  const p1 = sp.points[hi];
  const segLen = Math.max(0.001, sp.cumDist[hi] - sp.cumDist[lo]);
  const t = Math.max(0, Math.min(1, (d - sp.cumDist[lo]) / segLen));

  const lng = p0.coord[0] + (p1.coord[0] - p0.coord[0]) * t;
  const lat = p0.coord[1] + (p1.coord[1] - p0.coord[1]) * t;
  const altitude = p0.altitude + (p1.altitude - p0.altitude) * t;
  const dAlt = reverse ? p0.altitude - p1.altitude : p1.altitude - p0.altitude;

  let bearing = computeBearingRad(p0.coord, p1.coord);
  if (reverse) bearing += Math.PI;

  const pitch = Math.atan2(dAlt, segLen);
  const underground = altitude < -2 || Boolean(t < 0.5 ? p0.underground : p1.underground);

  return { lng, lat, altitude, bearing, pitch, underground };
}

export function projectCoordToPathDist(sp: SampledPath, coord: [number, number]): number {
  let bestDist = 0;
  let bestErr = Infinity;
  for (let i = 0; i < sp.points.length; i++) {
    const err = haversineMeters(sp.points[i].coord, coord);
    if (err < bestErr) {
      bestErr = err;
      bestDist = sp.cumDist[i];
    }
  }
  return bestDist;
}
