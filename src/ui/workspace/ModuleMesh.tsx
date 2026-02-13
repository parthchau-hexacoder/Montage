import { observer } from "mobx-react-lite";
import { useGLTF } from "@react-three/drei";
import { ModuleInstance } from "../../core/composition/ModuleInstance";

type Props = {
  module: ModuleInstance;
};

export const ModuleMesh = observer(({ module }: Props) => {
  const { scene } = useGLTF(module.definition.glbPath);

  return (
    <primitive
      object={scene}
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
