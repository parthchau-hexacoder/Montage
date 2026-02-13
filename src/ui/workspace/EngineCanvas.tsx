import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { useDesign } from "../../app/providers/DesignProvider";
import { Suspense, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { ModuleMesh } from "./ModuleMesh.tsx";
import { PlanGrid } from "./plan2d/PlanGrid";
import { GroundPlane } from "./plan3d/GroundPlane";

type Props = {
  viewMode: "2d" | "3d";
};

export const EngineCanvas = observer(({ viewMode }: Props) => {
  const { composition, selectModule } = useDesign();
  const [isDraggingModule, setIsDraggingModule] = useState(false);
  const is2D = viewMode === "2d";

  const cameraProps = is2D
    ? { position: [0, 120, 0] as [number, number, number], zoom: 45, near: 0.1, far: 1000 }
    : { position: [7, 6, 8] as [number, number, number], fov: 50 };

  return (
    <Canvas
      key={viewMode}
      orthographic={is2D}
      camera={cameraProps}
      onCreated={({ camera }) => {
        if (!is2D) return;

        camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      }}
      onPointerMissed={() => {
        if (is2D) {
          selectModule(null);
        }
      }}
    >
      <PlanGrid enabled={is2D} />
      <ambientLight intensity={is2D ? 1 : 0.8} />
      {!is2D && (
        <>
          <directionalLight position={[5, 10, 5]} castShadow />
          <GroundPlane />
        </>
      )}

      <Suspense fallback={null}>
        {Array.from(composition.modules.values()).map((module) => (
          <ModuleMesh
            key={module.instanceId}
            module={module}
            interactive={is2D}
            onDragStateChange={setIsDraggingModule}
          />
        ))}
      </Suspense>

      <OrbitControls
        enabled={is2D ? !isDraggingModule : true}
        enableRotate={!is2D}
        enablePan
        screenSpacePanning={is2D}
        minPolarAngle={!is2D ? 0 : undefined}
        maxPolarAngle={!is2D ? Math.PI / 2  : undefined}
      />
    </Canvas>
  );
});
