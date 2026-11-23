import type { ActiveVehicle, FlightRoute, LocalizedText } from '../types';

export interface LiveWeather {
  tempC: number;
  humidity: number;
  windKmh: number;
  weatherCode: number;
  icon: string;
  label: LocalizedText;
  updatedAt: number;
}

export type LiveFlightStatus = 'connecting' | 'live' | 'fallback';

interface RawLiveAircraft {
  id: string;
  callsign: string;
  airline: string;
  airlineCode: FlightRoute['airlineCode'];
  primaryColor: string;
  secondaryColor: string;
  lng: number;
  lat: number;
  altitudeM: number;
  speedMs: number;
  trackRad: number;
  vertRateMs: number;
  onGround: boolean;
  fetchedAtMs: number;
}

function classifyAirline(callsign: string): {
  airline: string;
  code: FlightRoute['airlineCode'];
  primary: string;
  secondary: string;
} {
  const cs = callsign.toUpperCase();
  if (cs.startsWith('HVN') || cs.startsWith('VN')) {
    return { airline: 'Vietnam Airlines', code: 'VN', primary: '#006885', secondary: '#e6b800' };
  }
  if (cs.startsWith('VJC') || cs.startsWith('VJ')) {
    return { airline: 'Vietjet Air', code: 'VJ', primary: '#e11d48', secondary: '#facc15' };
  }
  if (cs.startsWith('BAV') || cs.startsWith('QH')) {
    return { airline: 'Bamboo Airways', code: 'QH', primary: '#0284c7', secondary: '#22c55e' };
  }
  if (cs.startsWith('VAG') || cs.startsWith('VU')) {
    return { airline: 'Vietravel Airlines', code: 'VU', primary: '#eab308', secondary: '#1e3a8a' };
  }
  if (cs.startsWith('SIA') || cs.startsWith('SQ')) {
    return { airline: 'Singapore Airlines', code: 'SQ', primary: '#1d4ed8', secondary: '#f59e0b' };
  }
  if (cs.startsWith('ANA') || cs.startsWith('NH')) {
    return { airline: 'ANA All Nippon', code: 'NH', primary: '#1e3a8a', secondary: '#38bdf8' };
  }
  return { airline: 'Live ADS-B Flight', code: 'VN', primary: '#38bdf8', secondary: '#f8fafc' };
}

function decodeWeatherCode(code: number): { icon: string; label: LocalizedText } {
  if (code === 0) return { icon: '☀️', label: { vi: 'Trời quang', en: 'Clear sky' } };
  if (code <= 3) return { icon: '⛅', label: { vi: 'Có mây', en: 'Partly cloudy' } };
  if (code <= 48) return { icon: '🌫️', label: { vi: 'Sương mù', en: 'Foggy' } };
  if (code <= 67) return { icon: '🌧️', label: { vi: 'Mưa rào', en: 'Rain' } };
  if (code <= 82) return { icon: '🌦️', label: { vi: 'Mưa rải rác', en: 'Showers' } };
  return { icon: '⛈️', label: { vi: 'Dông bão', en: 'Thunderstorm' } };
}

export class LiveDataManager {
  private weather: LiveWeather | null = null;
  private liveAircraft: RawLiveAircraft[] = [];
  private flightStatus: LiveFlightStatus = 'connecting';
  private flightSourceName = 'ADS-B';
  private enabled = true;
  private weatherTimer?: number;
  private flightTimer?: number;
  private onStatusChange?: () => void;

  constructor(onStatusChange?: () => void) {
    this.onStatusChange = onStatusChange;
  }

  start(): void {
    this.fetchWeather();
    this.fetchLiveFlights();

    this.weatherTimer = window.setInterval(() => this.fetchWeather(), 5 * 60 * 1000);
    this.flightTimer = window.setInterval(() => {
      if (this.enabled) this.fetchLiveFlights();
    }, 14 * 1000);
  }

  stop(): void {
    if (this.weatherTimer) clearInterval(this.weatherTimer);
    if (this.flightTimer) clearInterval(this.flightTimer);
  }

  setLiveFlightsEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.fetchLiveFlights();
    }
    this.onStatusChange?.();
  }

  isLiveFlightsEnabled(): boolean {
    return this.enabled;
  }

  getWeather(): LiveWeather | null {
    return this.weather;
  }

  getFlightStatus(): { status: LiveFlightStatus; count: number; source: string } {
    return {
      status: this.enabled ? this.flightStatus : 'fallback',
      count: this.liveAircraft.length,
      source: this.flightSourceName
    };
  }

  private async fetchWeather(): Promise<void> {
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=10.7769&longitude=106.7009&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FHo_Chi_Minh';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const cur = data?.current;
      if (!cur) return;
      const decoded = decodeWeatherCode(Number(cur.weather_code ?? 1));
      this.weather = {
        tempC: Math.round(Number(cur.temperature_2m)),
        humidity: Math.round(Number(cur.relative_humidity_2m)),
        windKmh: Math.round(Number(cur.wind_speed_10m)),
        weatherCode: Number(cur.weather_code ?? 1),
        icon: decoded.icon,
        label: decoded.label,
        updatedAt: Date.now()
      };
      this.onStatusChange?.();
    } catch {
      // Silently ignore offline weather errors
    }
  }

  private async fetchLiveFlights(): Promise<void> {
    // 1. Try adsb.lol via local Vite proxy (/api/adsb/point/lat/lon/radiusNm)
    try {
      const res = await fetch('/api/adsb/point/10.8188/106.6519/30', {
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const json = await res.json();
        const acList = Array.isArray(json?.ac) ? json.ac : [];
        const parsed = this.parseAdsbLol(acList);
        if (parsed.length > 0) {
          this.liveAircraft = parsed;
          this.flightStatus = 'live';
          this.flightSourceName = 'ADS-B Live';
          this.onStatusChange?.();
          return;
        }
      }
    } catch {
      // Fall through to OpenSky
    }

    // 2. Fallback to OpenSky Network via local Vite proxy
    try {
      const res = await fetch(
        '/api/opensky/states/all?lamin=10.55&lomin=106.40&lamax=11.05&lomax=106.95',
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const json = await res.json();
        const states = Array.isArray(json?.states) ? json.states : [];
        const parsed = this.parseOpenSky(states);
        if (parsed.length > 0) {
          this.liveAircraft = parsed;
          this.flightStatus = 'live';
          this.flightSourceName = 'OpenSky Live';
          this.onStatusChange?.();
          return;
        }
      }
    } catch {
      // Fall through to simulation
    }

    // 3. Graceful fallback to timetable simulation
    this.flightStatus = 'fallback';
    this.onStatusChange?.();
  }

  private parseAdsbLol(acList: Record<string, unknown>[]): RawLiveAircraft[] {
    const now = performance.now();
    const out: RawLiveAircraft[] = [];
    for (const ac of acList) {
      const lat = Number(ac.lat);
      const lon = Number(ac.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      // Keep within greater HCMC region
      if (lat < 10.45 || lat > 11.15 || lon < 106.3 || lon > 107.1) continue;

      const callsign = String(ac.flight ?? ac.hex ?? 'LIVE').trim() || 'LIVE';
      const altBaro = ac.alt_baro === 'ground' ? 5 : Number(ac.alt_baro ?? ac.alt_geom ?? 300);
      const altitudeM = Math.max(5, Math.min(2800, (Number.isFinite(altBaro) ? altBaro : 300) * 0.3048));
      const gsKnots = Number(ac.gs ?? 160);
      const speedMs = Math.max(10, (Number.isFinite(gsKnots) ? gsKnots : 160) * 0.514444);
      const trackDeg = Number(ac.track ?? 250);
      const trackRad = ((Number.isFinite(trackDeg) ? trackDeg : 250) * Math.PI) / 180;
      const baroRateFpm = Number(ac.baro_rate ?? 0);
      const vertRateMs = (Number.isFinite(baroRateFpm) ? baroRateFpm : 0) * 0.00508;
      const onGround = ac.alt_baro === 'ground' || altitudeM < 15;

      const info = classifyAirline(callsign);
      out.push({
        id: `live-ac-${String(ac.hex ?? callsign)}`,
        callsign,
        airline: info.airline,
        airlineCode: info.code,
        primaryColor: info.primary,
        secondaryColor: info.secondary,
        lng: lon,
        lat,
        altitudeM,
        speedMs,
        trackRad,
        vertRateMs,
        onGround,
        fetchedAtMs: now
      });
    }
    return out.slice(0, 28);
  }

  private parseOpenSky(states: unknown[][]): RawLiveAircraft[] {
    const now = performance.now();
    const out: RawLiveAircraft[] = [];
    for (const s of states) {
      const lon = Number(s[5]);
      const lat = Number(s[6]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const callsign = String(s[1] ?? s[0] ?? 'LIVE').trim() || 'LIVE';
      const onGround = Boolean(s[8]);
      const altM = onGround ? 5 : Math.max(10, Math.min(2800, Number(s[7] ?? s[13] ?? 500)));
      const speedMs = Math.max(10, Number(s[9] ?? 85));
      const trackDeg = Number(s[10] ?? 250);
      const vertRateMs = Number(s[11] ?? 0);
      const info = classifyAirline(callsign);

      out.push({
        id: `live-ac-${String(s[0] ?? callsign)}`,
        callsign,
        airline: info.airline,
        airlineCode: info.code,
        primaryColor: info.primary,
        secondaryColor: info.secondary,
        lng: lon,
        lat,
        altitudeM: altM,
        speedMs,
        trackRad: (trackDeg * Math.PI) / 180,
        vertRateMs: Number.isFinite(vertRateMs) ? vertRateMs : 0,
        onGround,
        fetchedAtMs: now
      });
    }
    return out.slice(0, 28);
  }

  /** Returns dead-reckoned 60fps live ADS-B aircraft if available, otherwise null */
  getLiveFlightVehicles(nowMs: number): ActiveVehicle[] | null {
    if (!this.enabled || this.flightStatus !== 'live' || this.liveAircraft.length === 0) {
      return null;
    }

    const vehicles: ActiveVehicle[] = [];
    for (const ac of this.liveAircraft) {
      const dtSec = Math.min(22, Math.max(0, (nowMs - ac.fetchedAtMs) / 1000));
      const distM = ac.onGround ? 0 : ac.speedMs * dtSec;
      const dNorth = Math.cos(ac.trackRad) * distM;
      const dEast = Math.sin(ac.trackRad) * distM;
      const lat = ac.lat + dNorth / 110574;
      const lng = ac.lng + dEast / (111320 * Math.cos((ac.lat * Math.PI) / 180));
      const altitude = Math.max(4, ac.altitudeM + ac.vertRateMs * dtSec);
      const pitch = ac.onGround ? 0 : Math.atan2(ac.vertRateMs, Math.max(20, ac.speedMs));

      const status: ActiveVehicle['status'] = ac.onGround
        ? 'boarding'
        : ac.vertRateMs < -1.5
          ? 'approaching'
          : ac.vertRateMs > 1.5
            ? 'takeoff'
            : 'running';

      vehicles.push({
        id: ac.id,
        routeId: 'sgn-live-adsb',
        routeCode: ac.callsign,
        kind: 'flight',
        label: `${ac.callsign} • LIVE`,
        operator: { vi: `${ac.airline} (${this.flightSourceName})`, en: `${ac.airline} (${this.flightSourceName})` },
        color: ac.primaryColor,
        accentColor: ac.secondaryColor,
        directionLabel: {
          vi: `Vùng trời TP.HCM (${Math.round(altitude)}m)`,
          en: `HCMC Airspace (${Math.round(altitude)}m)`
        },
        lng,
        lat,
        altitude: Math.min(1200, altitude), // clamp visual altitude so high-altitude jets stay in 3D view
        bearing: ac.trackRad,
        pitch,
        speedKmh: Math.round(ac.speedMs * 3.6),
        progress: 0.5,
        underground: false,
        status,
        origin: { vi: 'ADS-B Trực tiếp', en: 'Live ADS-B' },
        destination: { vi: 'Tân Sơn Nhất (SGN)', en: 'Tan Son Nhat (SGN)' },
        airlineCode: ac.airlineCode
      });
    }
    return vehicles;
  }
}
