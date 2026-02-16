import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
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
    trySnap,
    moveModuleGroup,
    selectModule,
    beginInteraction,
    endInteraction,
  } = useDesign();
  const { size, viewport } = useThree();
  const moduleScene = useMemo(() => scene.clone(true), [scene, module.instanceId]);
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

  const bind = useDrag(({ movement: [mx, my], first, last, memo }) => {
    if (!interactive) return memo;

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
  }, { enabled: interactive });

  return (
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
      position={[
        module.transform.position.x,
        module.transform.position.y,
        module.transform.position.z,
      ]}
      rotation={[
        module.transform.rotation.x,
        module.transform.rotation.y,
        module.transform.rotation.z,
      ]}
    >
      <primitive object={moduleScene} />
    </group>
  );
});
