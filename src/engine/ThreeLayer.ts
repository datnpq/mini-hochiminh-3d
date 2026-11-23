import maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { METRO_LINE_1, PLANNED_METRO_LINES } from '../data/metro';
import type { ActiveVehicle, LayerVisibility, TransitRoute } from '../types';
import type { PlayerPose } from './PlayerController';
import {
  createAircraftMesh,
  createAircraftShadowMesh,
  createBusMesh,
  createMetroCarMesh,
  createPlayerCarMesh,
  createPlayerDroneMesh,
  createPlayerWalkerMesh,
  createWaterbusMesh
} from './VehicleModels';

const ORIGIN_LNG = 106.706;
const ORIGIN_LAT = 10.785;

interface VehicleRenderNode {
  kind: ActiveVehicle['kind'];
  cars: THREE.Object3D[];
  shadow?: THREE.Mesh;
}

export class ThreeTransitLayer implements maplibregl.CustomLayerInterface {
  id = 'hcmc-three-layer';
  type: 'custom' = 'custom';
  renderingMode: '3d' = '3d';

  private map?: maplibregl.Map;
  private camera = new THREE.Camera();
  private scene = new THREE.Scene();
  private renderer?: THREE.WebGLRenderer;

  private originMerc: maplibregl.MercatorCoordinate;
  private meterScale: number;
  private worldMatrix: THREE.Matrix4;

  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;

  private vehicleRoot = new THREE.Group();
  private playerRoot = new THREE.Group();
  private metro1ViaductGroup = new THREE.Group();
  private plannedTunnelGroup = new THREE.Group();
  private selectionRing: THREE.Mesh;

  private playerCarMesh: THREE.Group;
  private playerWalkerMesh: THREE.Group;
  private playerDroneMesh: THREE.Group;
  private playerDroneShadow: THREE.Mesh;

  private nodes = new Map<string, VehicleRenderNode>();
  private latestVehicles: ActiveVehicle[] = [];
  private selectedId: string | null = null;
  private undergroundMode = false;

  constructor() {
    this.originMerc = maplibregl.MercatorCoordinate.fromLngLat([ORIGIN_LNG, ORIGIN_LAT], 0);
    this.meterScale = this.originMerc.meterInMercatorCoordinateUnits();

    // Map Three.js (X=East, Y=Up, Z=South) -> MapLibre Mercator (mx=East, my=South, mz=Up)
    const t = new THREE.Matrix4().makeTranslation(
      this.originMerc.x,
      this.originMerc.y,
      this.originMerc.z
    );
    const s = new THREE.Matrix4().makeScale(this.meterScale, -this.meterScale, this.meterScale);
    const r = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    this.worldMatrix = t.multiply(s).multiply(r);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
    this.sunLight.position.set(120, 220, 140);
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    this.fillLight.position.set(-140, 100, -120);
    this.scene.add(this.fillLight);

    // Selection pulse ring
    const ringGeo = new THREE.RingGeometry(14, 19, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.visible = false;
    this.selectionRing.frustumCulled = false;
    this.scene.add(this.selectionRing);

    this.scene.add(this.metro1ViaductGroup);
    this.scene.add(this.plannedTunnelGroup);
    this.scene.add(this.vehicleRoot);
    this.scene.add(this.playerRoot);

    this.playerCarMesh = createPlayerCarMesh();
    this.playerWalkerMesh = createPlayerWalkerMesh();
    this.playerDroneMesh = createPlayerDroneMesh();
    this.playerDroneShadow = createAircraftShadowMesh();
    this.playerDroneShadow.scale.setScalar(0.35);

    for (const obj of [
      this.playerCarMesh,
      this.playerWalkerMesh,
      this.playerDroneMesh,
      this.playerDroneShadow
    ]) {
      obj.visible = false;
      this.disableFrustumCulling(obj);
      this.playerRoot.add(obj);
    }

    this.buildMetro3DTrack(METRO_LINE_1, this.metro1ViaductGroup, false);
    for (const line of PLANNED_METRO_LINES) {
      this.buildMetro3DTrack(line, this.plannedTunnelGroup, true);
    }
  }

  private lngLatAltToLocal(lng: number, lat: number, alt: number): THREE.Vector3 {
    const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], alt);
    const x = (mc.x - this.originMerc.x) / this.meterScale;
    const y = (mc.z - this.originMerc.z) / this.meterScale;
    const z = (mc.y - this.originMerc.y) / this.meterScale;
    return new THREE.Vector3(x, y, z);
  }

  private buildMetro3DTrack(route: TransitRoute, target: THREE.Group, isPlanned: boolean): void {
    const pts = route.path.map((p) => this.lngLatAltToLocal(p.coord[0], p.coord[1], p.altitude));
    if (pts.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const radius = isPlanned ? 3.2 : 4.2;
    const tubeGeo = new THREE.TubeGeometry(curve, pts.length * 8, radius, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(route.color),
      emissive: new THREE.Color(route.color),
      emissiveIntensity: isPlanned ? 0.55 : 0.35,
      transparent: true,
      opacity: isPlanned ? 0.55 : 0.82,
      roughness: 0.4
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.frustumCulled = false;
    target.add(tube);

    // Add viaduct pillars for elevated Metro Line 1
    if (!isPlanned) {
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.7
      });
      for (let i = 0; i < route.path.length; i++) {
        const p = route.path[i];
        if (p.altitude >= 8) {
          const local = pts[i];
          const pillarGeo = new THREE.CylinderGeometry(1.4, 1.8, p.altitude, 8);
          const pillar = new THREE.Mesh(pillarGeo, pillarMat);
          pillar.position.set(local.x, p.altitude / 2, local.z);
          pillar.frustumCulled = false;
          target.add(pillar);
        }
      }
    }
  }

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext): void {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    this.renderer.autoClear = false;
  }

  onRemove(): void {
    this.renderer?.dispose();
    this.renderer = undefined;
  }

  setDaylight(daylightFactor: number, underground: boolean): void {
    this.undergroundMode = underground;
    if (underground) {
      this.ambientLight.intensity = 1.05;
      this.sunLight.intensity = 0.8;
    } else {
      this.ambientLight.intensity = 0.45 + daylightFactor * 0.55;
      this.sunLight.intensity = 0.4 + daylightFactor * 1.1;
    }
  }

  setSelectedVehicle(id: string | null): void {
    this.selectedId = id;
  }

  updatePlayer(pose: PlayerPose | null): void {
    this.playerCarMesh.visible = false;
    this.playerWalkerMesh.visible = false;
    this.playerDroneMesh.visible = false;
    this.playerDroneShadow.visible = false;

    if (!pose || pose.mode === 'none' || pose.mode === 'metro-ride') return;

    const zoom = this.map ? this.map.getZoom() : 16.5;
    const scale = Math.max(1.15, Math.min(3.5, Math.pow(2, (17.2 - zoom) * 0.55)));
    const pos = this.lngLatAltToLocal(pose.lng, pose.lat, pose.altitude);

    if (pose.mode === 'drive') {
      this.playerCarMesh.visible = true;
      this.playerCarMesh.position.set(pos.x, pos.y + 0.5, pos.z);
      this.playerCarMesh.rotation.order = 'YXZ';
      this.playerCarMesh.rotation.y = -pose.bearing;
      this.playerCarMesh.rotation.z = pose.roll;
      this.playerCarMesh.scale.setScalar(scale * 1.15);
    } else if (pose.mode === 'walk') {
      const bob = pose.speedKmh > 1 ? Math.abs(Math.sin(pose.animPhase * 10)) * 0.45 : 0;
      this.playerWalkerMesh.visible = true;
      this.playerWalkerMesh.position.set(pos.x, pos.y + bob, pos.z);
      this.playerWalkerMesh.rotation.order = 'YXZ';
      this.playerWalkerMesh.rotation.y = -pose.bearing;
      this.playerWalkerMesh.scale.setScalar(scale * 1.35);
    } else if (pose.mode === 'drone') {
      const hover = Math.sin(pose.animPhase * 3.5) * 0.8;
      this.playerDroneMesh.visible = true;
      this.playerDroneMesh.position.set(pos.x, pos.y + hover, pos.z);
      this.playerDroneMesh.rotation.order = 'YXZ';
      this.playerDroneMesh.rotation.y = -pose.bearing;
      this.playerDroneMesh.rotation.x = pose.pitch;
      this.playerDroneMesh.rotation.z = pose.roll;
      const droneScale = Math.max(1.5, scale * 1.45);
      this.playerDroneMesh.scale.setScalar(droneScale);

      // Spin all 4 drone propellers!
      this.playerDroneMesh.traverse((child) => {
        if (child.userData.isRotor) {
          child.rotation.y = pose.animPhase * 28;
        }
      });

      this.playerDroneShadow.visible = true;
      this.playerDroneShadow.position.set(pos.x, 1.2, pos.z);
      this.playerDroneShadow.scale.setScalar(droneScale * 0.25);
    }
  }

  updateVehicles(vehicles: ActiveVehicle[], visibility: LayerVisibility): void {
    this.latestVehicles = vehicles;
    this.metro1ViaductGroup.visible = visibility.metro1;
    this.plannedTunnelGroup.visible = visibility.plannedMetro;

    const zoom = this.map ? this.map.getZoom() : 13.5;
    // Generous zoom-adaptive scaling (like mini-tokyo-3d) so 3D vehicles pop at city overview & shrink to 1:1 close-up
    const zoomScale = Math.max(1.0, Math.min(8.5, Math.pow(2, (16.4 - zoom) * 0.72)));
    const planeScale = Math.max(1.2, Math.min(5.5, Math.pow(2, (15.6 - zoom) * 0.58)));

    const activeIds = new Set<string>();
    let selectedPos: THREE.Vector3 | null = null;

    for (const v of vehicles) {
      activeIds.add(v.id);
      let node = this.nodes.get(v.id);

      if (!node) {
        node = this.createRenderNode(v);
        this.nodes.set(v.id, node);
        for (const car of node.cars) {
          this.vehicleRoot.add(car);
        }
        if (node.shadow) {
          this.vehicleRoot.add(node.shadow);
        }
      }

      // In normal (surface) mode, slightly lift underground trains if undergroundMode is active,
      // or hide underground trains beneath ground? Actually rendering them at negative altitude
      // works naturally in 3D, and in undergroundMode we make them pop with full brightness!
      const isVisible = this.undergroundMode
        ? true
        : !v.underground || zoom > 15.2;

      if (v.cars && v.cars.length > 0 && node.cars.length === v.cars.length) {
        const liftY = this.undergroundMode && v.underground ? 24 : 2;
        for (let i = 0; i < v.cars.length; i++) {
          const cp = v.cars[i];
          const mesh = node.cars[i];
          mesh.visible = isVisible;
          const pos = this.lngLatAltToLocal(cp.lng, cp.lat, cp.altitude + liftY);
          mesh.position.copy(pos);
          mesh.rotation.order = 'YXZ';
          mesh.rotation.y = -cp.bearing;
          mesh.rotation.x = cp.pitch;
          // Keep car length proportional so articulated cars don't swallow each other at low zoom
          const lenScale = Math.min(zoomScale, 1.35 + (zoomScale - 1) * 0.25);
          mesh.scale.set(zoomScale, zoomScale, lenScale);
          if (v.id === this.selectedId && i === 0) {
            selectedPos = pos.clone();
          }
        }
      } else {
        const mesh = node.cars[0];
        mesh.visible = isVisible;
        const pos = this.lngLatAltToLocal(v.lng, v.lat, v.altitude + (v.kind === 'flight' ? 0 : 2));
        mesh.position.copy(pos);
        mesh.rotation.order = 'YXZ';
        mesh.rotation.y = -v.bearing;
        mesh.rotation.x = v.pitch;
        const sc = v.kind === 'flight' ? planeScale : zoomScale * 1.15;
        mesh.scale.setScalar(sc);

        if (node.shadow) {
          node.shadow.visible = isVisible && v.altitude > 10;
          node.shadow.position.set(pos.x, 1.5, pos.z);
          const shadowFade = Math.max(0.06, 0.28 * (1 - v.altitude / 1200));
          (node.shadow.material as THREE.MeshBasicMaterial).opacity = shadowFade;
          node.shadow.scale.setScalar(sc);
        }

        if (v.id === this.selectedId) {
          selectedPos = pos.clone();
        }
      }
    }

    // Remove stale vehicles
    for (const [id, node] of this.nodes.entries()) {
      if (!activeIds.has(id)) {
        for (const car of node.cars) {
          this.vehicleRoot.remove(car);
        }
        if (node.shadow) {
          this.vehicleRoot.remove(node.shadow);
        }
        this.nodes.delete(id);
      }
    }

    // Update selection ring
    if (selectedPos) {
      this.selectionRing.visible = true;
      this.selectionRing.position.copy(selectedPos);
      this.selectionRing.position.y += 1.5;
      const pulse = 1 + 0.18 * Math.sin(performance.now() * 0.006);
      this.selectionRing.scale.setScalar(zoomScale * pulse);
    } else {
      this.selectionRing.visible = false;
    }
  }

  private disableFrustumCulling(obj: THREE.Object3D): void {
    obj.frustumCulled = false;
    obj.traverse((child) => {
      child.frustumCulled = false;
    });
  }

  private createRenderNode(v: ActiveVehicle): VehicleRenderNode {
    let node: VehicleRenderNode;
    if (v.kind === 'metro' || v.kind === 'future-metro') {
      const count = v.cars?.length ?? 3;
      const cars: THREE.Object3D[] = [];
      for (let i = 0; i < count; i++) {
        cars.push(
          createMetroCarMesh(
            v.color,
            v.accentColor ?? '#38bdf8',
            i === 0,
            i === count - 1
          )
        );
      }
      node = { kind: v.kind, cars };
    } else if (v.kind === 'waterbus') {
      node = { kind: v.kind, cars: [createWaterbusMesh()] };
    } else if (v.kind === 'flight') {
      node = {
        kind: v.kind,
        cars: [createAircraftMesh(v.color, v.accentColor ?? '#ffffff')],
        shadow: createAircraftShadowMesh()
      };
    } else {
      node = { kind: v.kind, cars: [createBusMesh(v.color)] };
    }

    for (const car of node.cars) this.disableFrustumCulling(car);
    if (node.shadow) this.disableFrustumCulling(node.shadow);
    return node;
  }

  /** Pick the closest visible vehicle to a clicked screen point (px) */
  pickVehicleAtPoint(point: { x: number; y: number }, maxRadiusPx = 30): ActiveVehicle | null {
    if (!this.map) return null;
    let best: ActiveVehicle | null = null;
    let bestDist = maxRadiusPx;

    for (const v of this.latestVehicles) {
      const projected = this.map.project([v.lng, v.lat]);
      // Approximate altitude offset on screen for aircraft
      const altLiftPx = v.kind === 'flight' ? Math.min(120, v.altitude * 0.12) : 0;
      const dx = projected.x - point.x;
      const dy = projected.y - altLiftPx - point.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = v;
      }
    }
    return best;
  }

  render(_gl: WebGLRenderingContext, options: maplibregl.CustomRenderMethodInput): void {
    if (!this.renderer || !this.map) return;

    const m = new THREE.Matrix4().fromArray(
      options.defaultProjectionData.mainMatrix as number[]
    );
    this.camera.projectionMatrix = m.multiply(this.worldMatrix);

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}
