import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type GyroMode = 'orbital' | 'diagnostic' | 'harmonic';

interface Olympiad3DCanvasProps {
  mode?: GyroMode;
  accent?: 'cyan' | 'lime';
  className?: string;
  label?: string;
}

const _targetScale = new THREE.Vector3(1, 1, 1);

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function Olympiad3DCanvas({
  mode = 'orbital',
  accent = 'cyan',
  className = 'h-[300px] sm:h-[340px] w-full',
  label = 'Interactive 3D X Olympiad Gyroscope Core',
}: Olympiad3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<GyroMode>(mode);
  const accentRef = useRef<'cyan' | 'lime'>(accent);
  const requestDrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    accentRef.current = accent;
    requestDrawRef.current?.();
  }, [mode, accent]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(240, container.clientWidth || 480);
    const height = Math.max(220, container.clientHeight || 320);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.055);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(0, 0.45, 5.4);
    camera.lookAt(0, -0.05, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    container.replaceChildren(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Warm/Cool 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0x9beeff, 0x0f172a, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.8);
    keyLight.position.set(4.5, 6.2, 5.0);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.camera.left = -3;
      keyLight.shadow.camera.right = 3;
      keyLight.shadow.camera.top = 3;
      keyLight.shadow.camera.bottom = -3;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00f0ff, 8.0, 18);
    rimLight.position.set(-3.4, 2.2, 2.8);
    scene.add(rimLight);

    const limeRimLight = new THREE.PointLight(0xb8ff00, 5.0, 16);
    limeRimLight.position.set(3.2, -1.6, 2.4);
    scene.add(limeRimLight);

    // Composite 3-12 part THREE.Group ("XOF Gyroscope Core")
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    const disposables: Array<{ dispose: () => void }> = [];

    // Part 1: Inner faceted obsidian-crystal polyhedron core
    const coreGeo = new THREE.IcosahedronGeometry(0.86, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b2a3c,
      emissive: 0x00465a,
      emissiveIntensity: 0.45,
      metalness: 0.35,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = !isSoftwareGl;
    heroGroup.add(coreMesh);
    disposables.push(coreGeo, coreMat);

    // Part 2: Neon precision geodesic wireframe cage
    const cageGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.65,
      metalness: 0.8,
      roughness: 0.25,
      wireframe: true,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    heroGroup.add(cageMesh);
    disposables.push(cageGeo, cageMat);

    // Part 3: Brushed-titanium equatorial gimbal ring
    const eqRingGeo = new THREE.TorusGeometry(1.48, 0.048, 18, 64);
    const eqRingMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
    });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI * 0.42;
    heroGroup.add(eqRing);
    disposables.push(eqRingGeo, eqRingMat);

    // Part 4: Tilted acid-lime telemetry ring
    const limeRingGeo = new THREE.TorusGeometry(1.76, 0.032, 16, 64);
    const limeRingMat = new THREE.MeshStandardMaterial({
      color: 0xb8ff00,
      emissive: 0x6b9900,
      emissiveIntensity: 0.45,
      metalness: 0.62,
      roughness: 0.48,
    });
    const limeRing = new THREE.Mesh(limeRingGeo, limeRingMat);
    limeRing.rotation.set(-0.52, 0.35, 0.4);
    heroGroup.add(limeRing);
    disposables.push(limeRingGeo, limeRingMat);

    // Part 5: Outer structural caliper ring
    const outerRingGeo = new THREE.TorusGeometry(2.02, 0.026, 14, 72);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x007a8a,
      emissiveIntensity: 0.5,
      metalness: 0.78,
      roughness: 0.26,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.set(0.7, -0.45, 0.2);
    heroGroup.add(outerRing);
    disposables.push(outerRingGeo, outerRingMat);

    // Part 6: 4 Instanced octahedral orbital beacon nodes attached to equatorial gimbal
    const beaconGeo = new THREE.OctahedronGeometry(0.11, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      metalness: 0.3,
      roughness: 0.2,
    });
    const beaconCount = 4;
    const beaconMesh = new THREE.InstancedMesh(beaconGeo, beaconMat, beaconCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < beaconCount; i++) {
      const angle = (i / beaconCount) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * 1.48, Math.sin(angle) * 1.48, 0);
      dummy.rotation.set(angle, angle * 0.5, 0);
      dummy.updateMatrix();
      beaconMesh.setMatrixAt(i, dummy.matrix);
    }
    beaconMesh.instanceMatrix.needsUpdate = true;
    beaconMesh.computeBoundingSphere();
    eqRing.add(beaconMesh);
    disposables.push(beaconGeo, beaconMat);

    // Part 7: Grounded architectural plinth + radial contact shadow disc (disjoint Y >= 0.02)
    const plinthGeo = new THREE.CylinderGeometry(1.75, 1.95, 0.08, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x0d1320,
      metalness: 0.75,
      roughness: 0.65,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -2.28;
    plinthMesh.receiveShadow = !isSoftwareGl;
    scene.add(plinthMesh);
    disposables.push(plinthGeo, plinthMat);

    const shadowGeo = new THREE.CircleGeometry(1.62, 48);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -2.22; // +0.06 above plinth top (-2.24), zero Z-fighting
    scene.add(shadowDisc);
    disposables.push(shadowGeo, shadowMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer drag interaction state (no React state updates inside render loop)
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let targetYaw = 0.25;
    let targetPitch = 0.12;
    let currentYaw = 0.25;
    let currentPitch = 0.12;
    let explodeFactor = 1;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw += dx * 0.008;
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.006, -0.75, 0.75);
      if (prefersReducedMotion) {
        requestRender();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextW = Math.max(240, Math.floor(entry.contentRect.width));
        const nextH = Math.max(220, Math.floor(entry.contentRect.height));
        camera.aspect = nextW / nextH;
        camera.updateProjectionMatrix();
        renderer.setSize(nextW, nextH);
        renderer.render(scene, camera);
      }
    });
    resizeObserver.observe(container);

    let frameId = 0;
    let disposed = false;
    let lastTickTime = performance.now();
    let elapsed = 0;

    function applySceneFrame(dt: number) {
      elapsed += dt;
      const currentMode = modeRef.current;
      const isLime = accentRef.current === 'lime';

      const desiredScale =
        currentMode === 'diagnostic' ? 1.12 : currentMode === 'harmonic' ? 1.05 : 1.0;
      explodeFactor = THREE.MathUtils.damp(explodeFactor, desiredScale, 4.5, dt);

      _targetScale.set(explodeFactor, explodeFactor, explodeFactor);
      cageMesh.scale.copy(_targetScale);

      if (!isDragging && !prefersReducedMotion) {
        const speed = currentMode === 'diagnostic' ? 0.42 : 0.24;
        targetYaw += dt * speed;
      }

      currentYaw = THREE.MathUtils.damp(currentYaw, targetYaw, 6, dt);
      currentPitch = THREE.MathUtils.damp(currentPitch, targetPitch, 6, dt);

      heroGroup.rotation.y = currentYaw;
      heroGroup.rotation.x = currentPitch;
      heroGroup.position.y = Math.sin(elapsed * 1.4) * 0.08;

      coreMesh.rotation.y -= dt * 0.35;
      coreMesh.rotation.z += dt * 0.18;

      eqRing.rotation.z += dt * (currentMode === 'harmonic' ? 0.55 : 0.3);
      limeRing.rotation.y -= dt * (currentMode === 'diagnostic' ? 0.52 : 0.26);
      outerRing.rotation.x += dt * 0.2;

      coreMat.emissive.setHex(isLime ? 0x264800 : 0x00465a);
      cageMat.color.setHex(isLime ? 0xb8ff00 : 0x00f0ff);
      cageMat.emissive.setHex(isLime ? 0x6b9900 : 0x007a8a);
    }

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let renderBusy = false;
    let renderDirty = false;
    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        applySceneFrame(0.016);
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }
    requestDrawRef.current = requestRender;

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.08, Math.max(0.001, (now - lastTickTime) / 1000));
      lastTickTime = now;

      applySceneFrame(dt);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (prefersReducedMotion) {
      requestRender();
    } else if (isSoftwareGl) {
      // Draw initial frame immediately and pace via afterDraw
      applySceneFrame(0.016);
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerUp);
      for (const item of disposables) {
        item.dispose();
      }
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={label}
      data-testid="olympiad-3d-canvas"
      className={`relative select-none overflow-hidden ${className}`}
    />
  );
}
