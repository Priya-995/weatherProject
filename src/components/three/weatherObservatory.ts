import * as THREE from 'three';

export type WeatherScenePreset = 'live' | 'clear' | 'rain' | 'storm' | 'night';

export interface ObservatoryTelemetry {
  temperature_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  cloud_cover_percent: number;
  precipitation_mm: number;
  rain_probability_percent: number;
  weather_code: number;
  is_day: boolean;
}

export interface ObservatoryHandles {
  root: THREE.Group;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  fillLight: THREE.DirectionalLight;
  lightningLight: THREE.PointLight;
  fog: THREE.FogExp2;
  update: (
    dt: number,
    elapsed: number,
    telemetry: ObservatoryTelemetry,
    preset: WeatherScenePreset,
    speedMultiplier: number
  ) => void;
  dispose: () => void;
}

// Pre-allocated scratch math helpers (zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _color = new THREE.Color();
const _skyColorTarget = new THREE.Color();
const _groundColorTarget = new THREE.Color();
const _fogColorTarget = new THREE.Color();
const _sunColorTarget = new THREE.Color();

export function terrainHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= 5.2) return 0;
  const blend = THREE.MathUtils.smoothstep(r, 5.2, 18.0);
  const hills =
    Math.sin(x * 0.065) * Math.cos(z * 0.055) * 2.2 +
    Math.sin(x * 0.14 + z * 0.11) * 0.75 +
    Math.max(0, (r - 28) * 0.085);
  return hills * blend;
}

function createCompassDialTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const angle = (i * 10 * Math.PI) / 180;
    const inner = i % 3 === 0 ? radius - 22 : radius - 12;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.stroke();
  }

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - radius + 44);
  ctx.fillText('S', cx, cy + radius - 44);
  ctx.fillText('E', cx + radius - 44, cy);
  ctx.fillText('W', cx - radius + 44, cy);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createSolarPanelTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f2544';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  const cols = 6;
  const rows = 8;
  for (let c = 1; c < cols; c++) {
    const x = (c * size) / cols;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const y = (r * size) / rows;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createGroundTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3b4a3f';
  ctx.fillRect(0, 0, size, size);

  // Deterministic subtle organic stipple
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 4500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 3.5;
    const shade = rand() > 0.5 ? 'rgba(95, 118, 92, 0.25)' : 'rgba(38, 48, 42, 0.28)';
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.anisotropy = maxAniso;
  return tex;
}

export function buildWeatherObservatory(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): ObservatoryHandles {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const root = new THREE.Group();
  scene.add(root);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // Fog & sky baseline
  const fog = new THREE.FogExp2(0xcbd9e8, 0.0085);
  scene.fog = fog;
  scene.background = new THREE.Color(0xcbd9e8);

  // Studio + Outdoor 3-Point Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0x9bd2ff, 0x4b4a3e, 0.78);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sunLight.position.set(22, 28, 16);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 90;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x7cc4ff, 0.55);
  fillLight.position.set(-18, 12, -16);
  scene.add(fillLight);

  const lightningLight = new THREE.PointLight(0xdbeafe, 0, 120, 1.5);
  lightningLight.position.set(12, 34, -18);
  scene.add(lightningLight);

  // 1. Sculpted Outdoor Terrain extending smoothly into horizon fog
  const terrainTex = trackTex(createGroundTexture(maxAniso));
  const terrainGeo = trackGeo(new THREE.PlaneGeometry(240, 240, 72, 72));
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const h = terrainHeightAt(x, z);
    posAttr.setY(i, h);
    const t = THREE.MathUtils.clamp((h + 1.5) / 8.0, 0, 1);
    _color.setRGB(
      THREE.MathUtils.lerp(0.28, 0.42, t),
      THREE.MathUtils.lerp(0.36, 0.41, t),
      THREE.MathUtils.lerp(0.31, 0.37, t)
    );
    colors[i * 3] = _color.r;
    colors[i * 3 + 1] = _color.g;
    colors[i * 3 + 2] = _color.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();
  const terrainMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: terrainTex,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
    })
  );
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isSoftwareGl;
  root.add(terrainMesh);

  // 2. Perimeter Boulders (InstancedMesh with +-15% scale & color tint variation)
  const rockGeo = trackGeo(new THREE.DodecahedronGeometry(1.0, 1));
  const rockMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.06,
    })
  );
  const rockCount = 64;
  const rocksMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocksMesh.castShadow = !isSoftwareGl;
  rocksMesh.receiveShadow = !isSoftwareGl;
  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.19;
    const radius = 14 + ((i * 7) % 44);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrainHeightAt(x, z);
    const s = 0.85 + ((i * 13) % 10) * 0.03; // +-15% scale variation around base
    const stretchY = 0.55 + ((i * 5) % 4) * 0.12;
    _vec3.set(x, y + s * stretchY * 0.35, z);
    _euler.set(((i * 3) % 7) * 0.2, angle * 1.7, ((i * 11) % 5) * 0.15);
    _quat.setFromEuler(_euler);
    _scale.set(s * 1.2, s * stretchY, s * 1.05);
    _mat4.compose(_vec3, _quat, _scale);
    rocksMesh.setMatrixAt(i, _mat4);
    const tint = 0.48 + ((i * 17) % 10) * 0.025;
    _color.setRGB(tint, tint * 0.98, tint * 0.94);
    rocksMesh.setColorAt(i, _color);
  }
  rocksMesh.instanceMatrix.needsUpdate = true;
  if (rocksMesh.instanceColor) rocksMesh.instanceColor.needsUpdate = true;
  rocksMesh.computeBoundingSphere();
  root.add(rocksMesh);

  // 3. Composite Hero Automated Weather Station (AWS) Group (10 distinct parts, bottom-center grounded at y=0)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(0, terrainHeightAt(0, 0), 0);
  root.add(stationGroup);

  // Contact shadow disc under station plinth
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 128;
  contactCanvas.height = 128;
  const cCtx = contactCanvas.getContext('2d')!;
  const grad = cCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(10, 15, 25, 0.62)');
  grad.addColorStop(0.6, 'rgba(10, 15, 25, 0.22)');
  grad.addColorStop(1, 'rgba(10, 15, 25, 0)');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, 128, 128);
  const contactTex = trackTex(new THREE.CanvasTexture(contactCanvas));
  contactTex.colorSpace = THREE.SRGBColorSpace;
  const contactMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  const contactPlane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6.8, 6.8)), contactMat);
  contactPlane.rotation.x = -Math.PI / 2;
  contactPlane.position.y = 0.02;
  stationGroup.add(contactPlane);

  // Part 1: Octagonal Concrete Plinth (ExtrudeGeometry with bevels)
  const plinthShape = new THREE.Shape();
  const sides = 8;
  const plinthR = 2.1;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(a) * plinthR;
    const py = Math.sin(a) * plinthR;
    if (i === 0) plinthShape.moveTo(px, py);
    else plinthShape.lineTo(px, py);
  }
  plinthShape.closePath();
  const plinthGeo = trackGeo(
    new THREE.ExtrudeGeometry(plinthShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2,
    })
  );
  plinthGeo.rotateX(-Math.PI / 2);
  const concreteMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      metalness: 0.06,
    })
  );
  const plinthMesh = new THREE.Mesh(plinthGeo, concreteMat);
  plinthMesh.position.y = 0.06;
  plinthMesh.castShadow = !isSoftwareGl;
  plinthMesh.receiveShadow = !isSoftwareGl;
  stationGroup.add(plinthMesh);

  // Part 2: Brushed Compass Rose Plate seated flush above plinth (+0.03 offset to prevent Z-fighting)
  const compassTex = trackTex(createCompassDialTexture(maxAniso));
  const compassPlateMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: compassTex,
      roughness: 0.42,
      metalness: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const compassPlate = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.55, 1.55, 0.04, 32)),
    compassPlateMat
  );
  compassPlate.position.y = 0.48;
  compassPlate.receiveShadow = !isSoftwareGl;
  stationGroup.add(compassPlate);

  // Part 3: Tapered Steel Mast (LatheGeometry)
  const mastProfile = [
    new THREE.Vector2(0.36, 0.0),
    new THREE.Vector2(0.36, 0.12),
    new THREE.Vector2(0.18, 0.25),
    new THREE.Vector2(0.14, 3.2),
    new THREE.Vector2(0.11, 5.4),
    new THREE.Vector2(0.16, 5.5),
    new THREE.Vector2(0.08, 5.65),
  ];
  const mastGeo = trackGeo(new THREE.LatheGeometry(mastProfile, 24));
  if (mastGeo.index && mastGeo.attributes.position && mastGeo.attributes.normal && mastGeo.attributes.uv) {
    mastGeo.computeTangents();
  }
  const brushedSteelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xdbe3ec,
      metalness: 0.9,
      roughness: 0.2,
      anisotropy: 0.75,
      anisotropyRotation: 0.4,
    })
  );
  const mastMesh = new THREE.Mesh(mastGeo, brushedSteelMat);
  mastMesh.position.y = 0.48;
  mastMesh.castShadow = !isSoftwareGl;
  stationGroup.add(mastMesh);

  // Part 4: Horizontal Instrumentation Crossarm
  const armMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.78,
      roughness: 0.28,
    })
  );
  const crossArm = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 2.7, 16)),
    armMat
  );
  crossArm.rotation.z = Math.PI / 2;
  crossArm.position.set(0, 5.45, 0);
  crossArm.castShadow = !isSoftwareGl;
  stationGroup.add(crossArm);

  // Part 5: Louvered Stevenson Radiation Shield (Matte white stacked plates, high roughness contrast)
  const stevensonMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.76,
      metalness: 0.04,
    })
  );
  const stevensonGroup = new THREE.Group();
  stevensonGroup.position.set(0.55, 2.65, 0);
  for (let i = 0; i < 6; i++) {
    const plate = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.07, 18)),
      stevensonMat
    );
    plate.position.y = i * 0.11;
    plate.castShadow = !isSoftwareGl;
    stevensonGroup.add(plate);
  }
  const stevensonBracket = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.55, 0.08, 0.08)),
    armMat
  );
  stevensonBracket.position.set(-0.27, 0.25, 0);
  stevensonGroup.add(stevensonBracket);
  stationGroup.add(stevensonGroup);

  // Part 6: Photovoltaic Solar Panel Assembly (MeshPhysicalMaterial + SRGB CanvasTexture)
  const solarTex = trackTex(createSolarPanelTexture(maxAniso));
  const solarMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: solarTex,
      roughness: 0.16,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    })
  );
  const solarGroup = new THREE.Group();
  solarGroup.position.set(-0.62, 3.65, 0.18);
  solarGroup.rotation.set(0.48, -0.35, 0);
  const solarFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.07, 0.86)), armMat);
  const solarCells = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.08, 0.085, 0.76)), solarMat);
  solarFrame.castShadow = !isSoftwareGl;
  solarGroup.add(solarFrame, solarCells);
  stationGroup.add(solarGroup);

  // Part 7: 3-Cup Lathe Anemometer Rotor (rotates dynamically by wind speed)
  const anemometerGroup = new THREE.Group();
  anemometerGroup.position.set(-1.18, 5.78, 0);
  const cupProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.12, 0.04),
    new THREE.Vector2(0.16, 0.14),
    new THREE.Vector2(0.14, 0.22),
  ];
  const cupGeo = trackGeo(new THREE.LatheGeometry(cupProfile, 16));
  const cupMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.35,
      metalness: 0.45,
      side: THREE.DoubleSide,
    })
  );
  const anemometerHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.09, 0.1, 0.24, 16)),
    brushedSteelMat
  );
  anemometerGroup.add(anemometerHub);
  for (let i = 0; i < 3; i++) {
    const armHolder = new THREE.Group();
    armHolder.rotation.y = (i * Math.PI * 2) / 3;
    const spoke = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 8)),
      brushedSteelMat
    );
    spoke.rotation.z = Math.PI / 2;
    spoke.position.x = 0.22;
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.rotation.x = Math.PI / 2;
    cup.position.set(0.45, 0, -0.08);
    cup.castShadow = !isSoftwareGl;
    armHolder.add(spoke, cup);
    anemometerGroup.add(armHolder);
  }
  stationGroup.add(anemometerGroup);

  // Part 8: Directional Wind Vane (ExtrudeGeometry arrow tail rotating toward wind_direction_deg)
  const vaneGroup = new THREE.Group();
  vaneGroup.position.set(1.18, 5.82, 0);
  const vaneSpine = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.92, 10)),
    brushedSteelMat
  );
  vaneSpine.rotation.x = Math.PI / 2;
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.32, 0.18);
  tailShape.lineTo(0.28, -0.14);
  tailShape.closePath();
  const tailGeo = trackGeo(
    new THREE.ExtrudeGeometry(tailShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 1,
    })
  );
  tailGeo.rotateY(Math.PI / 2);
  const tailMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.4,
    })
  );
  const tailMesh = new THREE.Mesh(tailGeo, tailMat);
  tailMesh.position.set(-0.015, 0, -0.42);
  const noseCone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.075, 0.24, 14)), tailMat);
  noseCone.rotation.x = Math.PI / 2;
  noseCone.position.set(0, 0, 0.48);
  vaneGroup.add(vaneSpine, tailMesh, noseCone);
  stationGroup.add(vaneGroup);

  // Part 9: Tipping-Bucket Rain Gauge (LatheGeometry + Brass Collar) + Translucent Telemetry Dome
  const gaugeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.82,
      roughness: 0.28,
    })
  );
  const rainGauge = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.22, 0.62, 20)),
    brushedSteelMat
  );
  rainGauge.position.set(-1.15, 0.81, 0.85);
  rainGauge.castShadow = !isSoftwareGl;
  const gaugeRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.24, 0.03, 10, 24)), gaugeMat);
  gaugeRim.rotation.x = Math.PI / 2;
  gaugeRim.position.set(-1.15, 1.12, 0.85);
  stationGroup.add(rainGauge, gaugeRim);

  // Telemetry core inside translucent dome
  const coreMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    })
  );
  const telemetryCore = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.14, 1)),
    coreMat
  );
  telemetryCore.position.set(0, 6.26, 0);
  stationGroup.add(telemetryCore);

  const domeMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 1,
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.08,
      clearcoat: 1.0,
      depthWrite: false,
    })
  );
  const domeMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.28, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.65)),
    domeMat
  );
  domeMesh.position.set(0, 6.12, 0);
  domeMesh.renderOrder = 2;
  stationGroup.add(domeMesh);

  // Part 10: Three Tensioned Guy Wires (TubeGeometry) anchoring mast to plinth edge
  const wireMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.3,
    })
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const pTop = new THREE.Vector3(Math.cos(a) * 0.16, 4.75, Math.sin(a) * 0.16);
    const pMid = new THREE.Vector3(Math.cos(a) * 0.98, 2.45, Math.sin(a) * 0.98);
    const pBot = new THREE.Vector3(Math.cos(a) * 1.78, 0.45, Math.sin(a) * 1.78);
    const curve = new THREE.CatmullRomCurve3([pTop, pMid, pBot]);
    const wireGeo = trackGeo(new THREE.TubeGeometry(curve, 12, 0.015, 6, false));
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    stationGroup.add(wireMesh);
  }

  // 4. Sun & Moon Celestial Bodies + Instanced Starfield
  const sunDiscMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xfff7cc })
  );
  const sunDisc = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(2.6, 20, 20)), sunDiscMat);
  sunDisc.position.set(42, 36, -52);
  root.add(sunDisc);

  const starGeo = trackGeo(new THREE.OctahedronGeometry(0.18, 0));
  const starMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0 }));
  const starCount = 160;
  const starsMesh = new THREE.InstancedMesh(starGeo, starMat, starCount);
  for (let i = 0; i < starCount; i++) {
    const theta = ((i * 137.5) % 360) * (Math.PI / 180);
    const phi = 0.25 + ((i * 29) % 100) * 0.011;
    const r = 85;
    _vec3.set(
      Math.cos(theta) * Math.cos(phi) * r,
      Math.sin(phi) * r + 8,
      Math.sin(theta) * Math.cos(phi) * r
    );
    const s = 0.65 + (i % 5) * 0.25;
    _quat.identity();
    _scale.set(s, s, s);
    _mat4.compose(_vec3, _quat, _scale);
    starsMesh.setMatrixAt(i, _mat4);
  }
  starsMesh.instanceMatrix.needsUpdate = true;
  starsMesh.computeBoundingSphere();
  root.add(starsMesh);

  // 5. Multi-Lobe Procedural Cloud Deck
  const cloudGroup = new THREE.Group();
  const cloudMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
    })
  );
  const cloudClusters: Array<{ group: THREE.Group; baseX: number; baseY: number; baseZ: number; speedOffset: number }> = [];
  const lobeGeo = trackGeo(new THREE.IcosahedronGeometry(1.0, 2));
  for (let c = 0; c < 11; c++) {
    const cg = new THREE.Group();
    const angle = (c / 11) * Math.PI * 2;
    const dist = 16 + (c % 3) * 14;
    const bx = Math.cos(angle) * dist;
    const by = 18 + (c % 4) * 2.6;
    const bz = Math.sin(angle) * dist - 8;
    cg.position.set(bx, by, bz);
    for (let l = 0; l < 5; l++) {
      const lobe = new THREE.Mesh(lobeGeo, cloudMat);
      const sx = 2.6 + (l % 3) * 0.9;
      const sy = 1.3 + (l % 2) * 0.6;
      const sz = 2.0 + ((l + 1) % 3) * 0.7;
      lobe.scale.set(sx, sy, sz);
      lobe.position.set((l - 2) * 1.9, (l % 2) * 0.55, ((l * 7) % 3 - 1) * 1.1);
      cg.add(lobe);
    }
    cloudGroup.add(cg);
    cloudClusters.push({ group: cg, baseX: bx, baseY: by, baseZ: bz, speedOffset: 0.6 + (c % 4) * 0.22 });
  }
  root.add(cloudGroup);

  // 6. Instanced Rain Streaks (dynamic positions -> frustumCulled = false)
  const rainCount = 260;
  const rainGeo = trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 1.35, 5));
  const rainMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  );
  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rainMesh.frustumCulled = false;
  const rainDrops: Array<{ x: number; y: number; z: number; speed: number }> = [];
  for (let i = 0; i < rainCount; i++) {
    rainDrops.push({
      x: (((i * 37) % 100) / 100 - 0.5) * 44,
      y: ((i * 53) % 280) / 10,
      z: (((i * 71) % 100) / 100 - 0.5) * 44,
      speed: 19 + (i % 7) * 2.4,
    });
  }
  root.add(rainMesh);

  // 7. Instanced Wind Streamlines flowing past mast
  const windCount = 42;
  const windGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.035, 2.2));
  const windMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    })
  );
  const windMesh = new THREE.InstancedMesh(windGeo, windMat, windCount);
  windMesh.frustumCulled = false;
  const windStreaks: Array<{ x: number; y: number; z: number; offset: number }> = [];
  for (let i = 0; i < windCount; i++) {
    windStreaks.push({
      x: (((i * 43) % 100) / 100 - 0.5) * 26,
      y: 1.4 + ((i * 19) % 75) / 10,
      z: (((i * 61) % 100) / 100 - 0.5) * 26,
      offset: (i * 0.7) % 10,
    });
  }
  root.add(windMesh);

  let currentVaneRad = 0;
  let lightningTimer = 2.5;
  let lightningFlash = 0;

  const update = (
    dt: number,
    elapsed: number,
    telemetry: ObservatoryTelemetry,
    preset: WeatherScenePreset,
    speedMultiplier: number
  ) => {
    const effDt = Math.min(dt, 0.08) * speedMultiplier;

    // Resolve effective atmosphere parameters from preset + live telemetry
    let windKmh = telemetry.wind_speed_kmh;
    let windDeg = telemetry.wind_direction_deg;
    let cloudPct = telemetry.cloud_cover_percent;
    let rainAmount = Math.max(
      telemetry.precipitation_mm > 0 ? 0.45 : 0,
      telemetry.rain_probability_percent >= 55 ? (telemetry.rain_probability_percent - 40) / 60 : 0
    );
    let stormFactor =
      telemetry.weather_code >= 95 ? 1 : 0;
    let isDay = telemetry.is_day;

    if (preset === 'clear') {
      windKmh = Math.max(8, telemetry.wind_speed_kmh * 0.6);
      cloudPct = 14;
      rainAmount = 0;
      stormFactor = 0;
      isDay = true;
    } else if (preset === 'rain') {
      windKmh = Math.max(24, telemetry.wind_speed_kmh);
      cloudPct = 84;
      rainAmount = 0.78;
      stormFactor = 0;
      isDay = true;
    } else if (preset === 'storm') {
      windKmh = Math.max(48, telemetry.wind_speed_kmh * 1.4);
      cloudPct = 96;
      rainAmount = 1.0;
      stormFactor = 1;
      isDay = false;
    } else if (preset === 'night') {
      windKmh = Math.max(10, telemetry.wind_speed_kmh * 0.75);
      cloudPct = 22;
      rainAmount = 0;
      stormFactor = 0;
      isDay = false;
    }

    // Smooth atmospheric color interpolation
    if (stormFactor > 0.5) {
      _skyColorTarget.setHex(0x1e293b);
      _fogColorTarget.setHex(0x1f2937);
      _groundColorTarget.setHex(0x1e2420);
      _sunColorTarget.setHex(0x94a3b8);
    } else if (!isDay) {
      _skyColorTarget.setHex(0x0b132b);
      _fogColorTarget.setHex(0x0f172a);
      _groundColorTarget.setHex(0x172030);
      _sunColorTarget.setHex(0xa5b4fc);
    } else if (rainAmount > 0.25) {
      _skyColorTarget.setHex(0x64748b);
      _fogColorTarget.setHex(0x7c8ea3);
      _groundColorTarget.setHex(0x334139);
      _sunColorTarget.setHex(0xdbeafe);
    } else {
      _skyColorTarget.setHex(0x9bc4e8);
      _fogColorTarget.setHex(0xc2d8ec);
      _groundColorTarget.setHex(0x4b4a3e);
      _sunColorTarget.setHex(0xfff1d6);
    }

    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(_skyColorTarget, 1 - Math.exp(-3.2 * dt));
    }
    fog.color.lerp(_fogColorTarget, 1 - Math.exp(-3.2 * dt));
    fog.density = THREE.MathUtils.damp(
      fog.density,
      stormFactor > 0.5 ? 0.015 : rainAmount > 0.2 ? 0.0115 : 0.0072,
      3.0,
      dt
    );
    hemiLight.color.lerp(_skyColorTarget, 1 - Math.exp(-3.0 * dt));
    hemiLight.groundColor.lerp(_groundColorTarget, 1 - Math.exp(-3.0 * dt));
    hemiLight.intensity = THREE.MathUtils.damp(
      hemiLight.intensity,
      !isDay ? 0.42 : rainAmount > 0.2 ? 0.68 : 0.85,
      3.0,
      dt
    );
    sunLight.color.lerp(_sunColorTarget, 1 - Math.exp(-3.0 * dt));
    sunLight.intensity = THREE.MathUtils.damp(
      sunLight.intensity,
      stormFactor > 0.5 ? 0.7 : !isDay ? 0.55 : rainAmount > 0.2 ? 1.15 : 2.35,
      3.0,
      dt
    );

    // Sun / Moon & Stars visibility
    sunDiscMat.color.setHex(isDay ? 0xfff3c4 : 0xe2e8f0);
    sunDisc.visible = stormFactor < 0.5;
    sunDisc.position.y = THREE.MathUtils.damp(sunDisc.position.y, isDay ? 38 : 30, 2.5, dt);
    starMat.opacity = THREE.MathUtils.damp(
      starMat.opacity,
      !isDay && stormFactor < 0.5 ? 0.88 : 0.0,
      3.0,
      dt
    );
    starsMesh.visible = starMat.opacity > 0.02;

    // Telemetry Core pulse (subtle glowing orb inside glass dome, strictly 3D material not HTML CSS dot)
    coreMat.emissiveIntensity = 1.1 + Math.sin(elapsed * 2.2) * 0.35;

    // Anemometer spin proportional to wind speed
    const spinRadPerSec = THREE.MathUtils.clamp(windKmh * 0.24, 0.4, 24);
    anemometerGroup.rotation.y += spinRadPerSec * effDt;

    // Wind vane smooth direction alignment
    const targetVaneRad = (windDeg * Math.PI) / 180 + Math.sin(elapsed * 1.4) * 0.06;
    currentVaneRad = THREE.MathUtils.damp(currentVaneRad, targetVaneRad, 4.5, dt);
    vaneGroup.rotation.y = currentVaneRad;

    // Drift cloud clusters by wind direction & adjust opacity/scale by cloud cover
    const windDirRad = (windDeg * Math.PI) / 180;
    const windDx = Math.sin(windDirRad);
    const windDz = Math.cos(windDirRad);
    const cloudScale = THREE.MathUtils.clamp(0.45 + (cloudPct / 100) * 0.85, 0.35, 1.35);
    cloudMat.opacity = THREE.MathUtils.damp(
      cloudMat.opacity,
      THREE.MathUtils.clamp(0.2 + (cloudPct / 100) * 0.78, 0.15, 0.96),
      2.5,
      dt
    );
    cloudMat.color.setHex(stormFactor > 0.5 ? 0x475569 : rainAmount > 0.3 ? 0x94a3b8 : 0xf8fafc);

    const driftSpeed = (0.4 + windKmh * 0.04) * effDt;
    for (const c of cloudClusters) {
      c.group.position.x += windDx * driftSpeed * c.speedOffset;
      c.group.position.z += windDz * driftSpeed * c.speedOffset;
      if (c.group.position.x > 64) c.group.position.x = -64;
      if (c.group.position.x < -64) c.group.position.x = 64;
      if (c.group.position.z > 64) c.group.position.z = -64;
      if (c.group.position.z < -64) c.group.position.z = 64;
      c.group.scale.setScalar(cloudScale);
    }

    // Rain streaks update (zero GC)
    rainMesh.visible = rainAmount > 0.05;
    if (rainMesh.visible) {
      rainMat.opacity = THREE.MathUtils.clamp(rainAmount * 0.65, 0.15, 0.72);
      const slantX = windDx * THREE.MathUtils.clamp(windKmh * 0.006, 0.04, 0.32);
      const slantZ = windDz * THREE.MathUtils.clamp(windKmh * 0.006, 0.04, 0.32);
      _euler.set(slantZ, 0, -slantX);
      _quat.setFromEuler(_euler);
      _scale.set(1, 1, 1);

      for (let i = 0; i < rainCount; i++) {
        const drop = rainDrops[i];
        drop.y -= drop.speed * effDt;
        drop.x += windDx * windKmh * 0.08 * effDt;
        drop.z += windDz * windKmh * 0.08 * effDt;
        if (drop.y < 0.2) {
          drop.y = 26 + (i % 6);
          drop.x = (((i * 37) % 100) / 100 - 0.5) * 44;
          drop.z = (((i * 71) % 100) / 100 - 0.5) * 44;
        }
        _vec3.set(drop.x, drop.y, drop.z);
        _mat4.compose(_vec3, _quat, _scale);
        rainMesh.setMatrixAt(i, _mat4);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }

    // Wind streamlines update (zero GC)
    windMat.opacity = THREE.MathUtils.clamp(windKmh / 65, 0.12, 0.45);
    _euler.set(0, windDirRad, 0);
    _quat.setFromEuler(_euler);
    _scale.set(1, 1, THREE.MathUtils.clamp(0.6 + windKmh / 35, 0.6, 2.2));
    for (let i = 0; i < windCount; i++) {
      const ws = windStreaks[i];
      const flow = (0.8 + windKmh * 0.12) * effDt;
      ws.x += windDx * flow;
      ws.z += windDz * flow;
      if (ws.x > 16) ws.x -= 32;
      if (ws.x < -16) ws.x += 32;
      if (ws.z > 16) ws.z -= 32;
      if (ws.z < -16) ws.z += 32;
      _vec3.set(ws.x, ws.y + Math.sin(elapsed * 1.8 + ws.offset) * 0.18, ws.z);
      _mat4.compose(_vec3, _quat, _scale);
      windMesh.setMatrixAt(i, _mat4);
    }
    windMesh.instanceMatrix.needsUpdate = true;

    // Storm lightning flashes
    if (stormFactor > 0.5) {
      lightningTimer -= effDt;
      if (lightningTimer <= 0) {
        lightningFlash = 1.0;
        lightningTimer = 2.6 + ((elapsed * 7.3) % 3.5);
        lightningLight.position.x = Math.sin(elapsed * 2.1) * 24;
      }
      lightningFlash = THREE.MathUtils.damp(lightningFlash, 0, 12, dt);
      lightningLight.intensity = lightningFlash * 42;
      if (lightningFlash > 0.25 && scene.background instanceof THREE.Color) {
        scene.background.lerp(_color.setHex(0xcbd5e1), lightningFlash * 0.45);
      }
    } else {
      lightningLight.intensity = 0;
    }
  };

  const dispose = () => {
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    scene.remove(root, sunLight, hemiLight, fillLight, lightningLight);
  };

  return {
    root,
    sunLight,
    hemiLight,
    fillLight,
    lightningLight,
    fog,
    update,
    dispose,
  };
}
