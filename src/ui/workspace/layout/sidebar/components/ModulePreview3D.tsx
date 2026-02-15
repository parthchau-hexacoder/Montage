import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  glbPath: string;
};

export function ModulePreview3D({ glbPath }: Props) {
  const { scene } = useGLTF(glbPath);

  const previewScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());

    clone.position.sub(center);

    clone.traverse((object) => {
      if (isNodeMarkerName(object.name)) {
        object.visible = false;
      }
    });

    return clone;
  }, [scene]);

  return (
    <div className="h-28 w-full overflow-hidden rounded-md border border-gray-200 bg-white">
      <Canvas camera={{ position: [2, 1.6, 2], fov: 38 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 3]} intensity={0.85} />
        <directionalLight position={[-2, 3, -1]} intensity={0.4} />
        <PreviewScene object={previewScene} />
      </Canvas>
    </div>
  );
}

function PreviewScene({ object }: { object: THREE.Object3D }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  useEffect(() => {
    if (!groupRef.current) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const dimensions = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
    const fov = THREE.MathUtils.degToRad(camera.fov);

    const fitHeightDistance = maxDim / (2 * Math.tan(fov / 2));
    const fitWidthDistance = fitHeightDistance / Math.max(camera.aspect, 0.5);
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.55;

    const direction = new THREE.Vector3(1, 0.78, 1).normalize();
    const position = center.clone().add(direction.multiplyScalar(distance));

    camera.position.copy(position);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = Math.max(distance * 30, 50);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [camera, object, size.width, size.height]);

  return (
    <group ref={groupRef}>
      <primitive object={object} />
    </group>
  );
}

function isNodeMarkerName(name: string) {
  if (!name) return false;

  if (name.startsWith("NODE_")) {
    return true;
  }

  return /^Node(\d+)$/i.test(name);
}
