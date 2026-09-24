// "Tree of Hope" — procedural stand-in for the reference site's scene.glb.
// Fixed full-viewport canvas behind the DOM; scroll drives the camera through
// per-page waypoints, pointer adds parallax, the tree grows in on load.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('scene');
const ready = () => window.dispatchEvent(new Event('scene-ready'));
const noGL = () => { document.documentElement.classList.add('no-webgl'); ready(); };

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const low = innerWidth < 768 || (navigator.hardwareConcurrency || 4) <= 4;

// Camera waypoints per page: [camX, camY, camZ, lookX, lookY, lookZ].
// Look targets sit left of the trunk so the tree lands on the right, clear of text.
const PATHS = {
  home:     [[0, 3, 15, -3, 4.5, 0], [7, 5, 9, -1, 5.5, 0], [-6, 8.5, 6, -1.5, 7, 0], [4, 1.2, 7.5, -1.5, 2.5, 0], [-3, 3, 10, -3, 5, 0], [0, 11, 16, -2.5, 5, 0]],
  about:    [[-7, 6, 11, -2.5, 5.5, 0], [5, 3, 9, -1.5, 4, 0], [0, 12, 12, -1, 6, 0]],
  projects: [[6, 2, 12, -3, 4, 0], [-4, 7, 8, -1, 6.5, 0], [2, 10, 14, -2, 5, 0]],
  programs: [[0, 1, 10, -2.5, 3.5, 0], [8, 6, 6, -1, 6, 0], [-8, 5, 6, -1, 5, 0], [0, 12, 12, -2, 6, 0]],
  gallery:  [[-3, 9, 14, -3, 6, 0], [5, 4, 11, -2, 5, 0]],
  contact:  [[5, 2.5, 10, -2.5, 4, 0], [-3, 8, 9, -1, 6.5, 0]],
  default:  [[0, 3, 14, -2.5, 4.5, 0], [0, 9, 14, -2, 5, 0]],
};

function build() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: 'high-performance' });
  } catch { return noGL(); }
  if (!renderer.getContext()) return noGL();

  const dpr = Math.min(devicePixelRatio, low ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x0d2727, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d2727, 0.042);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0x5f9a8c, 0x0d2727, 1.1));
  const rim = new THREE.DirectionalLight(0xeaae76, 2.2);
  rim.position.set(-4, 10, -8);
  scene.add(rim);
  const glow = new THREE.PointLight(0xeaae76, 30, 14, 1.6);
  glow.position.set(0, 7, 1);
  scene.add(glow);

  // ---- Tree geometry: recursive tapered tubes, deterministic seed ----
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const V = THREE.Vector3;
  const tubes = [], tips = [];
  const TS = low ? 6 : 10, RS = low ? 5 : 7;

  function branch(start, dir, len, radius, depth, isRoot = false) {
    const pts = [start];
    let p = start, d = dir.clone();
    for (let i = 0; i < 3; i++) {
      d.add(new V((rnd() - 0.5) * 0.4, isRoot ? -0.05 : (rnd() - 0.2) * 0.15, (rnd() - 0.5) * 0.4)).normalize();
      p = p.clone().addScaledVector(d, len / 3);
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, TS, radius, RS, false);
    const pos = tube.attributes.position, v = new V();
    for (let i = 0; i <= TS; i++) { // taper each ring toward the curve
      const c = curve.getPointAt(i / TS), f = 1 - (i / TS) * 0.38;
      for (let j = 0; j <= RS; j++) {
        const k = i * (RS + 1) + j;
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(f).add(c);
        pos.setXYZ(k, v.x, v.y, v.z);
      }
    }
    tube.deleteAttribute('uv');
    tubes.push(tube);

    const end = pts[3];
    if (depth === 0) { if (!isRoot) tips.push(end); return; }
    if (!isRoot && depth <= 2) tips.push(pts[2]);
    const n = isRoot ? 2 : depth > 4 ? 2 : 2 + (rnd() < 0.55 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rnd() * 1.5;
      const spread = isRoot ? 0.6 : 0.55 + rnd() * 0.35;
      const nd = d.clone().add(new V(Math.cos(a) * spread, isRoot ? -0.15 : 0.25, Math.sin(a) * spread)).normalize();
      branch(end, nd, len * (0.7 + rnd() * 0.12), radius * 0.62, depth - 1, isRoot);
    }
  }
  branch(new V(0, -0.3, 0), new V(0, 1, 0), 3.4, 0.34, low ? 5 : 6);
  for (let r = 0; r < 5; r++) {
    const a = (r / 5) * Math.PI * 2 + rnd();
    branch(new V(0, 0.4, 0), new V(Math.cos(a), -0.35, Math.sin(a)).normalize(), 2.2, 0.2, 2, true);
  }

  const tree = new THREE.Group();
  const bark = new THREE.Mesh(
    mergeGeometries(tubes),
    new THREE.MeshStandardMaterial({ color: 0x2b4a42, roughness: 0.8, metalness: 0.15, emissive: 0x0b221d }),
  );
  tubes.forEach(t => t.dispose());
  tree.add(bark);

  // ---- Glowing points: leaves / fruit (sway) and pollen (rises) share one shader ----
  const pointsMat = (rise, colA, colB) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: {
      uTime: { value: 0 }, uGrow: { value: 0 }, uPixel: { value: dpr }, uRise: { value: rise },
      uA: { value: new THREE.Color(colA) }, uB: { value: new THREE.Color(colB) },
    },
    vertexShader: /* glsl */`
      uniform float uTime, uGrow, uPixel, uRise;
      attribute float aRand, aSize;
      varying float vMix, vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * .6 + aRand * 6.2831;
        p.x += sin(t + p.y) * (.05 + uRise * .3);
        p.z += cos(t * .8 + p.x) * (.05 + uRise * .3);
        p.y = mix(p.y + sin(t * 1.3) * .03, mod(p.y + uTime * (.15 + aRand * .25), 14.) - 1., uRise);
        float g = smoothstep(aRand * .6, aRand * .6 + .4, uGrow);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixel * g * (60. / -mv.z);
        vMix = aRand;
        vAlpha = g * (.55 + .45 * sin(t * 2.)) * mix(1., smoothstep(-1., 2., p.y) * smoothstep(13., 9., p.y), uRise);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB;
      varying float vMix, vAlpha;
      void main() {
        float a = smoothstep(.5, 0., length(gl_PointCoord - .5));
        vec3 c = mix(uA, uB, step(.86, vMix));
        gl_FragColor = vec4(c * 1.5, a * a * vAlpha);
      }`,
  });

  function points(count, place, rise, colA, colB, sizeMin, sizeMax) {
    const pos = new Float32Array(count * 3), rand = new Float32Array(count), size = new Float32Array(count);
    const v = new V();
    for (let i = 0; i < count; i++) {
      place(v, i);
      pos.set([v.x, v.y, v.z], i * 3);
      rand[i] = rnd();
      size[i] = sizeMin + rnd() * (sizeMax - sizeMin) + (rand[i] > 0.86 ? sizeMax : 0); // fruit = bigger
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return new THREE.Points(g, pointsMat(rise, colA, colB));
  }

  const leafCount = low ? 3200 : 8000;
  const leaves = points(leafCount, (v, i) => {
    const tip = tips[i % tips.length], r = 0.75 * Math.cbrt(rnd());
    v.randomDirection().multiplyScalar(r).add(tip);
  }, 0, 0x5fd39a, 0xeaae76, 1.5, 4);
  tree.add(leaves);

  const pollen = points(low ? 350 : 900, v => {
    const a = rnd() * Math.PI * 2, r = 1 + rnd() * 10;
    v.set(Math.cos(a) * r, rnd() * 14, Math.sin(a) * r);
  }, 1, 0xeaae76, 0xffffff, 1, 2.5);
  scene.add(pollen);

  // soft ground glow
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(12, 48),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec2 vUv; void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(mix(vec3(.92,.68,.46), vec3(.06,.43,.34), smoothstep(0.,.5,d)), smoothstep(1.,0.,d) * .28); }',
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.3;
  scene.add(ground, tree);

  // ---- Camera path ----
  const path = PATHS[document.body.dataset.page] || PATHS.default;
  const wide = () => innerWidth > 900;
  const want = new V(), look = new V(), camLook = new V();
  const pointer = { x: 0, y: 0 }, lerped = { x: 0, y: 0 };

  function sample(progress) {
    const f = progress * (path.length - 1);
    const i = Math.min(Math.floor(f), path.length - 2), t = f - i;
    const s = t * t * (3 - 2 * t);
    const a = path[i], b = path[i + 1];
    want.set(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s);
    look.set(a[3] + (b[3] - a[3]) * s, a[4] + (b[4] - a[4]) * s, a[5] + (b[5] - a[5]) * s);
    if (!wide()) { look.x = 0; want.z += 4; } // centre the tree on narrow screens
  }
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(scrollY / max, 1) : 0;
  };

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    if (reduce) renderer.render(scene, camera);
  }
  addEventListener('resize', resize);
  resize();

  const grow = v => { leaves.material.uniforms.uGrow.value = pollen.material.uniforms.uGrow.value = v; tree.scale.setScalar(Math.max(v, 0.001)); };

  if (reduce) { // static frame, no motion
    grow(1);
    sample(0);
    camera.position.copy(want);
    camera.lookAt(look);
    renderer.render(scene, camera);
    return ready();
  }

  addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  sample(progress());
  camera.position.copy(want).add(new V(0, -3, 12));
  camLook.copy(look);

  const clock = new THREE.Clock();
  let born = -1;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (born < 0) { born = t; document.documentElement.classList.remove('no-webgl'); ready(); } // recover if the loader timed out first
    const g = Math.min((t - born) / 3.2, 1);
    grow(1 - Math.pow(1 - g, 3));

    lerped.x += (pointer.x - lerped.x) * dt * 2;
    lerped.y += (pointer.y - lerped.y) * dt * 2;
    sample(progress());
    want.x += lerped.x * 0.9;
    want.y -= lerped.y * 0.6;
    const k = 1 - Math.exp(-dt * 2.2);
    camera.position.lerp(want, k);
    camLook.lerp(look, k);
    camera.lookAt(camLook);

    tree.rotation.y += dt * 0.04;
    glow.intensity = 26 + Math.sin(t * 1.3) * 6;
    leaves.material.uniforms.uTime.value = pollen.material.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  });
}

build();
