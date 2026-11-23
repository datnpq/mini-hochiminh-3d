import * as THREE from 'three';

export type LngLatToWorld = (lng: number, lat: number, alt?: number) => THREE.Vector3;

/** Procedural glowing skyscraper window texture (zero external assets, instant load) */
function createWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 256);

  const cols = 8;
  const rows = 24;
  const w = 128 / cols;
  const h = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rnd = Math.sin(r * 19.3 + c * 7.1) * 43758.5453;
      const frac = rnd - Math.floor(rnd);
      if (frac > 0.32) {
        ctx.fillStyle =
          frac > 0.82 ? '#fef08a' : frac > 0.58 ? '#bae6fd' : '#e2e8f0';
        ctx.fillRect(c * w + 2, r * h + 2, w - 4, h - 4);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(c * w + 2, r * h + 2, w - 4, h - 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Build iconic Landmark 81 (461m bundled-tube skyscraper) */
function createLandmark81(winTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    map: winTex,
    emissive: 0x38bdf8,
    emissiveMap: winTex,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.65
  });

  // 5x5 bundled square tubes tapering upward like bamboo
  const grid = 5;
  const tubeW = 11;
  const heights = [
    [130, 180, 210, 175, 120],
    [190, 270, 320, 260, 185],
    [220, 330, 395, 315, 210],
    [175, 255, 305, 245, 165],
    [115, 165, 200, 155, 105]
  ];

  for (let gx = 0; gx < grid; gx++) {
    for (let gz = 0; gz < grid; gz++) {
      const h = heights[gx][gz];
      const geo = new THREE.BoxGeometry(tubeW - 0.5, h, tubeW - 0.5);
      const m = new THREE.Mesh(geo, mat);
      m.position.set((gx - 2) * tubeW, h / 2, (gz - 2) * tubeW);
      group.add(m);

      // Glowing crown cap on each tube
      const capGeo = new THREE.BoxGeometry(tubeW - 0.3, 1.8, tubeW - 0.3);
      const capMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set((gx - 2) * tubeW, h + 0.9, (gz - 2) * tubeW);
      group.add(cap);
    }
  }

  // Iconic 66m illuminated spire reaching 461m
  const spireGeo = new THREE.CylinderGeometry(0.4, 2.2, 66, 8);
  const spireMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 395 + 33;
  group.add(spire);

  // Red aviation beacon at top
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xff2244 })
  );
  beacon.position.y = 462;
  group.add(beacon);

  return group;
}

/** Build iconic Bitexco Financial Tower (262m) with cantilevered helipad */
function createBitexcoTower(winTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  const towerGeo = new THREE.CylinderGeometry(11, 21, 262, 16);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    map: winTex,
    emissive: 0x60a5fa,
    emissiveMap: winTex,
    emissiveIntensity: 0.42,
    roughness: 0.22,
    metalness: 0.7
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.scale.set(1.25, 1, 0.78);
  tower.position.y = 131;
  group.add(tower);

  // Signature cantilevered circular helipad at 191m
  const padGeo = new THREE.CylinderGeometry(14, 12, 3.2, 24);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.3,
    roughness: 0.35
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(22, 191, 0);
  group.add(pad);

  // Helipad glowing rim
  const rimGeo = new THREE.TorusGeometry(14, 0.8, 8, 28);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  rim.position.set(22, 192.6, 0);
  group.add(rim);

  return group;
}

/** Build iconic Ba Son Bridge (Thu Thiem 2) tilted cable-stayed pylon */
function createBaSonBridge(): THREE.Group {
  const group = new THREE.Group();

  // Deck spanning the river
  const deckGeo = new THREE.BoxGeometry(26, 2.8, 360);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = 14;
  group.add(deck);

  // Tilted signature white pylon (113m)
  const pylonGeo = new THREE.CylinderGeometry(2.5, 4.2, 113, 10);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    roughness: 0.3
  });
  const pylon = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.position.set(0, 56, -20);
  pylon.rotation.x = 0.22;
  group.add(pylon);

  // Illuminated stay cables
  const cableMat = new THREE.LineBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.75
  });
  for (let i = 1; i <= 10; i++) {
    const topY = 48 + i * 5.8;
    const topZ = -20 + Math.sin(0.22) * (topY - 56);
    for (const side of [-1, 1]) {
      const pts = [
        new THREE.Vector3(0, topY, topZ),
        new THREE.Vector3(side * 10, 15, i * 16)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, cableMat));
    }
  }

  return group;
}

/** Build iconic Ben Thanh Market with terracotta roof & central clock tower */
function createBenThanhMarket(): THREE.Group {
  const group = new THREE.Group();

  const hallGeo = new THREE.BoxGeometry(92, 13, 72);
  const hallMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.14,
    roughness: 0.7
  });
  const hall = new THREE.Mesh(hallGeo, hallMat);
  hall.position.y = 6.5;
  group.add(hall);

  // Terracotta pitched roof
  const roofGeo = new THREE.ConeGeometry(62, 11, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.75 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.scale.set(1.15, 1, 0.9);
  roof.position.y = 18;
  group.add(roof);

  // Central Clock Tower
  const towerGeo = new THREE.BoxGeometry(10, 24, 10);
  const tower = new THREE.Mesh(towerGeo, hallMat);
  tower.position.set(0, 15, 36);
  group.add(tower);

  const clockFace = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  clockFace.position.set(0, 21, 41.2);
  group.add(clockFace);

  return group;
}

/** Build the entire 3D Saigon environment (river, roads, landmarks, procedural skyline & trees) */
export function buildSaigon3DEnvironment(
  toWorld: LngLatToWorld
): { group: THREE.Group; waterMat: THREE.MeshStandardMaterial; winMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const winTex = createWindowTexture();

  // 1. Ground plane with sleek urban grid
  const groundGeo = new THREE.PlaneGeometry(24000, 24000);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x162033,
    roughness: 0.92,
    metalness: 0.05
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.3;
  group.add(ground);

  // Subtle glowing city grid on the ground for strong 3D spatial depth
  const grid = new THREE.GridHelper(16000, 160, 0x334155, 0x1e293b);
  grid.position.y = -0.15;
  group.add(grid);

  // 2. 3D Saigon River Ribbon following real river coordinates
  const riverCoords: [number, number][] = [
    [106.704, 10.750],
    [106.706, 10.764],
    [106.708, 10.774],
    [106.713, 10.783],
    [106.721, 10.789],
    [106.727, 10.796],
    [106.730, 10.806],
    [106.735, 10.818],
    [106.730, 10.832],
    [106.746, 10.842],
    [106.765, 10.852]
  ];
  const riverPts = riverCoords.map(([lng, lat]) => toWorld(lng, lat, 0.05));
  const riverCurve = new THREE.CatmullRomCurve3(riverPts);
  const riverSamples = riverCurve.getPoints(90);

  const riverPositions: number[] = [];
  const riverIndices: number[] = [];
  const halfWidth = 145; // Saigon River ~290m wide
  for (let i = 0; i < riverSamples.length; i++) {
    const p = riverSamples[i];
    const next = riverSamples[Math.min(riverSamples.length - 1, i + 1)];
    const prev = riverSamples[Math.max(0, i - 1)];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);

    riverPositions.push(p.x - perp.x, 0.08, p.z - perp.z);
    riverPositions.push(p.x + perp.x, 0.08, p.z + perp.z);

    if (i < riverSamples.length - 1) {
      const base = i * 2;
      riverIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
  riverGeo.setIndex(riverIndices);
  riverGeo.computeVertexNormals();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0c4a6e,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25,
    roughness: 0.14,
    metalness: 0.72,
    side: THREE.DoubleSide
  });
  const riverMesh = new THREE.Mesh(riverGeo, waterMat);
  group.add(riverMesh);

  // 3. Illuminated Major Avenues (Nguyen Hue, Le Loi, Vo Nguyen Giap, Ham Nghi)
  const avenues: [number, number][][] = [
    // Nguyen Hue Walking Street
    [
      [106.7014, 10.7764],
      [106.7062, 10.7726]
    ],
    // Le Loi Blvd (Ben Thanh -> Opera House)
    [
      [106.6979, 10.7711],
      [106.7032, 10.7766]
    ],
    // Ton Duc Thang Riverside Blvd
    [
      [106.7048, 10.7685],
      [106.7068, 10.7745],
      [106.7082, 10.7817]
    ]
  ];
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    emissive: 0x1e293b,
    emissiveIntensity: 0.35,
    roughness: 0.75
  });
  for (const av of avenues) {
    for (let i = 0; i < av.length - 1; i++) {
      const a = toWorld(av[i][0], av[i][1], 0.2);
      const b = toWorld(av[i + 1][0], av[i + 1][1], 0.2);
      const len = a.distanceTo(b);
      const road = new THREE.Mesh(new THREE.BoxGeometry(28, 0.35, len), roadMat);
      road.position.copy(a).add(b).multiplyScalar(0.5);
      road.lookAt(b);
      group.add(road);
    }
  }

  // 4. Iconic Ho Chi Minh City Landmarks
  const lm81 = createLandmark81(winTex);
  lm81.position.copy(toWorld(106.7218, 10.7949, 0));
  group.add(lm81);

  const bitexco = createBitexcoTower(winTex);
  bitexco.position.copy(toWorld(106.7044, 10.7716, 0));
  group.add(bitexco);

  const bason = createBaSonBridge();
  bason.position.copy(toWorld(106.7086, 10.7785, 0));
  bason.rotation.y = 0.72;
  group.add(bason);

  const benthanh = createBenThanhMarket();
  benthanh.position.copy(toWorld(106.6980, 10.7725, 0));
  benthanh.rotation.y = -0.65;
  group.add(benthanh);

  // 5. Dense Procedural 3D City Skyline (InstancedMesh = 1 draw call for 700+ towers!)
  const clusters: { lng: number; lat: number; radiusM: number; count: number; maxH: number }[] = [
    { lng: 106.701, lat: 10.776, radiusM: 1200, count: 240, maxH: 135 }, // District 1 CBD
    { lng: 106.722, lat: 10.793, radiusM: 900, count: 140, maxH: 165 }, // Vinhomes Central Park / Binh Thanh
    { lng: 106.718, lat: 10.776, radiusM: 950, count: 110, maxH: 115 }, // Thu Thiem New Urban Area
    { lng: 106.736, lat: 10.803, radiusM: 1000, count: 120, maxH: 95 }, // Thao Dien / An Phu
    { lng: 106.688, lat: 10.772, radiusM: 1100, count: 110, maxH: 75 } // District 3 & 5
  ];

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    map: winTex,
    emissive: 0x93c5fd,
    emissiveMap: winTex,
    emissiveIntensity: 0.35,
    roughness: 0.45,
    metalness: 0.35
  });

  const totalCount = clusters.reduce((acc, c) => acc + c.count, 0);
  const instanced = new THREE.InstancedMesh(boxGeo, winMat, totalCount);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  // Keep iconic landmarks, Nguyen Hue, Le Loi, and river clear of procedural towers
  const landmarkCenters = [
    toWorld(106.7218, 10.7949, 0),
    toWorld(106.7044, 10.7716, 0),
    toWorld(106.6980, 10.7725, 0),
    toWorld(106.7033, 10.7745, 0)
  ];

  let idx = 0;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (const cl of clusters) {
    const center = toWorld(cl.lng, cl.lat, 0);
    for (let i = 0; i < cl.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = (0.15 + Math.sqrt(rand()) * 0.85) * cl.radiusM;
      const x = center.x + Math.cos(angle) * dist;
      const z = center.z + Math.sin(angle) * dist;

      // Avoid placing inside the river or directly on top of landmarks
      let blocked = false;
      for (const lc of landmarkCenters) {
        if (Math.hypot(x - lc.x, z - lc.z) < 85) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        for (let r = 0; r < riverSamples.length; r += 3) {
          if (Math.hypot(x - riverSamples[r].x, z - riverSamples[r].z) < 165) {
            blocked = true;
            break;
          }
        }
      }

      if (blocked) {
        dummy.scale.set(0, 0, 0);
      } else {
        const w = 18 + rand() * 28;
        const d = 18 + rand() * 28;
        const h = 16 + Math.pow(rand(), 1.6) * cl.maxH;
        dummy.position.set(x, h / 2, z);
        dummy.scale.set(w, h, d);
        dummy.rotation.set(0, (Math.floor(rand() * 4) * Math.PI) / 4, 0);
      }
      dummy.updateMatrix();
      instanced.setMatrixAt(idx, dummy.matrix);

      // Subtle architectural color variation
      const shade = 0.55 + rand() * 0.35;
      color.setRGB(shade * 0.88, shade * 0.94, shade);
      instanced.setColorAt(idx, color);
      idx++;
    }
  }
  instanced.instanceMatrix.needsUpdate = true;
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  group.add(instanced);

  return { group, waterMat, winMat };
}
