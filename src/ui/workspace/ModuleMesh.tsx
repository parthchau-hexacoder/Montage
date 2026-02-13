import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { ModuleInstance } from "../../core/composition/ModuleInstance";
import { useDesign } from "../../app/providers/DesignProvider";

type Props = {
  module: ModuleInstance;
  onDragStateChange?: (isDragging: boolean) => void;
};

export const ModuleMesh = observer(({ module, onDragStateChange }: Props) => {
  const { scene } = useGLTF(module.definition.glbPath);
  const { trySnap } = useDesign();
  const { size, viewport } = useThree();

  const bind = useDrag(({ offset: [x, y], first, last }) => {
    if (first) onDragStateChange?.(true);
    if (last) onDragStateChange?.(false);

    const worldX = (x / size.width) * viewport.width;
    const worldZ = (y / size.height) * viewport.height;

    module.setPosition(worldX, 0, worldZ);
    trySnap(module);
  });

  return (
    <primitive
      object={scene}
      {...bind()}
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
    />
  );
});
