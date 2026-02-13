type Props = {
  viewMode: "2d" | "3d";
  onChangeViewMode: (mode: "2d" | "3d") => void;
};

export function CanvasOverlay({ viewMode, onChangeViewMode }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
        <button className="pointer-events-auto rounded px-2 py-1 text-xs text-gray-600">Fit</button>
        <button className="pointer-events-auto rounded px-2 py-1 text-xs text-gray-600">Lock</button>
        <button className="pointer-events-auto rounded px-2 py-1 text-xs text-gray-600">Snap</button>
      </div>

      <div className="absolute left-1/2 top-6 -translate-x-1/2 overflow-hidden rounded-md border border-gray-300 bg-white">
        <button
          className={`pointer-events-auto px-3 py-1.5 text-xs font-semibold ${
            viewMode === "2d" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => onChangeViewMode("2d")}
        >
          2D Top
        </button>
        <button
          className={`pointer-events-auto border-l border-gray-300 px-3 py-1.5 text-xs font-semibold ${
            viewMode === "3d" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => onChangeViewMode("3d")}
        >
          3D View
        </button>
      </div>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
        <button className="pointer-events-auto rounded px-2 text-sm text-gray-700">↶</button>
        <button className="pointer-events-auto rounded px-2 text-sm text-gray-700">↷</button>
        <button className="pointer-events-auto rounded px-2 text-sm text-gray-700">⊕</button>
        <button className="pointer-events-auto rounded px-2 text-sm text-gray-700">⊖</button>
      </div>
    </div>
  );
}
