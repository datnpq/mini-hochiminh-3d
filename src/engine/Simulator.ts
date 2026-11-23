import { BUS_ROUTES } from '../data/buses';
import { SGN_FLIGHTS } from '../data/flights';
import { METRO_LINE_1, PLANNED_METRO_LINES } from '../data/metro';
import { SAIGON_WATERBUS } from '../data/waterbus';
import type {
  ActiveVehicle,
  FlightRoute,
  LayerVisibility,
  Station,
  TransitRoute,
  VehicleCarPose
} from '../types';
import {
  buildSampledPath,
  projectCoordToPathDist,
  samplePathAtDistance,
  type SampledPath
} from './geo';

interface StopTiming {
  station: Station;
  dist: number; // distance from start of this direction
  arriveSec: number; // relative to trip departure
  departSec: number;
}

interface CompiledDirection {
  reverse: boolean;
  stops: StopTiming[];
  totalDurationSec: number;
  directionLabel: { vi: string; en: string };
}

interface CompiledRoute {
  route: TransitRoute;
  sampledPath: SampledPath;
  outbound: CompiledDirection;
  inbound: CompiledDirection;
}

interface CompiledFlight {
  flight: FlightRoute;
  sampledPath: SampledPath;
}

/** Smooth cubic ease-in-out with derivative for speed estimation */
function easeInOutQuad(t: number): { pos: number; velFactor: number } {
  if (t < 0.2) {
    // Accelerate over first 20%
    const u = t / 0.2;
    return { pos: 0.1 * u * u, velFactor: u };
  }
  if (t > 0.8) {
    // Decelerate over last 20%
    const u = (1 - t) / 0.2;
    return { pos: 1 - 0.1 * u * u, velFactor: u };
  }
  // Cruise at constant speed
  return { pos: 0.1 + ((t - 0.2) / 0.6) * 0.8, velFactor: 1.0 };
}

/** Offset a coordinate laterally (to the right of travel direction) by offsetMeters */
function applyLateralOffset(
  lng: number,
  lat: number,
  bearingRad: number,
  offsetMeters: number
): [number, number] {
  if (offsetMeters === 0) return [lng, lat];
  const rightBearing = bearingRad + Math.PI / 2;
  const dNorth = Math.cos(rightBearing) * offsetMeters;
  const dEast = Math.sin(rightBearing) * offsetMeters;
  const metersPerDegLat = 110574;
  const metersPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  return [lng + dEast / metersPerDegLng, lat + dNorth / metersPerDegLat];
}

export class TransitSimulator {
  private compiledRoutes: CompiledRoute[] = [];
  private compiledFlights: CompiledFlight[] = [];

  constructor() {
    const allRoutes: TransitRoute[] = [
      METRO_LINE_1,
      ...PLANNED_METRO_LINES,
      SAIGON_WATERBUS,
      ...BUS_ROUTES
    ];

    for (const route of allRoutes) {
      this.compiledRoutes.push(this.compileRoute(route));
    }

    for (const flight of SGN_FLIGHTS) {
      this.compiledFlights.push({
        flight,
        sampledPath: buildSampledPath(flight.path)
      });
    }
  }

  private compileRoute(route: TransitRoute): CompiledRoute {
    const sampledPath = buildSampledPath(route.path);
    const stationDists = route.stations.map((st) => ({
      station: st,
      dist: projectCoordToPathDist(sampledPath, st.coord)
    }));

    const buildDir = (reverse: boolean): CompiledDirection => {
      const ordered = reverse ? [...stationDists].reverse() : [...stationDists];
      const stops: StopTiming[] = [];
      const speedMs = (route.cruiseSpeedKmh * 1000) / 3600;
      let elapsed = 0;

      for (let i = 0; i < ordered.length; i++) {
        const distFromStart = reverse
          ? sampledPath.totalDist - ordered[i].dist
          : ordered[i].dist;
        if (i > 0) {
          const prevDist = stops[i - 1].dist;
          const segDist = Math.max(10, distFromStart - prevDist);
          // Account for acceleration/deceleration factor (~1.15x cruise time)
          const travelTime = (segDist / speedMs) * 1.15;
          elapsed += travelTime;
        }
        const arriveSec = elapsed;
        const departSec = i === 0 || i === ordered.length - 1 ? elapsed : elapsed + route.dwellSec;
        stops.push({
          station: ordered[i].station,
          dist: distFromStart,
          arriveSec,
          departSec
        });
        elapsed = departSec;
      }

      const lastStation = ordered[ordered.length - 1].station;
      return {
        reverse,
        stops,
        totalDurationSec: Math.max(60, elapsed),
        directionLabel: lastStation.name
      };
    };

    return {
      route,
      sampledPath,
      outbound: buildDir(false),
      inbound: buildDir(true)
    };
  }

  update(timeSec: number, visibility: LayerVisibility): ActiveVehicle[] {
    const vehicles: ActiveVehicle[] = [];

    for (const cr of this.compiledRoutes) {
      const { route } = cr;
      if (route.id === 'metro-1' && !visibility.metro1) continue;
      if (route.kind === 'waterbus' && !visibility.waterbus) continue;
      if (route.kind === 'bus' && !visibility.buses) continue;
      if (route.kind === 'future-metro' && !(visibility.plannedMetro && visibility.simulatePlannedMetro)) {
        continue;
      }

      this.simulateDirection(cr, cr.outbound, timeSec, vehicles, 0);
      this.simulateDirection(cr, cr.inbound, timeSec, vehicles, route.headwaySec * 0.5);
    }

    if (visibility.flights) {
      this.simulateFlights(timeSec, vehicles);
    }

    return vehicles;
  }

  private simulateDirection(
    cr: CompiledRoute,
    dir: CompiledDirection,
    timeSec: number,
    out: ActiveVehicle[],
    phaseOffsetSec: number
  ): void {
    const { route, sampledPath } = cr;
    const startSec = route.startHour * 3600 + phaseOffsetSec;
    const endSec = route.endHour * 3600;
    const headway = route.headwaySec;

    // Find all active trip departure indices whose [dep, dep + totalDuration] contains timeSec
    const minTripIdx = Math.max(0, Math.floor((timeSec - dir.totalDurationSec - startSec) / headway));
    const maxTripIdx = Math.floor((Math.min(timeSec, endSec) - startSec) / headway);

    const lateralOffset =
      route.kind === 'metro' || route.kind === 'future-metro'
        ? 4.2
        : route.kind === 'waterbus'
          ? 12
          : 3.5;

    for (let idx = minTripIdx; idx <= maxTripIdx; idx++) {
      const depSec = startSec + idx * headway;
      if (depSec > endSec) continue;
      const relSec = timeSec - depSec;
      if (relSec < 0 || relSec > dir.totalDurationSec) continue;

      // Determine current segment or dwell
      const stops = dir.stops;
      let dist = 0;
      let speedKmh = 0;
      let status: ActiveVehicle['status'] = 'running';
      let currentStation = stops[0].station.name;
      let nextStation = stops[stops.length - 1].station.name;
      let etaSec = 0;

      for (let i = 0; i < stops.length; i++) {
        const st = stops[i];
        if (relSec >= st.arriveSec && relSec <= st.departSec) {
          // Dwelling at station
          dist = st.dist;
          speedKmh = 0;
          status = 'boarding';
          currentStation = st.station.name;
          nextStation = stops[Math.min(i + 1, stops.length - 1)].station.name;
          etaSec = Math.max(0, st.departSec - relSec);
          break;
        }
        if (i < stops.length - 1 && relSec > st.departSec && relSec < stops[i + 1].arriveSec) {
          const nextSt = stops[i + 1];
          const segDur = Math.max(1, nextSt.arriveSec - st.departSec);
          const frac = (relSec - st.departSec) / segDur;
          const eased = easeInOutQuad(frac);
          dist = st.dist + (nextSt.dist - st.dist) * eased.pos;
          speedKmh = Math.round(route.cruiseSpeedKmh * eased.velFactor);
          status = 'running';
          currentStation = st.station.name;
          nextStation = nextSt.station.name;
          etaSec = Math.max(0, Math.round(nextSt.arriveSec - relSec));
          break;
        }
      }

      const sample = samplePathAtDistance(sampledPath, dist, dir.reverse);
      const [lng, lat] = applyLateralOffset(sample.lng, sample.lat, sample.bearing, lateralOffset);

      // Build articulated car poses for multi-car metro trains
      let cars: VehicleCarPose[] | undefined;
      if (route.cars && route.cars > 1) {
        cars = [];
        const carSpacing = 24; // meters between car centers
        const halfSpan = ((route.cars - 1) * carSpacing) / 2;
        for (let c = 0; c < route.cars; c++) {
          const carDist = dist + (halfSpan - c * carSpacing);
          const cs = samplePathAtDistance(sampledPath, carDist, dir.reverse);
          const [cLng, cLat] = applyLateralOffset(cs.lng, cs.lat, cs.bearing, lateralOffset);
          cars.push({
            lng: cLng,
            lat: cLat,
            altitude: cs.altitude,
            bearing: cs.bearing,
            pitch: cs.pitch
          });
        }
      }

      const dirTag = dir.reverse ? 'IN' : 'OUT';
      const trainNum = `${route.code}-${dirTag}-${String(idx + 1).padStart(2, '0')}`;

      out.push({
        id: `${route.id}:${dirTag}:${idx}`,
        routeId: route.id,
        routeCode: route.code,
        kind: route.kind,
        label: trainNum,
        operator: route.operator,
        color: route.color,
        accentColor: route.accentColor,
        directionLabel: dir.directionLabel,
        lng,
        lat,
        altitude: sample.altitude,
        bearing: sample.bearing,
        pitch: sample.pitch,
        speedKmh,
        progress: Math.max(0, Math.min(1, relSec / dir.totalDurationSec)),
        underground: sample.underground,
        status,
        currentStation,
        nextStation,
        etaSec,
        cars
      });
    }
  }

  private simulateFlights(timeSec: number, out: ActiveVehicle[]): void {
    for (const cf of this.compiledFlights) {
      const { flight, sampledPath } = cf;
      const rel = timeSec - flight.departureSec;
      if (rel < 0 || rel > flight.durationSec) continue;

      const t = rel / flight.durationSec;
      // Non-linear speed: arrivals decelerate smoothly toward touchdown; departures accelerate smoothly on takeoff
      const progress =
        flight.type === 'arrival'
          ? 1 - Math.pow(1 - t, 1.35)
          : Math.pow(t, 1.35);

      const dist = progress * sampledPath.totalDist;
      const sample = samplePathAtDistance(sampledPath, dist, false);

      let speedKmh = 260;
      let status: ActiveVehicle['status'] = 'approaching';
      if (flight.type === 'arrival') {
        if (t < 0.72) {
          status = 'approaching';
          speedKmh = Math.round(320 - t * 140);
        } else {
          status = 'landing';
          speedKmh = Math.round(Math.max(25, 220 * (1 - (t - 0.72) / 0.28)));
        }
      } else {
        status = 'takeoff';
        speedKmh = Math.round(45 + t * 340);
      }

      out.push({
        id: flight.id,
        routeId: 'sgn-flights',
        routeCode: flight.flightNumber,
        kind: 'flight',
        label: flight.flightNumber,
        operator: { vi: flight.airline, en: flight.airline },
        color: flight.liveryPrimary,
        accentColor: flight.liverySecondary,
        directionLabel: flight.destination,
        lng: sample.lng,
        lat: sample.lat,
        altitude: sample.altitude,
        bearing: sample.bearing,
        pitch: sample.pitch,
        speedKmh,
        progress: t,
        underground: false,
        status,
        origin: flight.origin,
        destination: flight.destination,
        airlineCode: flight.airlineCode,
        etaSec: Math.round(flight.durationSec - rel)
      });
    }
  }
}
