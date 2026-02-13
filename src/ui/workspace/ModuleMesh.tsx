import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { useDesign } from "../../app/providers/DesignProvider";

type Props = {
  module: ModuleInstance;
  onDragStateChange?: (isDragging: boolean) => void;
};

export const ModuleMesh = observer(({ module, onDragStateChange }: Props) => {
  const { scene } = useGLTF(module.definition.glbPath);
  const { trySnap, moveModuleGroup, selectModule, composition } = useDesign();
  const { size, viewport } = useThree();

  useEffect(() => {
    module.registerNodesFromScene(scene);
  }, [module, scene]);

  const bind = useDrag(({ offset: [x, y], first, last }) => {
    if (first) onDragStateChange?.(true);
    if (last) onDragStateChange?.(false);

    const worldX = (x / size.width) * viewport.width;
    const worldZ = (y / size.height) * viewport.height;

    moveModuleGroup(module, worldX, 0, worldZ);
    trySnap(module);
  });

  return (
    <group
      {...bind()}
      onPointerDown={(event) => {
        event.stopPropagation();
        selectModule(module.instanceId);
      }}
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
      <primitive object={scene} />

      {composition.selectedModuleId === module.instanceId && (
        <mesh>
          <boxGeometry args={[0.4, 0.08, 0.4]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.55} />
        </mesh>
      )}

      {module.nodes
        .filter((node) => !node.occupied)
        .map((node) => (
          <mesh
            key={`${module.instanceId}_${node.definition.id}`}
            position={[
              node.definition.position.x,
              node.definition.position.y,
              node.definition.position.z,
            ]}
          >
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color="skyblue"
              emissive="skyblue"
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}
    </group>
  );
});
