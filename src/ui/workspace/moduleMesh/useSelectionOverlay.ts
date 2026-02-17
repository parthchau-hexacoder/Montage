import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ModuleInstance } from "../../../core/composition/ModuleInstance";

type Overlay = {
  corners: [number, number, number][];
  geometry: THREE.BufferGeometry;
};

export function useSelectionOverlay(
  module: ModuleInstance,
  moduleScene: THREE.Object3D
): Overlay | null {
  const overlay = useMemo(() => {
    const moduleBounds = resolveModuleBounds(module, moduleScene);
    if (!moduleBounds) return null;

    const minX = moduleBounds.min.x;
    const maxX = moduleBounds.max.x;
    const minZ = moduleBounds.min.z;
    const maxZ = moduleBounds.max.z;
    const y = moduleBounds.max.y + 0.03;
    const corners: [number, number, number][] = [
      [minX, y, minZ],
      [maxX, y, minZ],
      [maxX, y, maxZ],
      [minX, y, maxZ],
    ];

    const linePoints = new Float32Array([
      ...corners[0],
      ...corners[1],
      ...corners[1],
      ...corners[2],
      ...corners[2],
      ...corners[3],
      ...corners[3],
      ...corners[0],
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(linePoints, 3));

    return { corners, geometry };
  }, [module, moduleScene]);

  useEffect(() => {
    return () => {
      overlay?.geometry.dispose();
    };
  }, [overlay]);

  return overlay;
}

function resolveModuleBounds(module: ModuleInstance, moduleScene: THREE.Object3D) {
  if (module.localBounds) {
    return module.localBounds;
  }

  const fallbackBounds = new THREE.Box3().setFromObject(moduleScene);
  if (fallbackBounds.isEmpty()) {
    return null;
  }

  return {
    min: {
      x: fallbackBounds.min.x,
      y: fallbackBounds.min.y,
      z: fallbackBounds.min.z,
    },
    max: {
      x: fallbackBounds.max.x,
      y: fallbackBounds.max.y,
      z: fallbackBounds.max.z,
    },
  };
}
