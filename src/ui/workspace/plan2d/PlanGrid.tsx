type Props = {
  enabled: boolean;
};

export function PlanGrid({ enabled }: Props) {
  if (!enabled) return null;

  return (
    <>
      <color attach="background" args={["#f3f4f6"]} />
      <gridHelper args={[200, 200, "#d7dbe1", "#e5e7eb"]} position={[0, -0.02, 0]} />
    </>
  );
}
