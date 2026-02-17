type Props = {
  fullscreen?: boolean;
};

export function CanvasLoader({ fullscreen = false }: Props) {
  const containerClass = fullscreen
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-white"
    : "absolute inset-0 z-30 flex items-center justify-center bg-white";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[#1f2937]">
        <img src="/loader.gif" alt="Loading" className="h-16 w-16" />
      </div>
    </div>
  );
}
