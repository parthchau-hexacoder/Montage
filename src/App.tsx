import { DesignProvider } from "./app/providers/DesignProvider";
import { EngineCanvas } from "./ui/workspace/EngineCanvas";
import { ControlsPanel } from "./ui/workspace/ControlsPanel";
import { useState } from "react";

export default function App() {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  return (
    <DesignProvider>
      <div className="flex h-screen">
        <ControlsPanel />
        <div className="flex-1 relative">
          <div className="absolute top-4 right-4 z-10 flex rounded border border-gray-400 bg-white overflow-hidden">
            <button
              className={`px-4 py-2 text-sm ${viewMode === "2d" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
              onClick={() => setViewMode("2d")}
            >
              2D Top
            </button>
            <button
              className={`px-4 py-2 text-sm ${viewMode === "3d" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
              onClick={() => setViewMode("3d")}
            >
              3D View
            </button>
          </div>

          <EngineCanvas viewMode={viewMode} />
        </div>
      </div>
    </DesignProvider>
  );
}
