import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useDesign } from "../../../app/providers/DesignProvider";
import { ModuleInstance } from "../../../core/composition/ModuleInstance";

type DragStart = {
  x: number;
  y: number;
  z: number;
};

type RotationState = {
  baseRotationY: number;
  previousAngle: number;
  accumulatedAngle: number;
};

type Params = {
  module: ModuleInstance;
  interactive: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
};

export function useModuleGestures({
  module,
  interactive,
  onDragStateChange,
}: Params) {
  const { camera, size, viewport } = useThree();
  const {
    trySnap,
    moveModuleGroup,
    canRotateModule,
    selectModule,
    beginInteraction,
    endInteraction,
  } = useDesign();
  const canRotate = canRotateModule(module);
  const [rotationPreviewY, setRotationPreviewY] = useState<number | null>(null);
  const [isRotatingHandle, setIsRotatingHandle] = useState(false);
  const isRotatingHandleRef = useRef(false);

  const dragBind = useDrag(
    ({ movement: [mx, my], first, last, memo }) => {
      if (!interactive || isRotatingHandleRef.current) return memo;

      if (first) {
        onDragStateChange?.(true);
        beginInteraction();
      }
      if (last) {
        onDragStateChange?.(false);
      }

      const start: DragStart = memo ?? {
        x: module.transform.position.x,
        y: module.transform.position.y,
        z: module.transform.position.z,
      };

      const dx = (mx / size.width) * viewport.width;
      const dz = (my / size.height) * viewport.height;

      moveModuleGroup(module, start.x + dx, start.y, start.z + dz);
      trySnap(module);

      if (last) {
        endInteraction();
      }

      return start;
    },
    { enabled: interactive && !isRotatingHandle }
  );

  const rotateBind = useDrag(
    ({ xy: [pointerX, pointerY], first, last, memo }) => {
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

      const state: RotationState = memo ?? {
        baseRotationY: module.transform.rotation.y,
        previousAngle: pointerAngle,
        accumulatedAngle: 0,
      };

      if (first) {
        isRotatingHandleRef.current = true;
        setIsRotatingHandle(true);
        onDragStateChange?.(true);
        beginInteraction();
        selectModule(module.instanceId);
        setRotationPreviewY(module.transform.rotation.y);
        return state;
      }

      let deltaAngle = state.previousAngle - pointerAngle;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      state.accumulatedAngle += deltaAngle;
      state.previousAngle = pointerAngle;
      setRotationPreviewY(state.baseRotationY + state.accumulatedAngle);

      if (last) {
        const quarterTurns = Math.round(state.accumulatedAngle / (Math.PI / 2));
        const committedY = state.baseRotationY + quarterTurns * (Math.PI / 2);
        const currentRotation = module.transform.rotation;

        module.setRotation(currentRotation.x, committedY, currentRotation.z);
        setRotationPreviewY(null);
        setIsRotatingHandle(false);
        isRotatingHandleRef.current = false;
        onDragStateChange?.(false);
        endInteraction();
      }

      return state;
    },
    {
      enabled: interactive && canRotate,
      pointer: { capture: true },
      filterTaps: true,
    }
  );

  useEffect(() => {
    return () => {
      isRotatingHandleRef.current = false;
    };
  }, []);

  return {
    canRotate,
    rotationPreviewY,
    dragBind,
    rotateHandlers: rotateBind(),
    markRotationPointerDown: () => {
      isRotatingHandleRef.current = true;
    },
  };
}
