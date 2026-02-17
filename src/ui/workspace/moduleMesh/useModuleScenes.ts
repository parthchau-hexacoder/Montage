import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ModuleInstance } from "../../../core/composition/ModuleInstance";
import { applyPlan2DStyle } from "../plan2d/planStyle";

type Params = {
  scene: THREE.Object3D;
  module: ModuleInstance;
  interactive: boolean;
};

export function useModuleScenes({ scene, module, interactive }: Params) {
  const freeNodeIds = new Set(
    module.nodes.filter((node) => !node.occupied).map((node) => node.definition.id)
  );
  const moduleScene = useMemo(() => scene.clone(true), [scene]);
  const ghostScene = useMemo(() => createGhostScene(scene), [scene]);

  useEffect(() => {
    // Keep node extraction in local model space.
    module.registerNodesFromScene(scene.clone(true));
  }, [module, scene]);

  useEffect(() => {
    if (!interactive) return;

    applyPlan2DStyle(moduleScene, {
      enabled: interactive,
      freeNodeIds,
    });
  }, [moduleScene, interactive, freeNodeIds]);

  useEffect(() => {
    if (!interactive) return;

    applyPlan2DStyle(ghostScene, {
      enabled: interactive,
      freeNodeIds,
    });
  }, [ghostScene, interactive, freeNodeIds]);

  return { moduleScene, ghostScene };
}

function createGhostScene(scene: THREE.Object3D) {
  const cloned = scene.clone(true);

  cloned.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const ghostMaterials = sourceMaterials.map((material) => {
      const clonedMaterial = material.clone() as THREE.Material & {
        transparent?: boolean;
        opacity?: number;
        depthWrite?: boolean;
        depthTest?: boolean;
      };
      clonedMaterial.transparent = true;
      clonedMaterial.opacity = 0.18;
      clonedMaterial.depthWrite = false;
      clonedMaterial.depthTest = false;
      return clonedMaterial;
    });

    mesh.material = Array.isArray(mesh.material) ? ghostMaterials : ghostMaterials[0];
  });

  return cloned;
}
