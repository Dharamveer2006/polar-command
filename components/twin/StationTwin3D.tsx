'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { StationAsset, StationId } from '@/types';

interface StationTwin3DProps {
  stationId: StationId;
  assets: StationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

export default function StationTwin3D({
  stationId,
  assets,
  selectedAssetId,
  onSelectAsset,
}: StationTwin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredAssetName, setHoveredAssetName] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);
    scene.fog = new THREE.FogExp2(0x070c18, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(28, 22, 32);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x72ddf7, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 1.5, 60);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Polar Ice Surface Terrain
    const terrainGeo = new THREE.PlaneGeometry(80, 80, 24, 24);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x111c3d,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Grid helper on ice
    const grid = new THREE.GridHelper(80, 40, 0x00f0ff, 0x1c2541);
    grid.position.y = 0.05;
    scene.add(grid);

    // Asset 3D Mesh Mappings
    const assetMeshes: { mesh: THREE.Object3D; assetId: string; name: string }[] = [];

    // 1. Main Station Complex (central elevated block)
    const mainGeo = new THREE.BoxGeometry(12, 4, 7);
    const mainMat = new THREE.MeshStandardMaterial({
      color: stationId === 'bharati' ? 0x2563eb : 0xd97706, // Bharati blue or Maitri warm orange
      roughness: 0.3,
      metalness: 0.4,
    });
    const mainBuilding = new THREE.Mesh(mainGeo, mainMat);
    mainBuilding.position.set(0, 3, 0);
    mainBuilding.castShadow = true;
    scene.add(mainBuilding);

    // Stilts / Pilings
    const stiltMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    for (let x of [-5, 0, 5]) {
      for (let z of [-3, 3]) {
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5), stiltMat);
        stilt.position.set(x, 1.25, z);
        scene.add(stilt);
      }
    }

    // 2. Power Generation / Cogeneration Module
    const genGeo = new THREE.BoxGeometry(6, 3.5, 5);
    const genMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const genModule = new THREE.Mesh(genGeo, genMat);
    genModule.position.set(-10, 1.75, -5);
    scene.add(genModule);

    // Exhaust stacks
    const stackGeo = new THREE.CylinderGeometry(0.3, 0.3, 3);
    const stackMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const stack1 = new THREE.Mesh(stackGeo, stackMat);
    stack1.position.set(-11, 4.5, -5);
    scene.add(stack1);

    const genAsset = assets.find(a => a.type === 'generator');
    if (genAsset) {
      assetMeshes.push({ mesh: genModule, assetId: genAsset.assetId, name: genAsset.name });
    }

    // 3. Satellite Earth Terminal (Geodesic Radome)
    const radomeGeo = new THREE.SphereGeometry(2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const radomeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1,
    });
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(10, 0, -8);
    scene.add(radome);

    const satAsset = assets.find(a => a.type === 'satellite_uplink');
    if (satAsset) {
      assetMeshes.push({ mesh: radome, assetId: satAsset.assetId, name: satAsset.name });
    }

    // 4. Fuel Farm Tanks
    const tankGeo = new THREE.CylinderGeometry(2, 2, 3.5, 16);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4 });
    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(-10, 1.75, 6);
    scene.add(tank1);

    const fuelAsset = assets.find(a => a.type === 'fuel_pump');
    if (fuelAsset) {
      assetMeshes.push({ mesh: tank1, assetId: fuelAsset.assetId, name: fuelAsset.name });
    }

    // 5. Water Pumphouse / Coast Station
    const pumpGeo = new THREE.BoxGeometry(4, 2.5, 4);
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const pumpStation = new THREE.Mesh(pumpGeo, pumpMat);
    pumpStation.position.set(12, 1.25, 6);
    scene.add(pumpStation);

    const waterAsset = assets.find(a => a.type === 'water_pump');
    if (waterAsset) {
      assetMeshes.push({ mesh: pumpStation, assetId: waterAsset.assetId, name: waterAsset.name });
    }

    // Link Main building to HVAC asset
    const hvacAsset = assets.find(a => a.type === 'hvac');
    if (hvacAsset) {
      assetMeshes.push({ mesh: mainBuilding, assetId: hvacAsset.assetId, name: hvacAsset.name });
    }

    // Alert Beacon Pulses
    const beacons: THREE.Mesh[] = [];
    assets.forEach(asset => {
      if (asset.status === 'warning' || asset.status === 'critical') {
        const target = assetMeshes.find(m => m.assetId === asset.assetId);
        if (target) {
          const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({
            color: asset.status === 'critical' ? 0xef4444 : 0xf59e0b,
          });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.copy(target.mesh.position);
          beacon.position.y += 3.5;
          scene.add(beacon);
          beacons.push(beacon);
        }
      }
    });

    // Orbit Interaction variables
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let angle = 0.8;
    let radius = 42;
    let elevation = 22;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        angle += deltaX * 0.008;
        elevation = Math.max(5, Math.min(45, elevation - deltaY * 0.15));

        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = elevation;
        camera.lookAt(0, 2, 0);
      } else {
        // Raycast for hover
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const intersects = raycaster.intersectObjects(assetMeshes.map(m => m.mesh), true);

        if (intersects.length > 0) {
          const hit = assetMeshes.find(m => m.mesh === intersects[0].object || m.mesh.children.includes(intersects[0].object));
          if (hit) {
            setHoveredAssetName(hit.name);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredAssetName(null);
        container.style.cursor = 'grab';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(assetMeshes.map(m => m.mesh), true);

      if (intersects.length > 0) {
        const hit = assetMeshes.find(m => m.mesh === intersects[0].object || m.mesh.children.includes(intersects[0].object));
        if (hit) {
          onSelectAsset(hit.assetId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(20, Math.min(70, radius + e.deltaY * 0.05));
      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.position.y = elevation;
      camera.lookAt(0, 2, 0);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Pulsate beacons
      beacons.forEach((b, i) => {
        const scale = 1 + Math.sin(time * 4 + i) * 0.4;
        b.scale.set(scale, scale, scale);
      });

      // Subtle slow rotation when not dragging
      if (!isDragging) {
        angle += 0.0006;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.lookAt(0, 2, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, [stationId, assets, onSelectAsset]);

  return (
    <div className="relative w-full h-[450px] rounded-xl overflow-hidden bg-polar-950 border border-polar-border/60">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D UI Overlay HUD */}
      <div className="absolute top-3 left-3 bg-polar-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-polar-border text-[11px] font-mono text-slate-300 pointer-events-none">
        <span className="text-polar-ice font-bold">3D SPATIAL TWIN</span> • Click modules to inspect • Drag to Orbit • Scroll to Zoom
      </div>

      {hoveredAssetName && (
        <div className="absolute bottom-3 left-3 bg-cyan-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-400 text-xs font-mono text-white pointer-events-none shadow-lg">
          Target: <strong className="text-cyan-300">{hoveredAssetName}</strong> (Click to inspect)
        </div>
      )}

      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-polar-900/80 px-2.5 py-1 rounded border border-white/5 pointer-events-none">
        WebGL 3D Engine • Three.js Polar Terrain
      </div>
    </div>
  );
}
