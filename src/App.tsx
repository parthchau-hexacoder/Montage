import { DesignProvider } from "./app/providers/DesignProvider";
import { EngineCanvas } from "./ui/workspace/EngineCanvas";
import { useState } from "react";
import { WorkspaceTopBar } from "./ui/workspace/layout/WorkspaceTopBar";
import { ModeRail } from "./ui/workspace/layout/ModeRail";
import { InspectorPanel } from "./ui/workspace/layout/InspectorPanel";
import { CanvasOverlay } from "./ui/workspace/layout/CanvasOverlay";
import { useMemo } from "react";
import { WorkspaceSidebar } from "./ui/workspace/layout/WorkspaceSidebar";
import type { SidebarTab, SidebarViewMode } from "./ui/workspace/layout/sidebar/types";

type ZoomCommand = {
  id: number;
  direction: "in" | "out";
} | null;

export default function App() {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("design");
  const [designViewMode, setDesignViewMode] = useState<SidebarViewMode>("grid");
  const [modulesViewMode, setModulesViewMode] = useState<SidebarViewMode>("grid");
  const [zoomCommand, setZoomCommand] = useState<ZoomCommand>(null);
  const issueZoom = useMemo(
    () => (direction: "in" | "out") => {
      setZoomCommand({ id: Date.now(), direction });
    },
    []
  );

  return (
    <DesignProvider>
      <div className="flex h-screen flex-col bg-[#f3f4f6] text-gray-900">
        <WorkspaceTopBar />
        <div className="flex min-h-0 flex-1">
          <ModeRail activeTab={activeSidebarTab} onChangeTab={setActiveSidebarTab} />
          <WorkspaceSidebar
            activeTab={activeSidebarTab}
            designViewMode={designViewMode}
            modulesViewMode={modulesViewMode}
            onChangeDesignViewMode={setDesignViewMode}
            onChangeModulesViewMode={setModulesViewMode}
            onOpenModulesTab={() => setActiveSidebarTab("modules")}
          />
          <main className="relative min-w-0 flex-1">
            <EngineCanvas viewMode={viewMode} zoomCommand={zoomCommand} />
            <CanvasOverlay
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              onZoomIn={() => issueZoom("in")}
              onZoomOut={() => issueZoom("out")}
            />
          </main>
          <InspectorPanel />
        </div>
      </div>
    </DesignProvider>
  );
}
