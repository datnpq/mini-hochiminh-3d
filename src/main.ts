import './styles/main.css';
import { t } from './data/i18n';
import { SimClock } from './engine/Clock';
import { ImmersiveWorld } from './engine/ImmersiveWorld';
import { LiveDataManager } from './engine/LiveData';
import { MapController } from './engine/MapController';
import { PlayerController, type ExploreMode } from './engine/PlayerController';
import { TransitSimulator } from './engine/Simulator';
import type { ActiveVehicle, Lang, LayerVisibility, ThemeMode } from './types';
import { HUD } from './ui/HUD';

const initialVisibility: LayerVisibility = {
  metro1: true,
  waterbus: true,
  buses: true,
  flights: true,
  plannedMetro: false,
  simulatePlannedMetro: false,
  buildings3d: true
};

let lang: Lang = 'vi';
let underground = false;
let themeMode: ThemeMode = 'auto';
let visibility: LayerVisibility = { ...initialVisibility };
let selectedVehicleId: string | null = null;
let following = false;
let notifiedLiveOnce = false;
let latestVehicles: ActiveVehicle[] = [];

const clock = new SimClock();
const simulator = new TransitSimulator();

const player = new PlayerController({
  onExit: () => {
    immersiveWorld.setActive(false);
    mapController.threeLayer.updatePlayer(null);
    hud.setState({ exploreMode: 'none' });
  },
  onMetroUndergroundChange: (isUg) => {
    if (underground !== isUg) {
      underground = isUg;
      applyThemeAndUnderground();
      hud.setState({ underground });
    }
  }
});

const mapContainer = document.getElementById('map')!;
const immersiveContainer = document.getElementById('immersive')!;
const hudContainer = document.getElementById('hud')!;

const immersiveWorld = new ImmersiveWorld(immersiveContainer);

const mapController = new MapController(mapContainer, initialVisibility, (picked) => {
  selectedVehicleId = picked ? picked.id : null;
  if (!picked) {
    following = false;
    hud.setState({ following: false });
  }
  mapController.threeLayer.setSelectedVehicle(selectedVehicleId);
});

const liveData = new LiveDataManager(() => {
  const flightInfo = liveData.getFlightStatus();
  hud.setLiveInfo(liveData.getWeather(), flightInfo, liveData.isLiveFlightsEnabled());
  if (flightInfo.status === 'live' && !notifiedLiveOnce) {
    notifiedLiveOnce = true;
    hud.showToast(`✈️ ${flightInfo.source}: ${flightInfo.count} máy bay thật quanh TP.HCM`);
  }
});

const hud = new HUD(hudContainer, initialVisibility, {
  onToggleUnderground: () => {
    underground = !underground;
    applyThemeAndUnderground();
    hud.setState({ underground });
    hud.showToast(t(lang, underground ? 'toastUndergroundOn' : 'toastUndergroundOff'));
  },
  onCycleTheme: () => {
    themeMode = themeMode === 'auto' ? 'day' : themeMode === 'day' ? 'night' : 'auto';
    applyThemeAndUnderground();
    hud.setState({ themeMode });
  },
  onToggleLang: () => {
    lang = lang === 'vi' ? 'en' : 'vi';
    mapController.setLang(lang);
    hud.setLang(lang);
    hud.setLiveInfo(liveData.getWeather(), liveData.getFlightStatus(), liveData.isLiveFlightsEnabled());
  },
  onVisibilityChange: (next) => {
    visibility = { ...next };
    mapController.setVisibility(visibility);
    hud.setState({ visibility });
  },
  onToggleLiveAdsb: (enabled) => {
    liveData.setLiveFlightsEnabled(enabled);
    hud.setLiveInfo(liveData.getWeather(), liveData.getFlightStatus(), enabled);
  },
  onSelectPreset: (preset) => {
    following = false;
    if (preset.underground !== undefined) {
      underground = preset.underground;
      applyThemeAndUnderground();
    }
    hud.setState({ following, underground });
    mapController.flyToPreset(preset);
  },
  onFocusVehicle: (vehicle) => {
    selectedVehicleId = vehicle.id;
    following = true;
    mapController.threeLayer.setSelectedVehicle(vehicle.id);
    hud.setState({ following: true });
    hud.showToast(`${t(lang, 'toastFollow')} ${vehicle.label}`);
    mapController.map.flyTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: vehicle.kind === 'flight' ? 13.8 : 15.4,
      pitch: 62,
      duration: 1100
    });
  },
  onTogglePause: () => {
    const paused = clock.togglePause();
    hud.setState({ paused });
  },
  onSpeedChange: (mult) => {
    clock.setSpeed(mult);
    hud.setState({ speed: mult, paused: false });
  },
  onScrubTime: (sec) => {
    clock.setSeconds(sec);
    applyThemeAndUnderground();
  },
  onSyncLive: () => {
    clock.syncToLive();
    applyThemeAndUnderground();
    hud.setState({ speed: 1, paused: false });
    hud.showToast(t(lang, 'toastLiveOn'));
  },
  onToggleFollow: () => {
    if (!selectedVehicleId) return;
    following = !following;
    hud.setState({ following });
  },
  onCloseVehicle: () => {
    selectedVehicleId = null;
    following = false;
    mapController.threeLayer.setSelectedVehicle(null);
    hud.setState({ following: false });
  },
  onStartExplore: (mode: ExploreMode) => {
    // Release any vehicle follow lock
    selectedVehicleId = null;
    following = false;
    mapController.threeLayer.setSelectedVehicle(null);

    if (mode === 'metro-ride' && !visibility.metro1) {
      visibility = { ...visibility, metro1: true };
      mapController.setVisibility(visibility);
    }

    player.start(mode, latestVehicles);
    immersiveWorld.setActive(mode !== 'none');
    hud.setState({ following: false, exploreMode: mode, visibility });
    const toastMap: Record<Exclude<ExploreMode, 'none'>, string> = {
      drive: `${t(lang, 'modeDrive')} • WASD + Kéo chuột xoay`,
      walk: `${t(lang, 'modeWalk')} • WASD + Kéo chuột nhìn`,
      'metro-ride': `${t(lang, 'modeMetro')} • Kéo chuột ngắm phố`,
      drone: `${t(lang, 'modeDrone')} • WASD + Space / Q`
    };
    if (mode !== 'none') hud.showToast(toastMap[mode]);
  },
  onExitExplore: () => {
    player.stop();
    immersiveWorld.setActive(false);
    mapController.threeLayer.updatePlayer(null);
    hud.setState({ exploreMode: 'none' });
  },
  onSwitchMetroTrain: () => {
    const next = player.switchMetroTrain(latestVehicles);
    if (next) {
      hud.showToast(`🚇 ${next.label} → ${next.directionLabel[lang]}`);
    }
  },
  onVirtualKey: (key, pressed) => {
    player.setVirtualInput(key, pressed);
  }
});

// If user manually drags the map, release follow lock smoothly
mapController.map.on('dragstart', () => {
  if (following) {
    following = false;
    hud.setState({ following: false });
  }
});

function applyThemeAndUnderground(): void {
  const daylight = clock.getDaylightFactor();
  const useDark =
    underground ||
    themeMode === 'night' ||
    (themeMode === 'auto' && daylight < 0.45);

  mapController.setStyleTheme(useDark);
  mapController.setUndergroundMode(underground);
  mapController.threeLayer.setDaylight(
    themeMode === 'day' ? 1 : themeMode === 'night' ? 0 : daylight,
    underground
  );
}

applyThemeAndUnderground();
liveData.start();

let lastThemeCheck = 0;

function animate(nowMs: number): void {
  const simSec = clock.tick(nowMs);
  const liveFlights = visibility.flights ? liveData.getLiveFlightVehicles(nowMs) : null;

  // Use real-time ADS-B flights when available; otherwise fall back to simulated SGN schedule
  const simVisibility = liveFlights ? { ...visibility, flights: false } : visibility;
  const simVehicles = simulator.update(simSec, simVisibility);
  const vehicles = liveFlights ? [...simVehicles, ...liveFlights] : simVehicles;
  latestVehicles = vehicles;

  mapController.threeLayer.updateVehicles(vehicles, visibility);

  // Update interactive Explore / Pilot mode in full-screen Three.js 3D WebGL world!
  const playerPose = player.update(nowMs, vehicles);
  if (playerPose) {
    const daylight =
      themeMode === 'day' ? 1 : themeMode === 'night' ? 0 : clock.getDaylightFactor();
    immersiveWorld.render(playerPose, vehicles, daylight);
    // Keep background map synced so exiting ESC lands seamlessly at current spot
    mapController.followPlayer(playerPose);
    hud.updatePilotTelemetry(playerPose, player.getKeyState());
  } else {
    mapController.threeLayer.updatePlayer(null);
  }

  let selected: ActiveVehicle | null = null;
  if (selectedVehicleId) {
    selected = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
    if (!selected) {
      selectedVehicleId = null;
      following = false;
      mapController.threeLayer.setSelectedVehicle(null);
      hud.setState({ following: false });
    } else if (following) {
      mapController.followVehicle(selected);
    }
  }

  // Update auto day/night style periodically
  if (nowMs - lastThemeCheck > 1500) {
    lastThemeCheck = nowMs;
    if (themeMode === 'auto') {
      applyThemeAndUnderground();
    }
  }

  hud.updateFrame(clock.formatTime(), simSec, vehicles, selected);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
