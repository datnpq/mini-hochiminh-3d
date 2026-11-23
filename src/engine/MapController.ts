import maplibregl from 'maplibre-gl';
import { BUS_ROUTES } from '../data/buses';
import { SGN_RUNWAYS } from '../data/flights';
import { t } from '../data/i18n';
import { METRO_LINE_1, PLANNED_METRO_LINES } from '../data/metro';
import { SAIGON_WATERBUS } from '../data/waterbus';
import type {
  ActiveVehicle,
  CameraPreset,
  Lang,
  LayerVisibility,
  Station,
  TransitRoute
} from '../types';
import type { PlayerPose } from './PlayerController';
import { ThreeTransitLayer } from './ThreeLayer';

const STYLE_DAY = 'https://tiles.openfreemap.org/styles/liberty';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

export class MapController {
  readonly map: maplibregl.Map;
  readonly threeLayer: ThreeTransitLayer;

  private isDarkStyle = false;
  private undergroundMode = false;
  private lang: Lang = 'vi';
  private visibility: LayerVisibility;
  private onVehicleSelect: (vehicle: ActiveVehicle | null) => void;
  private stationPopup?: maplibregl.Popup;
  private styleLoaded = false;

  constructor(
    container: HTMLElement,
    initialVisibility: LayerVisibility,
    onVehicleSelect: (vehicle: ActiveVehicle | null) => void
  ) {
    this.visibility = { ...initialVisibility };
    this.onVehicleSelect = onVehicleSelect;
    this.threeLayer = new ThreeTransitLayer();

    this.map = new maplibregl.Map({
      container,
      style: STYLE_DAY,
      center: [106.706, 10.785],
      zoom: 13.4,
      pitch: 58,
      bearing: -24,
      maxPitch: 75,
      minZoom: 10.5,
      maxZoom: 18.5,
      canvasContextAttributes: { antialias: true }
    });

    this.map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'bottom-right'
    );

    this.map.on('style.load', () => {
      this.styleLoaded = true;
      this.setupCustomLayers();
      this.applyVisibility();
      this.applyUndergroundVisuals();
    });

    this.map.on('click', (e) => {
      // 1. First check if user clicked a 3D vehicle
      const picked = this.threeLayer.pickVehicleAtPoint(e.point, 32);
      if (picked) {
        this.stationPopup?.remove();
        this.onVehicleSelect(picked);
        return;
      }

      // 2. Otherwise check if user clicked a station marker
      const stationLayers = [
        'metro1-stations',
        'waterbus-stations',
        'bus-stations',
        'planned-metro-stations'
      ].filter((id) => this.map.getLayer(id));

      const features = this.map.queryRenderedFeatures(e.point, {
        layers: stationLayers
      });

      if (features.length > 0) {
        const props = features[0].properties as Record<string, string>;
        const geom = features[0].geometry as GeoJSON.Point;
        this.showStationPopup(geom.coordinates as [number, number], props);
        return;
      }

      // 3. Clicked empty map -> deselect vehicle
      this.onVehicleSelect(null);
    });

    this.map.on('mousemove', (e) => {
      const picked = this.threeLayer.pickVehicleAtPoint(e.point, 26);
      if (picked) {
        this.map.getCanvas().style.cursor = 'pointer';
        return;
      }
      const stationLayers = [
        'metro1-stations',
        'waterbus-stations',
        'bus-stations',
        'planned-metro-stations'
      ].filter((id) => this.map.getLayer(id));
      const features = stationLayers.length
        ? this.map.queryRenderedFeatures(e.point, { layers: stationLayers })
        : [];
      this.map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    });
  }

  private buildRouteFeatureCollection(routes: TransitRoute[]): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    for (const r of routes) {
      // Split into underground and surface segments for styling
      let curCoords: [number, number][] = [];
      let curUnderground = Boolean(r.path[0]?.underground);

      for (let i = 0; i < r.path.length; i++) {
        const p = r.path[i];
        const isUg = Boolean(p.underground);
        if (i > 0 && isUg !== curUnderground) {
          curCoords.push(p.coord);
          features.push({
            type: 'Feature',
            properties: {
              id: r.id,
              code: r.code,
              color: r.color,
              underground: curUnderground,
              planned: Boolean(r.planned)
            },
            geometry: { type: 'LineString', coordinates: curCoords }
          });
          curCoords = [p.coord];
          curUnderground = isUg;
        } else {
          curCoords.push(p.coord);
        }
      }
      if (curCoords.length >= 2) {
        features.push({
          type: 'Feature',
          properties: {
            id: r.id,
            code: r.code,
            color: r.color,
            underground: curUnderground,
            planned: Boolean(r.planned)
          },
          geometry: { type: 'LineString', coordinates: curCoords }
        });
      }
    }
    return { type: 'FeatureCollection', features };
  }

  private buildStationFeatureCollection(routes: TransitRoute[]): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    const seen = new Set<string>();
    for (const r of routes) {
      for (const st of r.stations) {
        const key = `${r.id}:${st.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        features.push(this.stationToFeature(st, r));
      }
    }
    return { type: 'FeatureCollection', features };
  }

  private stationToFeature(st: Station, r: TransitRoute): GeoJSON.Feature {
    return {
      type: 'Feature',
      properties: {
        id: st.id,
        code: st.code,
        nameVi: st.name.vi,
        nameEn: st.name.en,
        color: r.color,
        lineCode: r.code,
        elevationType: st.elevationType,
        planned: Boolean(r.planned)
      },
      geometry: { type: 'Point', coordinates: st.coord }
    };
  }

  private setupCustomLayers(): void {
    // Ensure 3D buildings layer exists on dark style too
    const style = this.map.getStyle();
    const has3dBuildings = style.layers?.some((l) => l.type === 'fill-extrusion');
    if (!has3dBuildings && style.sources && 'openmaptiles' in style.sources) {
      const labelLayerId = style.layers?.find(
        (l) => l.type === 'symbol' && (l.layout as Record<string, unknown>)?.['text-field']
      )?.id;

      this.map.addLayer(
        {
          id: 'hcmc-3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': this.isDarkStyle ? '#1e293b' : '#cbd5e1',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': this.undergroundMode ? 0.16 : 0.72
          }
        },
        labelLayerId
      );
    }

    // 1. SGN Airport Runways
    this.map.addSource('sgn-runways', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { label: 'RWY 25R/07L' },
            geometry: { type: 'LineString', coordinates: SGN_RUNWAYS.rwy25R }
          },
          {
            type: 'Feature',
            properties: { label: 'RWY 25L/07R' },
            geometry: { type: 'LineString', coordinates: SGN_RUNWAYS.rwy25L }
          }
        ]
      }
    });
    this.map.addLayer({
      id: 'sgn-runways-line',
      type: 'line',
      source: 'sgn-runways',
      paint: {
        'line-color': '#38bdf8',
        'line-width': 5,
        'line-opacity': 0.55,
        'line-dasharray': [4, 2]
      }
    });

    // 2. Planned Metro Lines (Lines 2, 3A, 4)
    this.map.addSource('planned-metro-tracks', {
      type: 'geojson',
      data: this.buildRouteFeatureCollection(PLANNED_METRO_LINES)
    });
    this.map.addSource('planned-metro-stations', {
      type: 'geojson',
      data: this.buildStationFeatureCollection(PLANNED_METRO_LINES)
    });
    this.map.addLayer({
      id: 'planned-metro-line',
      type: 'line',
      source: 'planned-metro-tracks',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 16, 5],
        'line-dasharray': [2.5, 2],
        'line-opacity': 0.75
      }
    });
    this.map.addLayer({
      id: 'planned-metro-stations',
      type: 'circle',
      source: 'planned-metro-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3.5, 16, 6.5],
        'circle-color': '#0f172a',
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': 2
      }
    });

    // 3. Bus & VinBus Routes
    this.map.addSource('bus-tracks', {
      type: 'geojson',
      data: this.buildRouteFeatureCollection(BUS_ROUTES)
    });
    this.map.addSource('bus-stations', {
      type: 'geojson',
      data: this.buildStationFeatureCollection(BUS_ROUTES)
    });
    this.map.addLayer({
      id: 'bus-line',
      type: 'line',
      source: 'bus-tracks',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.8, 16, 3.8],
        'line-opacity': 0.55
      }
    });
    this.map.addLayer({
      id: 'bus-stations',
      type: 'circle',
      source: 'bus-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 16, 5],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5
      }
    });

    // 4. Saigon Waterbus
    this.map.addSource('waterbus-tracks', {
      type: 'geojson',
      data: this.buildRouteFeatureCollection([SAIGON_WATERBUS])
    });
    this.map.addSource('waterbus-stations', {
      type: 'geojson',
      data: this.buildStationFeatureCollection([SAIGON_WATERBUS])
    });
    this.map.addLayer({
      id: 'waterbus-line',
      type: 'line',
      source: 'waterbus-tracks',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#f59e0b',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2.8, 16, 5],
        'line-dasharray': [3, 2],
        'line-opacity': 0.85
      }
    });
    this.map.addLayer({
      id: 'waterbus-stations',
      type: 'circle',
      source: 'waterbus-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4.5, 16, 8],
        'circle-color': '#f59e0b',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });
    this.map.addLayer({
      id: 'waterbus-labels',
      type: 'symbol',
      source: 'waterbus-stations',
      minzoom: 12.2,
      layout: {
        'text-field': ['get', this.lang === 'vi' ? 'nameVi' : 'nameEn'],
        'text-size': 11,
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Bold']
      },
      paint: {
        'text-color': this.isDarkStyle ? '#fde68a' : '#92400e',
        'text-halo-color': this.isDarkStyle ? '#0f172a' : '#ffffff',
        'text-halo-width': 1.5
      }
    });

    // 5. Metro Line 1 (Elevated & Underground)
    this.map.addSource('metro1-tracks', {
      type: 'geojson',
      data: this.buildRouteFeatureCollection([METRO_LINE_1])
    });
    this.map.addSource('metro1-stations', {
      type: 'geojson',
      data: this.buildStationFeatureCollection([METRO_LINE_1])
    });
    this.map.addLayer({
      id: 'metro1-line-glow',
      type: 'line',
      source: 'metro1-tracks',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#38bdf8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 7, 16, 14],
        'line-opacity': 0.25,
        'line-blur': 4
      }
    });
    this.map.addLayer({
      id: 'metro1-line-surface',
      type: 'line',
      source: 'metro1-tracks',
      filter: ['==', ['get', 'underground'], false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0077c8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3.5, 16, 7],
        'line-opacity': 0.95
      }
    });
    this.map.addLayer({
      id: 'metro1-line-underground',
      type: 'line',
      source: 'metro1-tracks',
      filter: ['==', ['get', 'underground'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#38bdf8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3.5, 16, 7],
        'line-dasharray': [2, 1.5],
        'line-opacity': 0.95
      }
    });
    this.map.addLayer({
      id: 'metro1-stations',
      type: 'circle',
      source: 'metro1-stations',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4.5, 16, 8.5],
        'circle-color': [
          'case',
          ['==', ['get', 'elevationType'], 'underground'],
          '#0ea5e9',
          '#ffffff'
        ],
        'circle-stroke-color': '#0077c8',
        'circle-stroke-width': 2.5
      }
    });
    this.map.addLayer({
      id: 'metro1-labels',
      type: 'symbol',
      source: 'metro1-stations',
      minzoom: 11.8,
      layout: {
        'text-field': ['get', this.lang === 'vi' ? 'nameVi' : 'nameEn'],
        'text-size': 11.5,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Bold']
      },
      paint: {
        'text-color': this.isDarkStyle ? '#e0f2fe' : '#0c4a6e',
        'text-halo-color': this.isDarkStyle ? '#0f172a' : '#ffffff',
        'text-halo-width': 1.8
      }
    });

    // 6. Add Three.js 3D Vehicles & Viaducts Layer on top!
    if (!this.map.getLayer(this.threeLayer.id)) {
      this.map.addLayer(this.threeLayer);
    }
  }

  private showStationPopup(coord: [number, number], props: Record<string, string>): void {
    const name = this.lang === 'vi' ? props.nameVi : props.nameEn;
    const elevKey =
      props.elevationType === 'underground'
        ? 'stationUnderground'
        : props.elevationType === 'elevated'
          ? 'stationElevated'
          : props.elevationType === 'water'
            ? 'stationWater'
            : 'stationGround';

    const plannedBadge =
      String(props.planned) === 'true'
        ? `<span class="popup-badge popup-badge-planned">${t(this.lang, 'plannedTag')}</span>`
        : '';

    const html = `
      <div class="station-popup">
        <div class="station-popup-header">
          <span class="station-code" style="background:${props.color}">${props.lineCode}</span>
          <span class="station-name">${name}</span>
        </div>
        <div class="station-popup-meta">
          <span class="popup-badge">${t(this.lang, elevKey)}</span>
          ${plannedBadge}
        </div>
      </div>
    `;

    this.stationPopup?.remove();
    this.stationPopup = new maplibregl.Popup({
      closeButton: false,
      offset: 14,
      className: 'hcmc-popup'
    })
      .setLngLat(coord)
      .setHTML(html)
      .addTo(this.map);
  }

  setStyleTheme(useDark: boolean): void {
    if (this.isDarkStyle === useDark) return;
    this.isDarkStyle = useDark;
    this.styleLoaded = false;
    this.map.setStyle(useDark ? STYLE_DARK : STYLE_DAY);
  }

  setUndergroundMode(enabled: boolean): void {
    this.undergroundMode = enabled;
    this.applyUndergroundVisuals();
  }

  private applyUndergroundVisuals(): void {
    if (!this.styleLoaded) return;
    const layers = this.map.getStyle().layers ?? [];
    for (const layer of layers) {
      if (layer.type === 'fill-extrusion') {
        const opacity = !this.visibility.buildings3d
          ? 0
          : this.undergroundMode
            ? 0.14
            : 0.78;
        this.map.setPaintProperty(layer.id, 'fill-extrusion-opacity', opacity);
      }
    }
  }

  setVisibility(next: LayerVisibility): void {
    this.visibility = { ...next };
    this.applyVisibility();
    this.applyUndergroundVisuals();
  }

  private applyVisibility(): void {
    if (!this.styleLoaded) return;

    const toggle = (ids: string[], visible: boolean) => {
      for (const id of ids) {
        if (this.map.getLayer(id)) {
          this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      }
    };

    toggle(
      [
        'metro1-line-glow',
        'metro1-line-surface',
        'metro1-line-underground',
        'metro1-stations',
        'metro1-labels'
      ],
      this.visibility.metro1
    );
    toggle(
      ['waterbus-line', 'waterbus-stations', 'waterbus-labels'],
      this.visibility.waterbus
    );
    toggle(['bus-line', 'bus-stations'], this.visibility.buses);
    toggle(['sgn-runways-line'], this.visibility.flights);
    toggle(['planned-metro-line', 'planned-metro-stations'], this.visibility.plannedMetro);

    const layers = this.map.getStyle().layers ?? [];
    for (const layer of layers) {
      if (layer.type === 'fill-extrusion') {
        this.map.setLayoutProperty(
          layer.id,
          'visibility',
          this.visibility.buildings3d ? 'visible' : 'none'
        );
      }
    }
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    if (!this.styleLoaded) return;
    const field = ['get', lang === 'vi' ? 'nameVi' : 'nameEn'];
    for (const id of ['metro1-labels', 'waterbus-labels']) {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'text-field', field);
      }
    }
  }

  flyToPreset(preset: CameraPreset): void {
    this.map.flyTo({
      center: preset.center,
      zoom: preset.zoom,
      pitch: preset.pitch,
      bearing: preset.bearing,
      duration: 1400,
      essential: true
    });
  }

  followVehicle(v: ActiveVehicle): void {
    this.map.jumpTo({
      center: [v.lng, v.lat]
    });
  }

  followPlayer(pose: PlayerPose): void {
    // Look slightly ahead of the player so the street/sky opens up in front!
    const lookAheadM = pose.mode === 'walk' ? 28 : pose.mode === 'drive' ? 65 : pose.mode === 'metro-ride' ? 95 : 110;
    const dNorth = Math.cos(pose.bearing) * lookAheadM;
    const dEast = Math.sin(pose.bearing) * lookAheadM;
    const targetLat = pose.lat + dNorth / 110574;
    const targetLng = pose.lng + dEast / (111320 * Math.cos((pose.lat * Math.PI) / 180));

    const curZoom = this.map.getZoom();
    const curPitch = this.map.getPitch();
    this.map.jumpTo({
      center: [targetLng, targetLat],
      bearing: pose.cameraBearingDeg,
      zoom: curZoom + (pose.cameraZoom - curZoom) * 0.12,
      pitch: curPitch + (pose.cameraPitchDeg - curPitch) * 0.12
    });
  }
}
