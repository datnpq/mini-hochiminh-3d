export type Lang = 'vi' | 'en';

export type VehicleKind = 'metro' | 'future-metro' | 'waterbus' | 'bus' | 'flight';

export type ElevationType = 'underground' | 'ground' | 'elevated' | 'water' | 'air';

export type ThemeMode = 'auto' | 'day' | 'night';

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface Station {
  id: string;
  code: string;
  name: LocalizedText;
  coord: [number, number]; // [lng, lat]
  altitude: number; // meters (negative = underground, positive = elevated)
  elevationType: ElevationType;
  lineIds: string[];
}

export interface TrackPoint {
  coord: [number, number];
  altitude: number; // meters
  underground?: boolean;
}

export interface TransitRoute {
  id: string;
  code: string;
  kind: VehicleKind;
  name: LocalizedText;
  operator: LocalizedText;
  color: string;
  accentColor?: string;
  planned?: boolean;
  headwaySec: number;
  startHour: number;
  endHour: number;
  cruiseSpeedKmh: number;
  dwellSec: number;
  cars?: number;
  stations: Station[];
  path: TrackPoint[];
}

export interface FlightRoute {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: 'VN' | 'VJ' | 'QH' | 'VU' | 'SQ' | 'NH';
  liveryPrimary: string;
  liverySecondary: string;
  origin: LocalizedText;
  destination: LocalizedText;
  type: 'arrival' | 'departure';
  runway: '25R' | '25L';
  departureSec: number; // seconds from midnight
  durationSec: number;
  path: TrackPoint[]; // 3D trajectory [lng, lat, alt]
}

export interface VehicleCarPose {
  lng: number;
  lat: number;
  altitude: number;
  bearing: number; // radians, 0 = North, clockwise
  pitch: number; // radians
}

export interface ActiveVehicle {
  id: string;
  routeId: string;
  routeCode: string;
  kind: VehicleKind;
  label: string;
  operator: LocalizedText;
  color: string;
  accentColor?: string;
  directionLabel: LocalizedText;
  lng: number;
  lat: number;
  altitude: number;
  bearing: number;
  pitch: number;
  speedKmh: number;
  progress: number; // 0..1
  underground: boolean;
  status: 'running' | 'boarding' | 'approaching' | 'takeoff' | 'landing';
  nextStation?: LocalizedText;
  currentStation?: LocalizedText;
  etaSec?: number;
  cars?: VehicleCarPose[];
  airlineCode?: FlightRoute['airlineCode'];
  origin?: LocalizedText;
  destination?: LocalizedText;
}

export interface LayerVisibility {
  metro1: boolean;
  waterbus: boolean;
  buses: boolean;
  flights: boolean;
  plannedMetro: boolean;
  simulatePlannedMetro: boolean;
  buildings3d: boolean;
}

export interface CameraPreset {
  id: string;
  name: LocalizedText;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  underground?: boolean;
}
