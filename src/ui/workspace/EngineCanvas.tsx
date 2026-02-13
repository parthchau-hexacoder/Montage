import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { useDesign } from "../../app/providers/DesignProvider";
import { Suspense, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { ModuleMesh } from "./ModuleMesh.tsx";

export const EngineCanvas = observer(() => {
  const { composition } = useDesign();
  const [isDraggingModule, setIsDraggingModule] = useState(false);

  return (
    <Canvas camera={{ position: [5, 5, 7], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} castShadow />

      <Suspense fallback={null}>
        {Array.from(composition.modules.values()).map((module) => (
          <ModuleMesh
            key={module.instanceId}
            module={module}
            onDragStateChange={setIsDraggingModule}
          />
        ))}
      </Suspense>

      <OrbitControls enabled={!isDraggingModule} />
    </Canvas>
  );
});
