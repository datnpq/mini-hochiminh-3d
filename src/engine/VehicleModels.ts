import * as THREE from 'three';

// All models are built in Three.js Y-up coordinates (meters):
// +X = Right, +Y = Up, -Z = Forward (Nose/Front)

export function createMetroCarMesh(
  primaryColor: string,
  accentColor: string,
  isLeadCar: boolean,
  isTailCar: boolean
): THREE.Group {
  const group = new THREE.Group();

  const bodyLen = 20.5;
  const bodyWidth = 3.2;
  const bodyHeight = 3.6;

  // Main silver-white fuselage
  const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLen);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.3,
    metalness: 0.35
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = bodyHeight / 2 + 0.5;
  group.add(body);

  // Signature line-color livery band along sides & front
  const stripeGeo = new THREE.BoxGeometry(bodyWidth + 0.08, 0.95, bodyLen + 0.04);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryColor),
    emissive: new THREE.Color(primaryColor),
    emissiveIntensity: 0.22,
    roughness: 0.35,
    metalness: 0.25
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 1.6;
  group.add(stripe);

  // Accent upper stripe
  const accentGeo = new THREE.BoxGeometry(bodyWidth + 0.06, 0.25, bodyLen + 0.02);
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColor),
    emissive: new THREE.Color(accentColor),
    emissiveIntensity: 0.3
  });
  const accent = new THREE.Mesh(accentGeo, accentMat);
  accent.position.y = 3.75;
  group.add(accent);

  // Illuminated passenger window band (glows warmly at night)
  const winGeo = new THREE.BoxGeometry(bodyWidth + 0.1, 0.95, bodyLen - 2.6);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xffe8a3,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.6
  });
  winMat.userData.isWindow = true;
  const windows = new THREE.Mesh(winGeo, winMat);
  windows.position.y = 2.85;
  group.add(windows);

  // Roof HVAC units
  const hvacGeo = new THREE.BoxGeometry(1.7, 0.45, 3.8);
  const hvacMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6 });
  for (const zPos of [-4.5, 4.5]) {
    const hvac = new THREE.Mesh(hvacGeo, hvacMat);
    hvac.position.set(0, bodyHeight + 0.7, zPos);
    group.add(hvac);
  }

  // Bogie / undercarriage
  const underGeo = new THREE.BoxGeometry(bodyWidth - 0.5, 0.6, bodyLen - 1.2);
  const underMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const under = new THREE.Mesh(underGeo, underMat);
  under.position.y = 0.35;
  group.add(under);

  // Cockpit windshield & headlights on lead car (-Z)
  if (isLeadCar) {
    const cabGeo = new THREE.BoxGeometry(bodyWidth - 0.35, 1.3, 0.3);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.1,
      metalness: 0.85
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 2.8, -bodyLen / 2 - 0.05);
    group.add(cab);

    const lightGeo = new THREE.BoxGeometry(0.45, 0.25, 0.15);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    for (const xPos of [-0.95, 0.95]) {
      const hl = new THREE.Mesh(lightGeo, headMat);
      hl.position.set(xPos, 1.35, -bodyLen / 2 - 0.08);
      group.add(hl);
    }
  }

  // Taillights on tail car (+Z)
  if (isTailCar) {
    const tailGeo = new THREE.BoxGeometry(0.45, 0.25, 0.15);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (const xPos of [-0.95, 0.95]) {
      const tl = new THREE.Mesh(tailGeo, tailMat);
      tl.position.set(xPos, 1.35, bodyLen / 2 + 0.08);
      group.add(tl);
    }
  }

  return group;
}

export function createWaterbusMesh(): THREE.Group {
  const group = new THREE.Group();

  // Catamaran hull (white)
  const hullGeo = new THREE.BoxGeometry(5.6, 1.4, 17.5);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.2
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.7;
  group.add(hull);

  // Tapered bow (-Z)
  const bowGeo = new THREE.ConeGeometry(3.2, 4.2, 4);
  bowGeo.rotateY(Math.PI / 4);
  bowGeo.rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  bow.scale.set(1.2, 0.35, 1.0);
  bow.position.set(0, 0.75, -10.5);
  group.add(bow);

  // Iconic Saigon Waterbus yellow cabin
  const cabinGeo = new THREE.BoxGeometry(4.8, 2.2, 12.2);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.2,
    roughness: 0.35
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 2.4, 0.5);
  group.add(cabin);

  // Panoramic tinted windows
  const winGeo = new THREE.BoxGeometry(4.95, 1.0, 10.6);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.4,
    roughness: 0.15
  });
  winMat.userData.isWindow = true;
  const win = new THREE.Mesh(winGeo, winMat);
  win.position.set(0, 2.65, 0.2);
  group.add(win);

  // White roof canopy
  const roofGeo = new THREE.BoxGeometry(5.0, 0.35, 12.8);
  const roof = new THREE.Mesh(roofGeo, hullMat);
  roof.position.set(0, 3.65, 0.5);
  group.add(roof);

  // Wake foam behind stern (+Z)
  const wakeGeo = new THREE.PlaneGeometry(5.5, 14);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const wake = new THREE.Mesh(wakeGeo, wakeMat);
  wake.position.set(0, 0.15, 15.5);
  group.add(wake);

  return group;
}

export function createBusMesh(colorHex: string): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(2.8, 3.0, 11.2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.18,
    roughness: 0.35,
    metalness: 0.2
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.9;
  group.add(body);

  // White roof
  const roofGeo = new THREE.BoxGeometry(2.6, 0.3, 10.6);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.5;
  group.add(roof);

  // Windows
  const winGeo = new THREE.BoxGeometry(2.9, 1.0, 9.6);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xfef3c7,
    emissiveIntensity: 0.38,
    roughness: 0.2
  });
  winMat.userData.isWindow = true;
  const win = new THREE.Mesh(winGeo, winMat);
  win.position.y = 2.4;
  group.add(win);

  // Front windshield
  const frontGeo = new THREE.BoxGeometry(2.5, 1.25, 0.15);
  const frontMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.1 });
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.position.set(0, 2.35, -5.62);
  group.add(front);

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.45, 0.22, 0.12);
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  for (const xPos of [-0.9, 0.9]) {
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(xPos, 1.0, -5.65);
    group.add(hl);
  }

  return group;
}

export function createAircraftMesh(primaryColor: string, secondaryColor: string): THREE.Group {
  const group = new THREE.Group();

  // Fuselage along Z (-Z is nose)
  const fuseGeo = new THREE.CylinderGeometry(2.1, 2.1, 34, 12);
  fuseGeo.rotateX(Math.PI / 2);
  const fuseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.3
  });
  const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
  group.add(fuselage);

  // Nose cone (-Z)
  const noseGeo = new THREE.ConeGeometry(2.1, 6.5, 12);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuseMat);
  nose.position.z = -20.25;
  group.add(nose);

  // Tail cone (+Z)
  const tailConeGeo = new THREE.ConeGeometry(2.1, 7.5, 12);
  tailConeGeo.rotateX(Math.PI / 2);
  const tailCone = new THREE.Mesh(tailConeGeo, fuseMat);
  tailCone.position.z = 20.75;
  group.add(tailCone);

  // Airline belly/stripe
  const bellyGeo = new THREE.CylinderGeometry(2.15, 2.15, 28, 12);
  bellyGeo.rotateX(Math.PI / 2);
  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryColor),
    emissive: new THREE.Color(primaryColor),
    emissiveIntensity: 0.25,
    roughness: 0.3
  });
  const belly = new THREE.Mesh(bellyGeo, primaryMat);
  belly.scale.set(1, 0.55, 1);
  belly.position.y = -0.7;
  group.add(belly);

  // Swept main wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, -6);
  wingShape.lineTo(19, 4);
  wingShape.lineTo(19, 7.5);
  wingShape.lineTo(0, 2);
  wingShape.lineTo(-19, 7.5);
  wingShape.lineTo(-19, 4);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.55,
    bevelEnabled: false
  });
  wingGeo.rotateX(Math.PI / 2);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.35
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, -0.3, -1);
  group.add(wings);

  // Horizontal stabilizer
  const stabGeo = new THREE.BoxGeometry(12.5, 0.4, 3.2);
  const stab = new THREE.Mesh(stabGeo, wingMat);
  stab.position.set(0, 0.6, 17.5);
  group.add(stab);

  // Vertical tailfin in airline primary color
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(6.5, 0);
  finShape.lineTo(8.5, 7.2);
  finShape.lineTo(5.0, 7.2);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.5,
    bevelEnabled: false
  });
  finGeo.rotateY(-Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, primaryMat);
  fin.position.set(0.25, 1.2, 12.8);
  group.add(fin);

  // Twin jet engines
  const engGeo = new THREE.CylinderGeometry(1.1, 1.0, 4.2, 10);
  engGeo.rotateX(Math.PI / 2);
  const engMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(secondaryColor),
    roughness: 0.35,
    metalness: 0.45
  });
  for (const xPos of [-6.8, 6.8]) {
    const eng = new THREE.Mesh(engGeo, engMat);
    eng.position.set(xPos, -1.6, -2.5);
    group.add(eng);
  }

  // Wingtip navigation lights (Red left, Green right, White strobe)
  const navGeo = new THREE.SphereGeometry(0.55, 6, 6);
  const redLight = new THREE.Mesh(navGeo, new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  redLight.position.set(-18.8, 0, 5.5);
  group.add(redLight);

  const greenLight = new THREE.Mesh(navGeo, new THREE.MeshBasicMaterial({ color: 0x22ff44 }));
  greenLight.position.set(18.8, 0, 5.5);
  group.add(greenLight);

  return group;
}

export function createAircraftShadowMesh(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(18, 20);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });
  return new THREE.Mesh(geo, mat);
}

/** Player-controlled sleek EV Car (Drive Mode) */
export function createPlayerCarMesh(): THREE.Group {
  const group = new THREE.Group();

  // Lower chassis
  const bodyGeo = new THREE.BoxGeometry(2.2, 0.9, 4.8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.5
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.75;
  group.add(body);

  // Sporty cabin
  const cabinGeo = new THREE.BoxGeometry(1.85, 0.72, 2.3);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.85
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.45, 0.2);
  group.add(cabin);

  // Glowing LED headlights (-Z)
  const hlGeo = new THREE.BoxGeometry(0.45, 0.18, 0.15);
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  for (const x of [-0.7, 0.7]) {
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(x, 0.85, -2.42);
    group.add(hl);
  }

  // Neon taillight bar (+Z)
  const tlGeo = new THREE.BoxGeometry(1.8, 0.16, 0.12);
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const tl = new THREE.Mesh(tlGeo, tlMat);
  tl.position.set(0, 0.9, 2.42);
  group.add(tl);

  // Ground glow ring under car
  const ringGeo = new THREE.RingGeometry(2.6, 3.2, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.12;
  group.add(ring);

  return group;
}

/** Player-controlled stylized Pedestrian (Walk Mode) */
export function createPlayerWalkerMesh(): THREE.Group {
  const group = new THREE.Group();

  // Body jacket
  const torsoGeo = new THREE.CylinderGeometry(0.42, 0.52, 1.15, 10);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.35,
    roughness: 0.4
  });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 1.05;
  group.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.42, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.5
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.98;
  group.add(head);

  // Backpack (+Z)
  const packGeo = new THREE.BoxGeometry(0.55, 0.65, 0.32);
  const packMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.3
  });
  const pack = new THREE.Mesh(packGeo, packMat);
  pack.position.set(0, 1.15, 0.42);
  group.add(pack);

  // Ground locator ring
  const ringGeo = new THREE.RingGeometry(1.1, 1.55, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfb923c,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.1;
  group.add(ring);

  return group;
}

/** Player-controlled 3D Quadcopter Drone (Drone Mode) */
export function createPlayerDroneMesh(): THREE.Group {
  const group = new THREE.Group();

  // Central carbon-white body
  const coreGeo = new THREE.BoxGeometry(1.6, 0.65, 2.2);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.4
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Front camera gimbal (-Z)
  const camGeo = new THREE.SphereGeometry(0.38, 10, 10);
  const camMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.85, roughness: 0.1 });
  const cam = new THREE.Mesh(camGeo, camMat);
  cam.position.set(0, -0.35, -1.05);
  group.add(cam);

  // Diagonal X arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const armGeo = new THREE.BoxGeometry(0.28, 0.2, 5.4);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.rotation.y = angle;
    group.add(arm);
  }

  // 4 glowing spinning rotor discs + LEDs
  const rotorPositions: [number, number, number][] = [
    [-1.9, 0.22, -1.9],
    [1.9, 0.22, -1.9],
    [-1.9, 0.22, 1.9],
    [1.9, 0.22, 1.9]
  ];
  const rotorGeo = new THREE.RingGeometry(0.25, 1.25, 16);
  rotorGeo.rotateX(-Math.PI / 2);

  rotorPositions.forEach(([x, y, z], idx) => {
    const isFront = idx < 2;
    const rotorMat = new THREE.MeshBasicMaterial({
      color: isFront ? 0x38bdf8 : 0x22c55e,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const disc = new THREE.Mesh(rotorGeo, rotorMat);
    disc.position.set(x, y, z);
    disc.userData.isRotor = true;
    group.add(disc);

    const bladeGeo = new THREE.BoxGeometry(2.3, 0.06, 0.16);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(x, y + 0.04, z);
    blade.userData.isRotor = true;
    group.add(blade);
  });

  return group;
}
