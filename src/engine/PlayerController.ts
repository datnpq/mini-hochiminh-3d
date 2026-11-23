import type { ActiveVehicle } from '../types';

export type ExploreMode = 'none' | 'drive' | 'walk' | 'metro-ride' | 'drone';

export interface PlayerPose {
  mode: ExploreMode;
  lng: number;
  lat: number;
  altitude: number;
  bearing: number; // radians, 0 = North, clockwise
  pitch: number; // visual tilt radians
  roll: number; // visual bank radians
  speedKmh: number;
  animPhase: number;
  cameraZoom: number;
  cameraPitchDeg: number;
  cameraBearingDeg: number;
  metroVehicle?: ActiveVehicle;
}

export interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
}

export class PlayerController {
  private mode: ExploreMode = 'none';
  private lng = 106.702;
  private lat = 10.7745;
  private altitude = 0;
  private bearing = 0.78; // radians (~NE)
  private speedMs = 0;
  private vertSpeedMs = 0;
  private visualPitch = 0;
  private visualRoll = 0;
  private animPhase = 0;
  private lastTimeMs = performance.now();

  private metroTrainId: string | null = null;
  private smoothCamBearingDeg = 0;

  private keys = new Set<string>();
  private virtualKeys: Partial<KeyState> = {};

  private onExit?: () => void;
  private onMetroUndergroundChange?: (isUnderground: boolean) => void;
  private lastMetroUnderground: boolean | null = null;

  constructor(callbacks?: {
    onExit?: () => void;
    onMetroUndergroundChange?: (isUnderground: boolean) => void;
  }) {
    this.onExit = callbacks?.onExit;
    this.onMetroUndergroundChange = callbacks?.onMetroUndergroundChange;
    this.bindKeyboard();
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (this.mode === 'none') return;
      if (e.key === 'Escape') {
        this.stop();
        this.onExit?.();
        return;
      }
      const k = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'q', 'e', 'c', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          k
        )
      ) {
        e.preventDefault();
        this.keys.add(k);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.virtualKeys = {};
    });
  }

  setVirtualInput(key: keyof KeyState, pressed: boolean): void {
    this.virtualKeys[key] = pressed;
  }

  getKeyState(): KeyState {
    return {
      forward: this.keys.has('w') || this.keys.has('arrowup') || Boolean(this.virtualKeys.forward),
      backward: this.keys.has('s') || this.keys.has('arrowdown') || Boolean(this.virtualKeys.backward),
      left: this.keys.has('a') || this.keys.has('arrowleft') || Boolean(this.virtualKeys.left),
      right: this.keys.has('d') || this.keys.has('arrowright') || Boolean(this.virtualKeys.right),
      up: this.keys.has(' ') || this.keys.has('e') || Boolean(this.virtualKeys.up),
      down: this.keys.has('c') || this.keys.has('q') || Boolean(this.virtualKeys.down),
      boost: this.keys.has('shift') || Boolean(this.virtualKeys.boost)
    };
  }

  getMode(): ExploreMode {
    return this.mode;
  }

  start(mode: ExploreMode, vehicles: ActiveVehicle[]): void {
    this.mode = mode;
    this.speedMs = 0;
    this.vertSpeedMs = 0;
    this.visualPitch = 0;
    this.visualRoll = 0;
    this.lastTimeMs = performance.now();
    this.lastMetroUnderground = null;

    if (mode === 'drive') {
      // Spawn near Ben Thanh / Le Loi facing Opera House
      this.lng = 106.6996;
      this.lat = 10.7728;
      this.altitude = 0;
      this.bearing = 0.78;
    } else if (mode === 'walk') {
      // Spawn on Nguyen Hue Walking Street facing Saigon River
      this.lng = 106.7033;
      this.lat = 10.7745;
      this.altitude = 0;
      this.bearing = 2.35;
    } else if (mode === 'drone') {
      // Spawn hovering over Bach Dang Pier looking toward Landmark 81
      this.lng = 106.7085;
      this.lat = 10.7772;
      this.altitude = 115;
      this.bearing = 0.42;
    } else if (mode === 'metro-ride') {
      this.pickMetroTrain(vehicles, false);
    }

    this.smoothCamBearingDeg = (this.bearing * 180) / Math.PI;
  }

  switchMetroTrain(vehicles: ActiveVehicle[]): ActiveVehicle | null {
    return this.pickMetroTrain(vehicles, true);
  }

  private pickMetroTrain(vehicles: ActiveVehicle[], nextDifferent: boolean): ActiveVehicle | null {
    const metros = vehicles.filter((v) => v.kind === 'metro');
    if (metros.length === 0) {
      this.metroTrainId = null;
      return null;
    }
    if (nextDifferent && this.metroTrainId) {
      const idx = metros.findIndex((m) => m.id === this.metroTrainId);
      const next = metros[(idx + 1) % metros.length];
      this.metroTrainId = next.id;
      return next;
    }
    // Prefer an elevated moving train first for dramatic scenery
    const preferred = metros.find((m) => !m.underground && m.speedKmh > 10) ?? metros[0];
    this.metroTrainId = preferred.id;
    return preferred;
  }

  stop(): void {
    this.mode = 'none';
    this.keys.clear();
    this.virtualKeys = {};
    this.metroTrainId = null;
    this.lastMetroUnderground = null;
  }

  update(nowMs: number, vehicles: ActiveVehicle[]): PlayerPose | null {
    if (this.mode === 'none') return null;

    const dt = Math.min(0.08, Math.max(0.001, (nowMs - this.lastTimeMs) / 1000));
    this.lastTimeMs = nowMs;
    this.animPhase += dt;

    if (this.mode === 'metro-ride') {
      return this.updateMetroRide(dt, vehicles);
    }

    const ks = this.getKeyState();

    if (this.mode === 'drive') {
      const maxSpeed = ks.boost ? 28 : 18; // ~100 km/h boost, ~65 km/h cruise
      const accel = ks.boost ? 22 : 14;
      if (ks.forward) this.speedMs = Math.min(maxSpeed, this.speedMs + accel * dt);
      else if (ks.backward) this.speedMs = Math.max(-7, this.speedMs - 18 * dt);
      else {
        // Natural rolling friction
        this.speedMs *= Math.max(0, 1 - 3.2 * dt);
        if (Math.abs(this.speedMs) < 0.08) this.speedMs = 0;
      }

      const steerRate = 1.65;
      const steerDir = this.speedMs >= -0.2 ? 1 : -1;
      const steerFactor = Math.min(1, Math.abs(this.speedMs) / 3 + 0.35);
      let targetRoll = 0;
      if (ks.left) {
        this.bearing -= steerRate * steerFactor * steerDir * dt;
        targetRoll = 0.14;
      }
      if (ks.right) {
        this.bearing += steerRate * steerFactor * steerDir * dt;
        targetRoll = -0.14;
      }
      this.visualRoll += (targetRoll - this.visualRoll) * Math.min(1, dt * 8);
      this.visualPitch = 0;
      this.altitude = 0;
    } else if (this.mode === 'walk') {
      const maxSpeed = ks.boost ? 5.2 : 2.6; // jog ~18 km/h, stroll ~9 km/h
      if (ks.forward) this.speedMs = Math.min(maxSpeed, this.speedMs + 10 * dt);
      else if (ks.backward) this.speedMs = Math.max(-2.0, this.speedMs - 10 * dt);
      else {
        this.speedMs *= Math.max(0, 1 - 8 * dt);
        if (Math.abs(this.speedMs) < 0.05) this.speedMs = 0;
      }

      const turnRate = 2.0;
      if (ks.left) this.bearing -= turnRate * dt;
      if (ks.right) this.bearing += turnRate * dt;
      this.visualPitch = 0;
      this.visualRoll = 0;
      this.altitude = 0;
    } else if (this.mode === 'drone') {
      const maxSpeed = ks.boost ? 44 : 24; // ~158 km/h sport, ~86 km/h cruise
      const accel = ks.boost ? 32 : 18;
      if (ks.forward) this.speedMs = Math.min(maxSpeed, this.speedMs + accel * dt);
      else if (ks.backward) this.speedMs = Math.max(-16, this.speedMs - accel * dt);
      else {
        this.speedMs *= Math.max(0, 1 - 2.6 * dt);
        if (Math.abs(this.speedMs) < 0.1) this.speedMs = 0;
      }

      const yawRate = 1.45;
      let targetRoll = 0;
      if (ks.left) {
        this.bearing -= yawRate * dt;
        targetRoll = 0.25;
      }
      if (ks.right) {
        this.bearing += yawRate * dt;
        targetRoll = -0.25;
      }

      // Vertical climb / descent
      const vSpeedMax = ks.boost ? 28 : 16;
      if (ks.up) this.vertSpeedMs = Math.min(vSpeedMax, this.vertSpeedMs + 28 * dt);
      else if (ks.down) this.vertSpeedMs = Math.max(-vSpeedMax, this.vertSpeedMs - 28 * dt);
      else {
        this.vertSpeedMs *= Math.max(0, 1 - 5.5 * dt);
      }
      this.altitude = Math.max(16, Math.min(520, this.altitude + this.vertSpeedMs * dt));

      const targetPitch = -(this.speedMs / maxSpeed) * 0.28;
      this.visualPitch += (targetPitch - this.visualPitch) * Math.min(1, dt * 7);
      this.visualRoll += (targetRoll - this.visualRoll) * Math.min(1, dt * 7);
    }

    // Integrate horizontal motion in WGS84
    const dNorth = Math.cos(this.bearing) * this.speedMs * dt;
    const dEast = Math.sin(this.bearing) * this.speedMs * dt;
    this.lat += dNorth / 110574;
    this.lng += dEast / (111320 * Math.cos((this.lat * Math.PI) / 180));

    // Smooth camera bearing follow
    const targetBearingDeg = (this.bearing * 180) / Math.PI;
    this.smoothCamBearingDeg = lerpAngleDeg(this.smoothCamBearingDeg, targetBearingDeg, Math.min(1, dt * 5.5));

    const cameraZoom =
      this.mode === 'walk'
        ? 17.8
        : this.mode === 'drive'
          ? 16.9
          : Math.max(14.0, 16.6 - (this.altitude / 520) * 2.4);

    const cameraPitchDeg =
      this.mode === 'walk'
        ? 73
        : this.mode === 'drive'
          ? 69
          : Math.max(52, 68 - (this.altitude / 520) * 14);

    return {
      mode: this.mode,
      lng: this.lng,
      lat: this.lat,
      altitude: this.altitude,
      bearing: this.bearing,
      pitch: this.visualPitch,
      roll: this.visualRoll,
      speedKmh: Math.round(Math.abs(this.speedMs) * 3.6),
      animPhase: this.animPhase,
      cameraZoom,
      cameraPitchDeg,
      cameraBearingDeg: this.smoothCamBearingDeg
    };
  }

  private updateMetroRide(dt: number, vehicles: ActiveVehicle[]): PlayerPose | null {
    let train = vehicles.find((v) => v.id === this.metroTrainId);
    if (!train) {
      train = this.pickMetroTrain(vehicles, false) ?? undefined;
    }
    if (!train) return null;

    // Lead car position for cab-view feel
    const lead = train.cars?.[0] ?? train;
    this.lng = lead.lng;
    this.lat = lead.lat;
    this.altitude = lead.altitude;
    this.bearing = lead.bearing;

    if (this.lastMetroUnderground !== train.underground) {
      this.lastMetroUnderground = train.underground;
      this.onMetroUndergroundChange?.(train.underground);
    }

    const targetDeg = (lead.bearing * 180) / Math.PI;
    this.smoothCamBearingDeg = lerpAngleDeg(this.smoothCamBearingDeg, targetDeg, Math.min(1, dt * 3.5));

    return {
      mode: 'metro-ride',
      lng: lead.lng,
      lat: lead.lat,
      altitude: lead.altitude,
      bearing: lead.bearing,
      pitch: lead.pitch,
      roll: 0,
      speedKmh: train.speedKmh,
      animPhase: this.animPhase,
      cameraZoom: 16.4,
      cameraPitchDeg: 66,
      cameraBearingDeg: this.smoothCamBearingDeg,
      metroVehicle: train
    };
  }
}

function lerpAngleDeg(current: number, target: number, t: number): number {
  let diff = ((target - current + 540) % 360) - 180;
  return current + diff * t;
}
