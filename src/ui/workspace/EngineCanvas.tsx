import { Canvas } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { useDesign } from "../../app/providers/DesignProvider";
import { Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { ModuleMesh } from "./ModuleMesh.tsx";
import { PlanGrid } from "./plan2d/PlanGrid";
import { GroundPlane } from "./plan3d/GroundPlane";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

type Props = {
  viewMode: "2d" | "3d";
  zoomCommand: {
    id: number;
    direction: "in" | "out";
  } | null;
};

export const EngineCanvas = observer(({ viewMode, zoomCommand }: Props) => {
  const { composition, selectModule } = useDesign();
  const [isDraggingModule, setIsDraggingModule] = useState(false);
  const is2D = viewMode === "2d";
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const cameraProps = is2D
    ? { position: [0, 120, 0] as [number, number, number], zoom: 45, near: 0.1, far: 1000 }
    : { position: [7, 6, 8] as [number, number, number], fov: 50 };

  useEffect(() => {
    if (!zoomCommand || !cameraRef.current) return;

    const camera = cameraRef.current;

    if (is2D && camera instanceof THREE.OrthographicCamera) {
      const factor = zoomCommand.direction === "in" ? 1.18 : 1 / 1.18;
      const nextZoom = THREE.MathUtils.clamp(camera.zoom * factor, 10, 220);
      camera.zoom = nextZoom;
      camera.updateProjectionMatrix();
      controlsRef.current?.update();
      return;
    }

    if (!is2D && controlsRef.current && camera instanceof THREE.PerspectiveCamera) {
      const controls = controlsRef.current;
      const offset = camera.position.clone().sub(controls.target);
      const factor = zoomCommand.direction === "in" ? 0.88 : 1 / 0.88;
      offset.multiplyScalar(factor);
      camera.position.copy(controls.target.clone().add(offset));
      controls.update();
    }
  }, [zoomCommand, is2D]);

  return (
    <Canvas
      key={viewMode}
      orthographic={is2D}
      camera={cameraProps}
      dpr={[1, 1.5]}
      gl={{ powerPreference: "high-performance", antialias: true }}
      onCreated={({ camera }) => {
        cameraRef.current = camera;

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
          <directionalLight position={[5, 10, 5]} />
          <GroundPlane />
        </>
      )}

      <Suspense fallback={<CanvasModelLoadingFallback />}>
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
        ref={controlsRef}
        enabled={is2D ? !isDraggingModule : true}
        enableRotate={!is2D}
        enablePan
        screenSpacePanning={is2D}
        minPolarAngle={!is2D ? 0 : undefined}
        maxPolarAngle={!is2D ? Math.PI / 2 : undefined}
      />
    </Canvas>
  );
});

const CanvasModelLoadingFallback = observer(() => {
  const { beginCanvasLoad, endCanvasLoad } = useDesign();

  useEffect(() => {
    beginCanvasLoad();
    return () => {
      endCanvasLoad();
    };
  }, [beginCanvasLoad, endCanvasLoad]);

  return null;
});
