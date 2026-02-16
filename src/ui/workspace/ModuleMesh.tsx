import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { useDesign } from "../../app/providers/DesignProvider";
import { applyPlan2DStyle } from "./plan2d/planStyle";

type Props = {
  module: ModuleInstance;
  interactive: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
};

export const ModuleMesh = observer(({ module, interactive, onDragStateChange }: Props) => {
  const { scene } = useGLTF(module.definition.glbPath);
  const {
    composition,
    trySnap,
    moveModuleGroup,
    canRotateModule,
    selectModule,
    beginInteraction,
    endInteraction,
  } = useDesign();
  const { camera, size, viewport } = useThree();
  const moduleScene = useMemo(() => scene.clone(true), [scene, module.instanceId]);
  const ghostScene = useMemo(() => {
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
  }, [scene, module.instanceId]);
  const [rotationPreviewY, setRotationPreviewY] = useState<number | null>(null);
  const [isRotatingHandle, setIsRotatingHandle] = useState(false);
  const selectionOverlay = useMemo(() => {
    const fallbackBounds = new THREE.Box3().setFromObject(moduleScene);
    const moduleBounds = module.localBounds ?? (!fallbackBounds.isEmpty()
      ? {
        min: { x: fallbackBounds.min.x, y: fallbackBounds.min.y, z: fallbackBounds.min.z },
        max: { x: fallbackBounds.max.x, y: fallbackBounds.max.y, z: fallbackBounds.max.z },
      }
      : null);

    if (!moduleBounds) {
      return null;
    }

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
      ...corners[0], ...corners[1],
      ...corners[1], ...corners[2],
      ...corners[2], ...corners[3],
      ...corners[3], ...corners[0],
    ]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(linePoints, 3));

    return { corners, geometry };
  }, [module.localBounds, moduleScene]);
  const isSelected = composition.selectedModuleId === module.instanceId;
  const canRotate = canRotateModule(module);
  const freeNodeIds = module.nodes
    .filter((node) => !node.occupied)
    .map((node) => node.definition.id);
  const freeNodeKey = freeNodeIds.slice().sort().join("|");

  useEffect(() => {
    module.registerNodesFromScene(moduleScene);
  }, [module, moduleScene]);

  useEffect(() => {
    if (!interactive) return;

    applyPlan2DStyle(moduleScene, {
      enabled: interactive,
      freeNodeIds: new Set(freeNodeIds),
    });
  }, [moduleScene, interactive, freeNodeKey]);

  useEffect(() => {
    if (!interactive) return;

    applyPlan2DStyle(ghostScene, {
      enabled: interactive,
      freeNodeIds: new Set(freeNodeIds),
    });
  }, [ghostScene, interactive, freeNodeKey]);

  const bind = useDrag(({ movement: [mx, my], first, last, memo }) => {
    if (!interactive) return memo;
    if (isRotatingHandle) return memo;

    if (first) {
      onDragStateChange?.(true);
      beginInteraction();
    }
    if (last) {
      onDragStateChange?.(false);
    }

    const start =
      memo ?? {
        x: module.transform.position.x,
        y: module.transform.position.y,
        z: module.transform.position.z,
      };

    const dx = (mx / size.width) * viewport.width;
    const dz = (my / size.height) * viewport.height;

    const worldX = start.x + dx;
    const worldY = start.y;
    const worldZ = start.z + dz;

    moveModuleGroup(module, worldX, worldY, worldZ);
    trySnap(module);

    if (last) {
      endInteraction(module);
    }

    return start;
  }, { enabled: interactive && !isRotatingHandle });

  const rotateBind = useDrag(({ xy: [pointerX, pointerY], first, last, memo }) => {
    if (!interactive || !canRotate) return memo;

    const centerWorld = new THREE.Vector3(
      module.transform.position.x,
      module.transform.position.y,
      module.transform.position.z
    );
    const projected = centerWorld.project(camera);
    const centerX = (projected.x * 0.5 + 0.5) * size.width;
    const centerY = (-projected.y * 0.5 + 0.5) * size.height;
    const pointerAngle = Math.atan2(pointerY - centerY, pointerX - centerX);

    const state = memo ?? {
      baseRotationY: module.transform.rotation.y,
      previousAngle: pointerAngle,
      accumulatedAngle: 0,
    };

    if (first) {
      setIsRotatingHandle(true);
      onDragStateChange?.(true);
      beginInteraction();
      selectModule(module.instanceId);
      setRotationPreviewY(module.transform.rotation.y);
      return state;
    }

    let deltaAngle = pointerAngle - state.previousAngle;
    if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
    if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

    state.accumulatedAngle += deltaAngle;
    state.previousAngle = pointerAngle;

    const previewY = state.baseRotationY + state.accumulatedAngle;
    setRotationPreviewY(previewY);

    if (last) {
      const quarterTurns = Math.round(state.accumulatedAngle / (Math.PI / 2));
      const committedY = state.baseRotationY + quarterTurns * (Math.PI / 2);
      module.setRotation(
        module.transform.rotation.x,
        committedY,
        module.transform.rotation.z
      );
      setRotationPreviewY(null);
      setIsRotatingHandle(false);
      onDragStateChange?.(false);
      endInteraction(module);
    }

    return state;
  }, {
    enabled: interactive && canRotate,
    pointer: { capture: true },
    filterTaps: true,
  });

  return (
    <group
      position={[
        module.transform.position.x,
        module.transform.position.y,
        module.transform.position.z,
      ]}
    >
      {rotationPreviewY !== null && (
        <group
          rotation={[
            module.transform.rotation.x,
            rotationPreviewY,
            module.transform.rotation.z,
          ]}
        >
          <primitive object={ghostScene} renderOrder={10} />
        </group>
      )}
      <group
        {...bind()}
        onClick={
          interactive
            ? (event) => {
              event.stopPropagation();
              selectModule(module.instanceId);
            }
            : undefined
        }
        rotation={[
          module.transform.rotation.x,
          module.transform.rotation.y,
          module.transform.rotation.z,
        ]}
      >
        <primitive object={moduleScene} visible={rotationPreviewY === null} />
        {isSelected && selectionOverlay && (
          <group>
            <lineSegments geometry={selectionOverlay.geometry}>
              <lineBasicMaterial color="#ffd400" />
            </lineSegments>
            {selectionOverlay.corners.map((corner, index) => {
              const rotateHandlers = rotateBind();

              return (
                <mesh
                  key={`${module.instanceId}-corner-${index}`}
                  {...rotateHandlers}
                  position={corner}
                  rotation={[-Math.PI / 2, 0, 0]}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    rotateHandlers.onPointerDown?.(event as any);
                  }}
                >
                  <circleGeometry args={[0.1, 24]} />
                  <meshBasicMaterial color={canRotate ? "#fff" : "#9e9e9e"} />
                </mesh>
              );
            })}
          </group>
        )}
      </group>
    </group>
  );
});
