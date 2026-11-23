import * as THREE from 'three';
import { METRO_LINE_1 } from '../data/metro';
import type { ActiveVehicle } from '../types';
import { buildSaigon3DEnvironment } from './ImmersiveLandmarks';
import type { PlayerPose } from './PlayerController';
import {
  createAircraftMesh,
  createBusMesh,
  createMetroCarMesh,
  createPlayerCarMesh,
  createPlayerDroneMesh,
  createPlayerWalkerMesh,
  createWaterbusMesh
} from './VehicleModels';

const ORIGIN_LNG = 106.706;
const ORIGIN_LAT = 10.785;
const METERS_PER_DEG_LAT = 110574;
const METERS_PER_DEG_LNG = 111320 * Math.cos((ORIGIN_LAT * Math.PI) / 180);

export function lngLatAltToWorld(lng: number, lat: number, alt = 0): THREE.Vector3 {
  const x = (lng - ORIGIN_LNG) * METERS_PER_DEG_LNG; // +X = East
  const z = -(lat - ORIGIN_LAT) * METERS_PER_DEG_LAT; // -Z = North, +Z = South
  return new THREE.Vector3(x, alt, z);
}

interface WorldVehicleNode {
  cars: THREE.Object3D[];
}

export class ImmersiveWorld {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private fog: THREE.FogExp2;
  private stars: THREE.Points;
  private waterMat: THREE.MeshStandardMaterial;
  private winMat: THREE.MeshStandardMaterial;

  private vehicleRoot = new THREE.Group();
  private vehicleNodes = new Map<string, WorldVehicleNode>();

  private playerCar: THREE.Group;
  private playerWalker: THREE.Group;
  private playerDrone: THREE.Group;

  // Smooth camera state + mouse look offset
  private camPos = new THREE.Vector3(0, 50, 0);
  private camLook = new THREE.Vector3(0, 40, -100);
  private camInitialized = false;
  private lookYawOffset = 0;
  private lookPitchOffset = 0;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private active = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.className = 'immersive-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(0x0f172a, 0.00024);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      66,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.4,
      9000
    );

    // Lighting
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.sunLight.position.set(600, 900, 400);
    this.scene.add(this.sunLight);

    // Twinkling starfield dome for evening/night immersion
    this.stars = this.createStarfield();
    this.scene.add(this.stars);

    // Build 3D Saigon landmarks, river, avenues & procedural skyline
    const env = buildSaigon3DEnvironment(lngLatAltToWorld);
    this.waterMat = env.waterMat;
    this.winMat = env.winMat;
    this.scene.add(env.group);

    // Build 3D Metro Line 1 elevated viaduct + glowing underground subway tunnel rings!
    this.scene.add(this.buildMetro3DInfrastructure());

    // Live transit vehicles root
    this.scene.add(this.vehicleRoot);

    // Player 3D avatars
    this.playerCar = createPlayerCarMesh();
    this.playerWalker = createPlayerWalkerMesh();
    this.playerDrone = createPlayerDroneMesh();
    for (const p of [this.playerCar, this.playerWalker, this.playerDrone]) {
      p.visible = false;
      this.scene.add(p);
    }

    this.bindEvents();
  }

  private createStarfield(): THREE.Points {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = 3600;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(120, r * Math.cos(phi));
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 7,
      transparent: true,
      opacity: 0.75,
      fog: false
    });
    return new THREE.Points(geo, mat);
  }

  private buildMetro3DInfrastructure(): THREE.Group {
    const group = new THREE.Group();
    const pts = METRO_LINE_1.path.map((p) => lngLatAltToWorld(p.coord[0], p.coord[1], p.altitude));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);

    // Continuous glowing blue track guideway
    const trackGeo = new THREE.TubeGeometry(curve, 240, 2.6, 8, false);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    group.add(new THREE.Mesh(trackGeo, trackMat));

    // Elevated concrete viaduct piers & underground neon tunnel arches
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75 });
    const ringGeo = new THREE.TorusGeometry(9.5, 0.55, 8, 20, Math.PI);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const samples = 220;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      if (p.y >= 6 && i % 3 === 0) {
        // Elevated concrete support pier
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, p.y, 8), pillarMat);
        pier.position.set(p.x, p.y / 2, p.z);
        group.add(pier);
      } else if (p.y < -3) {
        // Glowing arched underground tunnel rib!
        const arch = new THREE.Mesh(ringGeo, ringMat);
        arch.position.set(p.x, p.y - 1.2, p.z);
        arch.lookAt(p.x + tangent.x, p.y - 1.2 + tangent.y, p.z + tangent.z);
        group.add(arch);
      }
    }

    return group;
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', (e) => {
      if (!this.active) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.active || !this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.lookYawOffset -= dx * 0.0045;
      this.lookPitchOffset = Math.max(-0.6, Math.min(0.7, this.lookPitchOffset - dy * 0.0035));
    });

    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.container.classList.toggle('active', active);
    if (active) {
      this.camInitialized = false;
      this.lookYawOffset = 0;
      this.lookPitchOffset = 0;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  private updateAtmosphere(daylightFactor: number, isUnderground: boolean): void {
    if (isUnderground) {
      const ugColor = new THREE.Color(0x040b18);
      this.scene.background = ugColor;
      this.fog.color.copy(ugColor);
      this.fog.density = 0.0012;
      this.hemiLight.intensity = 0.7;
      this.sunLight.intensity = 0.35;
      this.stars.visible = false;
      this.winMat.emissiveIntensity = 0.85;
      return;
    }

    const nightSky = new THREE.Color(0x081024);
    const sunsetSky = new THREE.Color(0x7c3f58);
    const daySky = new THREE.Color(0x60a5fa);

    const skyColor = new THREE.Color();
    if (daylightFactor < 0.5) {
      skyColor.copy(nightSky).lerp(sunsetSky, daylightFactor * 2);
    } else {
      skyColor.copy(sunsetSky).lerp(daySky, (daylightFactor - 0.5) * 2);
    }

    this.scene.background = skyColor;
    this.fog.color.copy(skyColor);
    this.fog.density = 0.00022;
    this.hemiLight.intensity = 0.5 + daylightFactor * 0.85;
    this.sunLight.intensity = 0.45 + daylightFactor * 1.65;
    this.stars.visible = daylightFactor < 0.55;
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - daylightFactor * 1.9);
    this.winMat.emissiveIntensity = 0.22 + (1 - daylightFactor) * 0.78;
    this.waterMat.emissiveIntensity = 0.18 + (1 - daylightFactor) * 0.25;
  }

  private syncVehicles(vehicles: ActiveVehicle[]): void {
    const activeIds = new Set<string>();

    for (const v of vehicles) {
      activeIds.add(v.id);
      let node = this.vehicleNodes.get(v.id);
      if (!node) {
        node = this.createVehicleNode(v);
        this.vehicleNodes.set(v.id, node);
        for (const car of node.cars) this.vehicleRoot.add(car);
      }

      if (v.cars && v.cars.length > 0 && node.cars.length === v.cars.length) {
        for (let i = 0; i < v.cars.length; i++) {
          const cp = v.cars[i];
          const mesh = node.cars[i];
          const p = lngLatAltToWorld(cp.lng, cp.lat, cp.altitude + 1.5);
          mesh.position.copy(p);
          mesh.rotation.order = 'YXZ';
          mesh.rotation.y = -cp.bearing;
          mesh.rotation.x = cp.pitch;
        }
      } else {
        const mesh = node.cars[0];
        const p = lngLatAltToWorld(v.lng, v.lat, v.altitude + (v.kind === 'flight' ? 0 : 0.5));
        mesh.position.copy(p);
        mesh.rotation.order = 'YXZ';
        mesh.rotation.y = -v.bearing;
        mesh.rotation.x = v.pitch;
      }
    }

    for (const [id, node] of this.vehicleNodes.entries()) {
      if (!activeIds.has(id)) {
        for (const car of node.cars) this.vehicleRoot.remove(car);
        this.vehicleNodes.delete(id);
      }
    }
  }

  private createVehicleNode(v: ActiveVehicle): WorldVehicleNode {
    if (v.kind === 'metro' || v.kind === 'future-metro') {
      const count = v.cars?.length ?? 3;
      const cars: THREE.Object3D[] = [];
      for (let i = 0; i < count; i++) {
        cars.push(createMetroCarMesh(v.color, v.accentColor ?? '#38bdf8', i === 0, i === count - 1));
      }
      return { cars };
    }
    if (v.kind === 'waterbus') return { cars: [createWaterbusMesh()] };
    if (v.kind === 'flight') {
      return { cars: [createAircraftMesh(v.color, v.accentColor ?? '#ffffff')] };
    }
    return { cars: [createBusMesh(v.color)] };
  }

  render(pose: PlayerPose, vehicles: ActiveVehicle[], daylightFactor: number): void {
    if (!this.active) return;

    const isUnderground = pose.mode === 'metro-ride' && pose.altitude < -2;
    this.updateAtmosphere(daylightFactor, isUnderground);
    this.syncVehicles(vehicles);

    // Gently decay manual mouse look offset back toward center when not dragging
    if (!this.isDragging) {
      this.lookYawOffset *= 0.96;
      this.lookPitchOffset *= 0.96;
    }

    const pWorld = lngLatAltToWorld(pose.lng, pose.lat, pose.altitude);
    this.playerCar.visible = false;
    this.playerWalker.visible = false;
    this.playerDrone.visible = false;

    const totalYaw = pose.bearing + this.lookYawOffset;
    const forward = new THREE.Vector3(Math.sin(totalYaw), 0, -Math.cos(totalYaw));
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    let targetFov = 66;

    if (pose.mode === 'drive') {
      this.playerCar.visible = true;
      this.playerCar.position.set(pWorld.x, 0.25, pWorld.z);
      this.playerCar.rotation.order = 'YXZ';
      this.playerCar.rotation.y = -pose.bearing;
      this.playerCar.rotation.z = pose.roll;

      // Exciting low 3rd-person chase camera behind the EV car!
      targetCamPos.copy(pWorld).addScaledVector(forward, -14).add(new THREE.Vector3(0, 5.2, 0));
      targetLookAt
        .copy(pWorld)
        .addScaledVector(forward, 38)
        .add(new THREE.Vector3(0, 3.8 + this.lookPitchOffset * 25, 0));
      targetFov = 66 + Math.min(16, (pose.speedKmh / 100) * 16);
    } else if (pose.mode === 'walk') {
      const bob = pose.speedKmh > 1 ? Math.abs(Math.sin(pose.animPhase * 9)) * 0.22 : 0;
      this.playerWalker.visible = true;
      this.playerWalker.position.set(pWorld.x, bob, pWorld.z);
      this.playerWalker.rotation.order = 'YXZ';
      this.playerWalker.rotation.y = -pose.bearing;

      // Cozy over-shoulder street-level pedestrian camera looking up at the skyline!
      targetCamPos.copy(pWorld).addScaledVector(forward, -6.5).add(new THREE.Vector3(0, 3.2 + bob, 0));
      targetLookAt
        .copy(pWorld)
        .addScaledVector(forward, 42)
        .add(new THREE.Vector3(0, 8.5 + this.lookPitchOffset * 30, 0));
      targetFov = 68;
    } else if (pose.mode === 'metro-ride') {
      // True Driver's Cab first-person POV right at the front of the Metro Line 1 train!
      const cabForward = new THREE.Vector3(
        Math.sin(totalYaw) * Math.cos(pose.pitch),
        Math.sin(pose.pitch),
        -Math.cos(totalYaw) * Math.cos(pose.pitch)
      );
      targetCamPos.copy(pWorld).addScaledVector(cabForward, 11.5).add(new THREE.Vector3(0, 4.4, 0));
      targetLookAt
        .copy(pWorld)
        .addScaledVector(cabForward, 85)
        .add(new THREE.Vector3(0, 4.2 + this.lookPitchOffset * 35, 0));
      targetFov = 70 + Math.min(10, (pose.speedKmh / 80) * 10);
    } else if (pose.mode === 'drone') {
      const hover = Math.sin(pose.animPhase * 3.5) * 0.45;
      this.playerDrone.visible = true;
      this.playerDrone.position.set(pWorld.x, pWorld.y + hover, pWorld.z);
      this.playerDrone.rotation.order = 'YXZ';
      this.playerDrone.rotation.y = -pose.bearing;
      this.playerDrone.rotation.x = pose.pitch;
      this.playerDrone.rotation.z = pose.roll;
      this.playerDrone.scale.setScalar(1.35);

      this.playerDrone.traverse((child) => {
        if (child.userData.isRotor) child.rotation.y = pose.animPhase * 32;
      });

      // Dramatic aerial FPV chase camera soaring over Saigon River & Landmark 81!
      targetCamPos
        .copy(pWorld)
        .addScaledVector(forward, -16)
        .add(new THREE.Vector3(0, 5.5, 0));
      targetLookAt
        .copy(pWorld)
        .addScaledVector(forward, 95)
        .add(new THREE.Vector3(0, -12 + this.lookPitchOffset * 65, 0));
      targetFov = 72 + Math.min(14, (pose.speedKmh / 160) * 14);
    }

    if (!this.camInitialized) {
      this.camPos.copy(targetCamPos);
      this.camLook.copy(targetLookAt);
      this.camInitialized = true;
    } else {
      const smooth = pose.mode === 'metro-ride' ? 0.25 : 0.14;
      this.camPos.lerp(targetCamPos, smooth);
      this.camLook.lerp(targetLookAt, smooth);
    }

    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * 0.12;
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.renderer.render(this.scene, this.camera);
  }
}
