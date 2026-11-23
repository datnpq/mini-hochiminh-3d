import { t } from '../data/i18n';
import { CAMERA_PRESETS } from '../data/presets';
import type { LiveFlightStatus, LiveWeather } from '../engine/LiveData';
import type { ExploreMode, KeyState, PlayerPose } from '../engine/PlayerController';
import type {
  ActiveVehicle,
  CameraPreset,
  Lang,
  LayerVisibility,
  ThemeMode
} from '../types';

export type RadarFilter = 'metro' | 'waterbus' | 'bus' | 'flight';

export interface HudCallbacks {
  onToggleUnderground: () => void;
  onCycleTheme: () => void;
  onToggleLang: () => void;
  onVisibilityChange: (next: LayerVisibility) => void;
  onToggleLiveAdsb: (enabled: boolean) => void;
  onSelectPreset: (preset: CameraPreset) => void;
  onFocusVehicle: (vehicle: ActiveVehicle) => void;
  onTogglePause: () => void;
  onSpeedChange: (mult: number) => void;
  onScrubTime: (sec: number) => void;
  onSyncLive: () => void;
  onToggleFollow: () => void;
  onCloseVehicle: () => void;
  onStartExplore: (mode: ExploreMode) => void;
  onExitExplore: () => void;
  onSwitchMetroTrain: () => void;
  onVirtualKey: (key: keyof KeyState, pressed: boolean) => void;
}

// Crisp geometric Saigon Signage inline SVG icons (zero emojis)
const ICON = {
  explore: `<svg class="hud-icon" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  subway: `<svg class="hud-icon" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="14"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="17" x2="5" y2="21"/><line x1="16" y1="17" x2="19" y2="21"/></svg>`,
  radar: `<svg class="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="12" x2="18.5" y2="5.5"/></svg>`,
  theme: `<svg class="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4v16"/></svg>`,
  layers: `<svg class="hud-icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>`,
  camera: `<svg class="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/></svg>`,
  play: `<svg class="hud-icon" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg>`,
  pause: `<svg class="hud-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>`,
  car: `<svg class="hud-icon" viewBox="0 0 24 24"><path d="M3 13l2-5h14l2 5v5H3v-5z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  walk: `<svg class="hud-icon" viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 7v6l3 3v5M12 13l-3 4v4M9 9h6"/></svg>`,
  drone: `<svg class="hud-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="6" height="6"/><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="7" y1="7" x2="9" y2="9"/><line x1="17" y1="7" x2="15" y2="9"/><line x1="7" y1="17" x2="9" y2="15"/><line x1="17" y1="17" x2="15" y2="15"/></svg>`
};

export class HUD {
  private root: HTMLElement;
  private cb: HudCallbacks;
  private lang: Lang = 'vi';
  private visibility: LayerVisibility;
  private underground = false;
  private themeMode: ThemeMode = 'auto';
  private speed = 1;
  private paused = false;
  private following = false;
  private liveAdsbEnabled = true;
  private liveStatus: LiveFlightStatus = 'connecting';
  private liveFlightCount = 0;
  private weather: LiveWeather | null = null;
  private openDrawer: 'layers' | 'cameras' | 'radar' | 'explore' | null = null;
  private exploreMode: ExploreMode = 'none';
  private radarFilter: RadarFilter = 'metro';
  private isScrubbing = false;
  private latestVehicles: ActiveVehicle[] = [];
  private lastRadarRenderMs = 0;
  private toastTimer?: number;
  private prevCounts = { metro: -1, water: -1, bus: -1, flight: -1 };

  // Cached DOM references
  private clockEl!: HTMLElement;
  private sliderEl!: HTMLInputElement;
  private countMetroEl!: HTMLElement;
  private countWaterEl!: HTMLElement;
  private countBusEl!: HTMLElement;
  private countFlightEl!: HTMLElement;
  private vehicleCardEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private radarListEl!: HTMLElement;
  private toastEl!: HTMLElement;
  private liveBadgeEl!: HTMLElement;
  private weatherEl!: HTMLElement;
  private pilotCardEl!: HTMLElement;
  private pilotSpeedEl?: HTMLElement;
  private pilotAltEl?: HTMLElement;
  private pilotMetroInfoEl?: HTMLElement;

  constructor(
    root: HTMLElement,
    initialVisibility: LayerVisibility,
    cb: HudCallbacks
  ) {
    this.root = root;
    this.visibility = { ...initialVisibility };
    this.cb = cb;
    this.render();
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    this.render();
  }

  setLiveInfo(
    weather: LiveWeather | null,
    flightInfo: { status: LiveFlightStatus; count: number; source: string },
    enabled: boolean
  ): void {
    this.weather = weather;
    this.liveStatus = flightInfo.status;
    this.liveFlightCount = flightInfo.count;
    this.liveAdsbEnabled = enabled;
    this.updateLiveStripDOM();
  }

  showToast(message: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl?.classList.remove('show');
    }, 2600);
  }

  setState(partial: {
    underground?: boolean;
    themeMode?: ThemeMode;
    speed?: number;
    paused?: boolean;
    following?: boolean;
    visibility?: LayerVisibility;
    exploreMode?: ExploreMode;
  }): void {
    if (partial.underground !== undefined) this.underground = partial.underground;
    if (partial.themeMode !== undefined) this.themeMode = partial.themeMode;
    if (partial.speed !== undefined) this.speed = partial.speed;
    if (partial.paused !== undefined) this.paused = partial.paused;
    if (partial.following !== undefined) this.following = partial.following;
    if (partial.visibility !== undefined) this.visibility = { ...partial.visibility };
    if (partial.exploreMode !== undefined) this.exploreMode = partial.exploreMode;
    this.render();
  }

  private bumpCount(el: HTMLElement, key: keyof typeof this.prevCounts, value: number): void {
    if (this.prevCounts[key] === value) return;
    this.prevCounts[key] = value;
    el.textContent = String(value);
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  updatePilotTelemetry(pose: PlayerPose | null, keys: KeyState): void {
    if (!pose || this.exploreMode === 'none') return;
    if (this.pilotSpeedEl) this.pilotSpeedEl.textContent = String(pose.speedKmh);
    if (this.pilotAltEl) this.pilotAltEl.textContent = String(Math.round(pose.altitude));
    if (this.pilotMetroInfoEl && pose.metroVehicle) {
      const mv = pose.metroVehicle;
      const stopTxt =
        mv.status === 'boarding'
          ? `${t(this.lang, 'currentStop')}: ${mv.currentStation?.[this.lang] ?? ''}`
          : `${t(this.lang, 'nextStop')}: ${mv.nextStation?.[this.lang] ?? ''}`;
      this.pilotMetroInfoEl.textContent = `${mv.label} • ${stopTxt}`;
    }

    const mapKeys: [string, boolean][] = [
      ['forward', keys.forward],
      ['backward', keys.backward],
      ['left', keys.left],
      ['right', keys.right],
      ['up', keys.up],
      ['down', keys.down],
      ['boost', keys.boost]
    ];
    for (const [k, isPressed] of mapKeys) {
      const btn = this.pilotCardEl?.querySelector(`[data-vkey="${k}"]`);
      if (btn) btn.classList.toggle('pressed', isPressed);
    }
  }

  updateFrame(
    timeFormatted: string,
    timeSec: number,
    vehicles: ActiveVehicle[],
    selected: ActiveVehicle | null
  ): void {
    this.latestVehicles = vehicles;
    if (this.clockEl) this.clockEl.textContent = timeFormatted;
    if (this.sliderEl && !this.isScrubbing) {
      this.sliderEl.value = String(Math.floor(timeSec));
    }

    let metro = 0;
    let water = 0;
    let bus = 0;
    let flight = 0;
    for (const v of vehicles) {
      if (v.kind === 'metro' || v.kind === 'future-metro') metro++;
      else if (v.kind === 'waterbus') water++;
      else if (v.kind === 'bus') bus++;
      else if (v.kind === 'flight') flight++;
    }
    if (this.countMetroEl) this.bumpCount(this.countMetroEl, 'metro', metro);
    if (this.countWaterEl) this.bumpCount(this.countWaterEl, 'water', water);
    if (this.countBusEl) this.bumpCount(this.countBusEl, 'bus', bus);
    if (this.countFlightEl) this.bumpCount(this.countFlightEl, 'flight', flight);

    this.renderVehicleCard(selected);

    if (this.openDrawer === 'radar' && performance.now() - this.lastRadarRenderMs > 700) {
      this.lastRadarRenderMs = performance.now();
      this.renderRadarList();
    }
  }

  private updateLiveStripDOM(): void {
    if (this.liveBadgeEl) {
      const isLive = this.liveStatus === 'live' && this.liveAdsbEnabled;
      this.liveBadgeEl.className = `live-badge ${isLive ? '' : 'sim'}`;
      const label =
        isLive
          ? `${t(this.lang, 'liveAdsb')} (${this.liveFlightCount})`
          : this.liveStatus === 'connecting' && this.liveAdsbEnabled
            ? t(this.lang, 'liveConnecting')
            : t(this.lang, 'liveSim');
      this.liveBadgeEl.innerHTML = `<span class="live-dot"></span><span>${label}</span>`;
    }

    if (this.weatherEl) {
      if (this.weather) {
        this.weatherEl.style.display = 'inline-flex';
        this.weatherEl.title = `${this.weather.label[this.lang]} • ${this.weather.windKmh} km/h • ${this.weather.humidity}%`;
        this.weatherEl.textContent = `SGN ${this.weather.tempC}°C`;
      } else {
        this.weatherEl.style.display = 'none';
      }
    }
  }

  private renderRadarList(): void {
    if (!this.radarListEl) return;
    const filtered = this.latestVehicles.filter((v) => {
      if (this.radarFilter === 'metro') return v.kind === 'metro' || v.kind === 'future-metro';
      return v.kind === this.radarFilter;
    });

    if (filtered.length === 0) {
      this.radarListEl.innerHTML = `<div class="radar-item-sub" style="padding:10px 4px;text-align:center">${t(this.lang, 'radarEmpty')}</div>`;
      return;
    }

    this.radarListEl.innerHTML = filtered
      .slice(0, 16)
      .map(
        (v) => `
        <button class="radar-item" data-vehicle-id="${v.id}">
          <div class="radar-item-left">
            <span class="vc-badge" style="background:${v.color};font-size:10px;padding:2px 6px">${v.routeCode}</span>
            <div style="min-width:0">
              <div class="radar-item-name">${v.label}</div>
              <div class="radar-item-sub">→ ${v.directionLabel[this.lang]}</div>
            </div>
          </div>
          <span class="radar-item-speed">${v.speedKmh} km/h</span>
        </button>
      `
      )
      .join('');

    this.radarListEl.querySelectorAll<HTMLButtonElement>('[data-vehicle-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.vehicleId;
        const target = this.latestVehicles.find((v) => v.id === id);
        if (target) {
          this.openDrawer = null;
          this.cb.onFocusVehicle(target);
          this.render();
        }
      });
    });
  }

  private renderVehicleCard(v: ActiveVehicle | null): void {
    if (!this.vehicleCardEl) return;
    if (!v) {
      this.vehicleCardEl.classList.remove('open');
      return;
    }

    this.hintEl?.classList.add('hidden');
    this.vehicleCardEl.classList.add('open');

    const statusKey =
      v.status === 'boarding'
        ? 'statusBoarding'
        : v.status === 'approaching'
          ? 'statusApproaching'
          : v.status === 'landing'
            ? 'statusLanding'
            : v.status === 'takeoff'
              ? 'statusTakeoff'
              : 'statusRunning';

    const stopLabel =
      v.kind === 'flight'
        ? t(this.lang, 'routeLabel')
        : v.status === 'boarding'
          ? t(this.lang, 'currentStop')
          : t(this.lang, 'nextStop');

    const stopVal =
      v.kind === 'flight'
        ? `${v.origin?.[this.lang] ?? ''} → ${v.destination?.[this.lang] ?? ''}`
        : v.status === 'boarding'
          ? v.currentStation?.[this.lang] ?? ''
          : `${v.nextStation?.[this.lang] ?? ''}${v.etaSec ? ` (${t(this.lang, 'etaPrefix')} ${v.etaSec}s)` : ''}`;

    const altText =
      v.altitude < -2
        ? `${Math.round(v.altitude)} m (${t(this.lang, 'undergroundShort')})`
        : `${Math.round(v.altitude)} m`;

    this.vehicleCardEl.innerHTML = `
      <div class="vc-top-bar" style="background:${v.color}"></div>
      <div class="vc-inner">
        <div class="vc-header">
          <div>
            <div class="vc-badge-row">
              <span class="vc-badge" style="background:${v.color}">${v.routeCode}</span>
              <span class="vc-title">${v.label}</span>
            </div>
            <div class="vc-operator">${v.operator[this.lang]}</div>
          </div>
          <button class="vc-close" data-action="close-vc" title="${t(this.lang, 'close')}">×</button>
        </div>
        <div class="vc-grid">
          <div>
            <div class="vc-field-label">${t(this.lang, 'direction')}</div>
            <div class="vc-field-val">${v.directionLabel[this.lang]}</div>
          </div>
          <div>
            <div class="vc-field-label">${t(this.lang, 'statusLabel')}</div>
            <div class="vc-field-val">${t(this.lang, statusKey)}</div>
          </div>
          <div>
            <div class="vc-field-label">${t(this.lang, 'speedLabel')}</div>
            <div class="vc-field-val">${v.speedKmh} km/h</div>
          </div>
          <div>
            <div class="vc-field-label">${t(this.lang, 'altitudeLabel')}</div>
            <div class="vc-field-val">${altText}</div>
          </div>
        </div>
        <div>
          <div class="vc-field-label">${stopLabel}</div>
          <div class="vc-field-val">${stopVal}</div>
        </div>
        <div class="vc-progress-track">
          <div class="vc-progress-fill" style="width:${Math.round(v.progress * 100)}%;background:${v.color}"></div>
        </div>
        <button class="vc-follow-btn ${this.following ? 'active' : ''}" data-action="toggle-follow">
          ${this.following ? t(this.lang, 'following') : t(this.lang, 'follow')}
        </button>
      </div>
    `;

    this.vehicleCardEl.querySelector('[data-action="close-vc"]')?.addEventListener('click', () => {
      this.cb.onCloseVehicle();
    });
    this.vehicleCardEl
      .querySelector('[data-action="toggle-follow"]')
      ?.addEventListener('click', () => {
        this.cb.onToggleFollow();
      });
  }

  private render(): void {
    const themeLabel =
      this.themeMode === 'auto'
        ? t(this.lang, 'themeAuto')
        : this.themeMode === 'day'
          ? t(this.lang, 'themeDay')
          : t(this.lang, 'themeNight');

    this.root.innerHTML = `
      <!-- Floating Saigon Stamp Toast -->
      <div class="hud-toast" id="hud-toast"></div>

      <!-- Top Left: Saigon Street-Sign Transit Plaque -->
      <div class="hud-card hud-top-left">
        <div class="plaque-header">
          <div>
            <div class="brand-title">
              <span class="brand-tag">SGN</span>
              <h1>${t(this.lang, 'title')}</h1>
            </div>
            <div class="brand-sub">${t(this.lang, 'subtitle')}</div>
          </div>
          <div class="clock-box" id="hud-clock">08:30:00</div>
        </div>

        <div class="plaque-body">
          <div class="live-strip">
            <span class="live-badge sim" id="hud-live-badge"></span>
            <span class="weather-pill" id="hud-weather" style="display:none"></span>
          </div>

          <div class="stats-row">
            <button class="stat-pill" data-radar="metro">
              <span class="stat-pill-top"><span class="stat-dot" style="background:#005eb8"></span>${t(this.lang, 'metro')}</span>
              <strong id="cnt-metro">0</strong>
            </button>
            <button class="stat-pill" data-radar="waterbus">
              <span class="stat-pill-top"><span class="stat-dot" style="background:#f2b705"></span>${t(this.lang, 'waterbus')}</span>
              <strong id="cnt-water">0</strong>
            </button>
            <button class="stat-pill" data-radar="bus">
              <span class="stat-pill-top"><span class="stat-dot" style="background:#0f8a5f"></span>${t(this.lang, 'bus')}</span>
              <strong id="cnt-bus">0</strong>
            </button>
            <button class="stat-pill" data-radar="flight">
              <span class="stat-pill-top"><span class="stat-dot" style="background:#d9381e"></span>${t(this.lang, 'flights')}</span>
              <strong id="cnt-flight">0</strong>
            </button>
          </div>
        </div>
      </div>

      <!-- Top Right: Mechanical Controls & Drawers -->
      <div class="hud-top-right">
        <div class="hud-card toolbar">
          <button class="tool-btn explore-highlight ${this.openDrawer === 'explore' || this.exploreMode !== 'none' ? 'active' : ''}" data-action="drawer-explore">
            ${ICON.explore}<span>${t(this.lang, 'explore')}</span>
          </button>
          <button class="tool-btn ${this.underground ? 'active' : ''}" data-action="underground">
            ${ICON.subway}<span>${t(this.lang, 'underground')}</span>
          </button>
          <button class="tool-btn ${this.openDrawer === 'radar' ? 'active' : ''}" data-action="drawer-radar">
            ${ICON.radar}<span>${t(this.lang, 'radar')}</span>
          </button>
          <button class="tool-btn" data-action="theme">
            ${ICON.theme}<span>${themeLabel}</span>
          </button>
          <button class="tool-btn ${this.openDrawer === 'layers' ? 'active' : ''}" data-action="drawer-layers">
            ${ICON.layers}<span>${t(this.lang, 'layers')}</span>
          </button>
          <button class="tool-btn ${this.openDrawer === 'cameras' ? 'active' : ''}" data-action="drawer-cameras">
            ${ICON.camera}<span>${t(this.lang, 'cameras')}</span>
          </button>
          <button class="tool-btn" data-action="lang">${this.lang.toUpperCase()}</button>
        </div>

        <!-- Explore Mode Launcher Drawer -->
        <div class="hud-card dropdown-panel ${this.openDrawer === 'explore' ? 'open' : ''}">
          <div class="panel-heading">${t(this.lang, 'exploreTitle')}</div>
          <div class="panel-body">
            <button class="explore-card-btn ${this.exploreMode === 'drive' ? 'active' : ''}" data-explore="drive">
              <span class="explore-card-icon">${ICON.car}</span>
              <div>
                <div class="explore-card-title">${t(this.lang, 'modeDrive')}</div>
                <div class="explore-card-desc">${t(this.lang, 'modeDriveDesc')}</div>
              </div>
            </button>
            <button class="explore-card-btn ${this.exploreMode === 'walk' ? 'active' : ''}" data-explore="walk">
              <span class="explore-card-icon">${ICON.walk}</span>
              <div>
                <div class="explore-card-title">${t(this.lang, 'modeWalk')}</div>
                <div class="explore-card-desc">${t(this.lang, 'modeWalkDesc')}</div>
              </div>
            </button>
            <button class="explore-card-btn ${this.exploreMode === 'metro-ride' ? 'active' : ''}" data-explore="metro-ride">
              <span class="explore-card-icon">${ICON.subway}</span>
              <div>
                <div class="explore-card-title">${t(this.lang, 'modeMetro')}</div>
                <div class="explore-card-desc">${t(this.lang, 'modeMetroDesc')}</div>
              </div>
            </button>
            <button class="explore-card-btn ${this.exploreMode === 'drone' ? 'active' : ''}" data-explore="drone">
              <span class="explore-card-icon">${ICON.drone}</span>
              <div>
                <div class="explore-card-title">${t(this.lang, 'modeDrone')}</div>
                <div class="explore-card-desc">${t(this.lang, 'modeDroneDesc')}</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Layers Drawer -->
        <div class="hud-card dropdown-panel ${this.openDrawer === 'layers' ? 'open' : ''}">
          <div class="panel-heading">${t(this.lang, 'layers')}</div>
          <div class="panel-body">
            ${this.renderLayerToggle('metro1', '#005eb8', t(this.lang, 'layerMetro1'))}
            ${this.renderLayerToggle('waterbus', '#f2b705', t(this.lang, 'layerWaterbus'))}
            ${this.renderLayerToggle('buses', '#0f8a5f', t(this.lang, 'layerBuses'))}
            ${this.renderLayerToggle('flights', '#d9381e', t(this.lang, 'layerFlights'))}
            <label class="layer-toggle">
              <span class="layer-toggle-left">
                <span class="layer-swatch" style="background:#0f8a5f"></span>
                <span>${t(this.lang, 'toggleLiveAdsb')}</span>
              </span>
              <input type="checkbox" id="toggle-live-adsb" ${this.liveAdsbEnabled ? 'checked' : ''} />
            </label>
            ${this.renderLayerToggle('plannedMetro', '#f97316', t(this.lang, 'layerPlannedMetro'))}
            ${this.renderLayerToggle('simulatePlannedMetro', '#ea580c', t(this.lang, 'layerSimPlanned'))}
            ${this.renderLayerToggle('buildings3d', '#524e46', t(this.lang, 'layerBuildings'))}
          </div>
        </div>

        <!-- Camera Presets Drawer -->
        <div class="hud-card dropdown-panel ${this.openDrawer === 'cameras' ? 'open' : ''}">
          <div class="panel-heading">${t(this.lang, 'cameras')}</div>
          <div class="panel-body">
            ${CAMERA_PRESETS.map(
              (p) =>
                `<button class="preset-btn" data-preset="${p.id}">${p.name[this.lang]}</button>`
            ).join('')}
          </div>
        </div>

        <!-- Live Radar Drawer -->
        <div class="hud-card dropdown-panel ${this.openDrawer === 'radar' ? 'open' : ''}">
          <div class="panel-heading">${t(this.lang, 'radarTitle')}</div>
          <div class="panel-body">
            <div class="radar-filters">
              <button class="radar-filter-btn ${this.radarFilter === 'metro' ? 'active' : ''}" data-rfilter="metro">${t(this.lang, 'metro')}</button>
              <button class="radar-filter-btn ${this.radarFilter === 'waterbus' ? 'active' : ''}" data-rfilter="waterbus">${t(this.lang, 'waterbus')}</button>
              <button class="radar-filter-btn ${this.radarFilter === 'bus' ? 'active' : ''}" data-rfilter="bus">${t(this.lang, 'bus')}</button>
              <button class="radar-filter-btn ${this.radarFilter === 'flight' ? 'active' : ''}" data-rfilter="flight">${t(this.lang, 'flights')}</button>
            </div>
            <div class="radar-list" id="hud-radar-list"></div>
          </div>
        </div>
      </div>

      <!-- Bottom Left: Vehicle Inspector -->
      <div class="hud-card hud-vehicle-card" id="hud-vehicle-card"></div>

      <!-- Bottom Right: Active Pilot / Explore Console -->
      <div class="hud-card hud-pilot-card ${this.exploreMode !== 'none' ? 'open' : ''}" id="hud-pilot-card">
        ${this.renderPilotCardInner()}
      </div>

      <!-- Subtle Hint -->
      <div class="hud-hint ${this.exploreMode !== 'none' ? 'hidden' : ''}" id="hud-hint">${t(this.lang, 'hintClick')}</div>

      <!-- Bottom Center: Mechanical Time & Playback Dock -->
      <div class="hud-card hud-bottom-center">
        <button class="tool-btn" data-action="pause" title="${t(this.lang, this.paused ? 'play' : 'pause')}">
          ${this.paused ? ICON.play : ICON.pause}
        </button>
        <input class="time-slider" id="hud-time-slider" type="range" min="0" max="86399" step="60" value="30600" />
        <div class="time-presets">
          <button class="time-chip" data-time-sec="30600">${t(this.lang, 'morningRush')}</button>
          <button class="time-chip" data-time-sec="63900">${t(this.lang, 'sunsetTime')}</button>
          <button class="time-chip" data-time-sec="73800">${t(this.lang, 'nightTime')}</button>
        </div>
        <div class="speed-group">
          ${[1, 5, 20, 60]
            .map(
              (m) =>
                `<button class="speed-btn ${this.speed === m ? 'active' : ''}" data-speed="${m}">${m}x</button>`
            )
            .join('')}
        </div>
        <button class="tool-btn" data-action="live">${t(this.lang, 'now')}</button>
      </div>
    `;

    this.clockEl = this.root.querySelector('#hud-clock')!;
    this.sliderEl = this.root.querySelector('#hud-time-slider')!;
    this.countMetroEl = this.root.querySelector('#cnt-metro')!;
    this.countWaterEl = this.root.querySelector('#cnt-water')!;
    this.countBusEl = this.root.querySelector('#cnt-bus')!;
    this.countFlightEl = this.root.querySelector('#cnt-flight')!;
    this.vehicleCardEl = this.root.querySelector('#hud-vehicle-card')!;
    this.hintEl = this.root.querySelector('#hud-hint')!;
    this.radarListEl = this.root.querySelector('#hud-radar-list')!;
    this.toastEl = this.root.querySelector('#hud-toast')!;
    this.liveBadgeEl = this.root.querySelector('#hud-live-badge')!;
    this.weatherEl = this.root.querySelector('#hud-weather')!;
    this.pilotCardEl = this.root.querySelector('#hud-pilot-card')!;
    this.pilotSpeedEl = this.root.querySelector('#pilot-speed') ?? undefined;
    this.pilotAltEl = this.root.querySelector('#pilot-alt') ?? undefined;
    this.pilotMetroInfoEl = this.root.querySelector('#pilot-metro-info') ?? undefined;

    this.prevCounts = { metro: -1, water: -1, bus: -1, flight: -1 };
    this.updateLiveStripDOM();
    if (this.openDrawer === 'radar') {
      this.renderRadarList();
    }
    this.bindEvents();
  }

  private renderPilotCardInner(): string {
    if (this.exploreMode === 'none') return '';
    const meta: Record<Exclude<ExploreMode, 'none'>, { icon: string; titleKey: string }> = {
      drive: { icon: ICON.car, titleKey: 'modeDrive' },
      walk: { icon: ICON.walk, titleKey: 'modeWalk' },
      'metro-ride': { icon: ICON.subway, titleKey: 'modeMetro' },
      drone: { icon: ICON.drone, titleKey: 'modeDrone' }
    };
    const info = meta[this.exploreMode];

    const controlsHtml =
      this.exploreMode === 'metro-ride'
        ? `
          <div class="vc-field-val" id="pilot-metro-info" style="font-size:11.5px">Metro Line 1</div>
          <button class="vc-follow-btn" data-action="switch-metro">${t(this.lang, 'switchTrain')}</button>
        `
        : `
          <div class="pilot-dpad">
            <div class="dpad-grid">
              <div></div>
              <button class="key-btn" data-vkey="forward">W</button>
              <div></div>
              <button class="key-btn" data-vkey="left">A</button>
              <button class="key-btn" data-vkey="backward">S</button>
              <button class="key-btn" data-vkey="right">D</button>
            </div>
            <div class="dpad-vert">
              ${
                this.exploreMode === 'drone'
                  ? `
                    <button class="key-btn" style="height:32px" data-vkey="up">UP ▲</button>
                    <button class="key-btn" style="height:32px" data-vkey="down">DN ▼</button>
                  `
                  : `<button class="key-btn" style="height:72px" data-vkey="boost">BOOST</button>`
              }
            </div>
          </div>
          <div class="pilot-hints">
            ${this.exploreMode === 'drone' ? `${t(this.lang, 'droneAltHint')} • ${t(this.lang, 'boostHint')}` : t(this.lang, 'boostHint')}
          </div>
        `;

    return `
      <div class="pilot-header">
        <div class="pilot-mode-badge">${info.icon}<span>${t(this.lang, info.titleKey)}</span></div>
        <button class="pilot-exit-btn" data-action="exit-explore">${t(this.lang, 'exitExplore')}</button>
      </div>
      <div class="pilot-body">
        <div class="pilot-telemetry">
          <div>
            <div class="vc-field-label">${t(this.lang, 'speedLabel')}</div>
            <div><span class="pilot-num" id="pilot-speed">0</span><span class="pilot-unit">km/h</span></div>
          </div>
          <div>
            <div class="vc-field-label">${t(this.lang, 'altitudeLabel')}</div>
            <div><span class="pilot-num" id="pilot-alt">0</span><span class="pilot-unit">m</span></div>
          </div>
        </div>
        ${controlsHtml}
      </div>
    `;
  }

  private renderLayerToggle(key: keyof LayerVisibility, color: string, label: string): string {
    const checked = this.visibility[key] ? 'checked' : '';
    return `
      <label class="layer-toggle">
        <span class="layer-toggle-left">
          <span class="layer-swatch" style="background:${color}"></span>
          <span>${label}</span>
        </span>
        <input type="checkbox" data-layer="${key}" ${checked} />
      </label>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector('[data-action="underground"]')?.addEventListener('click', () => {
      this.cb.onToggleUnderground();
    });
    this.root.querySelector('[data-action="theme"]')?.addEventListener('click', () => {
      this.cb.onCycleTheme();
    });
    this.root.querySelector('[data-action="lang"]')?.addEventListener('click', () => {
      this.cb.onToggleLang();
    });
    this.root.querySelector('[data-action="drawer-layers"]')?.addEventListener('click', () => {
      this.openDrawer = this.openDrawer === 'layers' ? null : 'layers';
      this.render();
    });
    this.root.querySelector('[data-action="drawer-cameras"]')?.addEventListener('click', () => {
      this.openDrawer = this.openDrawer === 'cameras' ? null : 'cameras';
      this.render();
    });
    this.root.querySelector('[data-action="drawer-radar"]')?.addEventListener('click', () => {
      this.openDrawer = this.openDrawer === 'radar' ? null : 'radar';
      this.render();
    });
    this.root.querySelector('[data-action="drawer-explore"]')?.addEventListener('click', () => {
      this.openDrawer = this.openDrawer === 'explore' ? null : 'explore';
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-explore]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.explore as ExploreMode;
        this.openDrawer = null;
        this.cb.onStartExplore(mode);
      });
    });
    this.root.querySelector('[data-action="exit-explore"]')?.addEventListener('click', () => {
      this.cb.onExitExplore();
    });
    this.root.querySelector('[data-action="switch-metro"]')?.addEventListener('click', () => {
      this.cb.onSwitchMetroTrain();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-vkey]').forEach((btn) => {
      const k = btn.dataset.vkey as keyof KeyState;
      const down = (e: Event) => {
        e.preventDefault();
        this.cb.onVirtualKey(k, true);
      };
      const up = () => this.cb.onVirtualKey(k, false);
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up);
    });
    this.root.querySelector('[data-action="pause"]')?.addEventListener('click', () => {
      this.cb.onTogglePause();
    });
    this.root.querySelector('[data-action="live"]')?.addEventListener('click', () => {
      this.cb.onSyncLive();
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-radar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.radar as RadarFilter;
        this.radarFilter = filter;
        this.openDrawer = 'radar';
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-rfilter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.radarFilter = btn.dataset.rfilter as RadarFilter;
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mult = Number(btn.dataset.speed);
        this.cb.onSpeedChange(mult);
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-time-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.cb.onScrubTime(Number(btn.dataset.timeSec));
      });
    });

    this.root.querySelector<HTMLInputElement>('#toggle-live-adsb')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.liveAdsbEnabled = checked;
      this.cb.onToggleLiveAdsb(checked);
    });

    this.root.querySelectorAll<HTMLInputElement>('[data-layer]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.layer as keyof LayerVisibility;
        this.visibility = { ...this.visibility, [key]: input.checked };
        if (key === 'simulatePlannedMetro' && input.checked) {
          this.visibility.plannedMetro = true;
        }
        this.cb.onVisibilityChange(this.visibility);
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = CAMERA_PRESETS.find((p) => p.id === btn.dataset.preset);
        if (preset) {
          this.openDrawer = null;
          this.cb.onSelectPreset(preset);
          this.render();
        }
      });
    });

    this.sliderEl.addEventListener('mousedown', () => {
      this.isScrubbing = true;
    });
    this.sliderEl.addEventListener('touchstart', () => {
      this.isScrubbing = true;
    });
    const endScrub = () => {
      this.isScrubbing = false;
    };
    this.sliderEl.addEventListener('mouseup', endScrub);
    this.sliderEl.addEventListener('touchend', endScrub);
    this.sliderEl.addEventListener('input', () => {
      this.cb.onScrubTime(Number(this.sliderEl.value));
    });
  }
}
