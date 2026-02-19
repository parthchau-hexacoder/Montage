import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { useDesign } from "../../app/providers/DesignProvider";
import { useModuleScenes } from "./moduleMesh/useModuleScenes";
import { useSelectionOverlay } from "./moduleMesh/useSelectionOverlay";
import { useModuleGestures } from "./moduleMesh/useModuleGestures";

type Props = {
  module: ModuleInstance;
  interactive: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
};

export const ModuleMesh = observer(({ module, interactive, onDragStateChange }: Props) => {
  const { scene } = useGLTF(module.definition.glbPath);
  const { composition, selectModule } = useDesign();
  const isSelected = composition.selectedModuleId === module.instanceId;
  const isConnected =
    composition.graph.getConnectionsForModule(module.instanceId).length > 0;
  const { moduleScene, ghostScene } = useModuleScenes({
    scene,
    module,
    interactive,
    isConnected,
  });
  const selectionOverlay = useSelectionOverlay(module, moduleScene);
  const { canRotate, rotationPreviewY, dragBind, rotateHandlers, markRotationPointerDown } =
    useModuleGestures({
      module,
      interactive,
      onDragStateChange,
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
        {...dragBind()}
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
        {isSelected && selectionOverlay && interactive && (
          <group>
            <lineSegments geometry={selectionOverlay.geometry} renderOrder={20}>
              <lineBasicMaterial color="#ffd400" depthTest={false} />
            </lineSegments>
            {selectionOverlay.corners.map((corner, index) => (
              <mesh
                key={`${module.instanceId}-corner-${index}`}
                {...rotateHandlers}
                position={corner}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={21}
                onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                  event.stopPropagation();
                  markRotationPointerDown();
                  const gestureEvent =
                    event as unknown as Parameters<
                      NonNullable<typeof rotateHandlers.onPointerDown>
                    >[0];
                  rotateHandlers.onPointerDown?.(gestureEvent);
                }}
              >
                <circleGeometry args={[0.1, 24]} />
                <meshBasicMaterial
                  color={canRotate ? "#ffffff" : "#f5c542"}
                  depthTest={false}
                  transparent
                  opacity={canRotate ? 1 : 0.9}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </group>
  );
});
