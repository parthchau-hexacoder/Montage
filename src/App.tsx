import { DesignProvider } from "./app/providers/DesignProvider";
import { EngineCanvas } from "./ui/workspace/EngineCanvas";
import { useState } from "react";
import { WorkspaceTopBar } from "./ui/workspace/layout/WorkspaceTopBar";
import { ModeRail } from "./ui/workspace/layout/ModeRail";
import { DesignSidebar } from "./ui/workspace/layout/DesignSidebar";
import { InspectorPanel } from "./ui/workspace/layout/InspectorPanel";
import { CanvasOverlay } from "./ui/workspace/layout/CanvasOverlay";

export default function App() {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  return (
    <DesignProvider>
      <div className="flex h-screen flex-col bg-[#f3f4f6] text-gray-900">
        <WorkspaceTopBar />
        <div className="flex min-h-0 flex-1">
          <ModeRail />
          <DesignSidebar />
          <main className="relative min-w-0 flex-1">
            <EngineCanvas viewMode={viewMode} />
            <CanvasOverlay viewMode={viewMode} onChangeViewMode={setViewMode} />
          </main>
          <InspectorPanel />
        </div>
      </div>
    </DesignProvider>
  );
}
