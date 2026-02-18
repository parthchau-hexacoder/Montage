import { useDrag } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const isDragTemporarilyDisabledRef = useRef(false);
  const wasConnectedAtDragStartRef = useRef(false);
  const detachedDuringDragRef = useRef(false);
  const pendingDragTargetRef = useRef<DragStart | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingRotationPreviewRef = useRef<number | null>(null);
  const rotationRafRef = useRef<number | null>(null);

  const excludedSnapTargetsRef = useRef<Set<string>>(new Set());

  const flushDrag = useCallback(
    (commit: boolean) => {
      const pending = pendingDragTargetRef.current;
      if (!pending) return;

      const moveResult = moveModuleGroup(module, pending.x, pending.y, pending.z);

      if (moveResult.disconnectedIds !== null) {
        detachedDuringDragRef.current = true;
      }

      if (moveResult.disconnectedIds) {
        moveResult.disconnectedIds.forEach(id => excludedSnapTargetsRef.current.add(id));
      }

      if (
        !commit &&
        wasConnectedAtDragStartRef.current &&
        detachedDuringDragRef.current
      ) {
        return;
      }

      if (!moveResult.moved && !commit) {
        return;
      }

      const snapResult = trySnap(module, {
        commit,
        excludeModuleIds: excludedSnapTargetsRef.current
      });

      if (
        !commit &&
        snapResult.magnetActive &&
        !wasConnectedAtDragStartRef.current &&
        !isDragTemporarilyDisabledRef.current
      ) {
        isDragTemporarilyDisabledRef.current = true;
        selectModule(null);
      }

      if (commit) {
        pendingDragTargetRef.current = null;
        isDragTemporarilyDisabledRef.current = false;
        wasConnectedAtDragStartRef.current = false;
        detachedDuringDragRef.current = false;
        excludedSnapTargetsRef.current.clear();
      }
    },
    [module, moveModuleGroup, selectModule, trySnap]
  );

  const scheduleDragFlush = useCallback(() => {
    if (dragRafRef.current !== null) return;

    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      flushDrag(false);
    });
  }, [flushDrag]);

  const scheduleRotationPreviewFlush = useCallback(() => {
    if (rotationRafRef.current !== null) return;

    rotationRafRef.current = requestAnimationFrame(() => {
      rotationRafRef.current = null;
      setRotationPreviewY(pendingRotationPreviewRef.current);
    });
  }, []);

  const dragBind = useDrag(
    ({ movement: [mx, my], first, last, memo }) => {
      if (!interactive || isRotatingHandleRef.current) return memo;

      if (first) {
        isDragTemporarilyDisabledRef.current = false;
        wasConnectedAtDragStartRef.current = !canRotateModule(module);
        detachedDuringDragRef.current = false;
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

      if (isDragTemporarilyDisabledRef.current) {
        if (last) {
          if (dragRafRef.current !== null) {
            cancelAnimationFrame(dragRafRef.current);
            dragRafRef.current = null;
          }
          flushDrag(true);
          endInteraction();
        }
        return start;
      }

      const dx = (mx / size.width) * viewport.width;
      const dz = (my / size.height) * viewport.height;

      pendingDragTargetRef.current = {
        x: start.x + dx,
        y: start.y,
        z: start.z + dz,
      };

      if (last) {
        if (dragRafRef.current !== null) {
          cancelAnimationFrame(dragRafRef.current);
          dragRafRef.current = null;
        }
        flushDrag(true);
      } else {
        scheduleDragFlush();
      }

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
        pendingRotationPreviewRef.current = module.transform.rotation.y;
        setRotationPreviewY(module.transform.rotation.y);
        return state;
      }

      let deltaAngle = state.previousAngle - pointerAngle;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      state.accumulatedAngle += deltaAngle;
      state.previousAngle = pointerAngle;
      pendingRotationPreviewRef.current = state.baseRotationY + state.accumulatedAngle;
      scheduleRotationPreviewFlush();

      if (last) {
        const quarterTurns = Math.round(state.accumulatedAngle / (Math.PI / 2));
        const committedY = state.baseRotationY + quarterTurns * (Math.PI / 2);
        const currentRotation = module.transform.rotation;

        module.setRotation(currentRotation.x, committedY, currentRotation.z);
        if (rotationRafRef.current !== null) {
          cancelAnimationFrame(rotationRafRef.current);
          rotationRafRef.current = null;
        }
        pendingRotationPreviewRef.current = null;
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
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (rotationRafRef.current !== null) {
        cancelAnimationFrame(rotationRafRef.current);
        rotationRafRef.current = null;
      }
      pendingDragTargetRef.current = null;
      pendingRotationPreviewRef.current = null;
      isDragTemporarilyDisabledRef.current = false;
      wasConnectedAtDragStartRef.current = false;
      detachedDuringDragRef.current = false;
      excludedSnapTargetsRef.current.clear();
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
