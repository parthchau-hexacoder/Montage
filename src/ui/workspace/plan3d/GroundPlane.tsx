export function GroundPlane() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#f5f6f8" metalness={0} roughness={1} />
      </mesh>

      <gridHelper args={[240, 120, "#cfd4dc", "#e5e7eb"]} position={[0, -0.01, 0]} />
    </group>
  );
}
