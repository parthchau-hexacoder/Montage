import { DesignProvider } from "./app/providers/DesignProvider";
import { WorkspaceUiProvider } from "./app/providers/WorkspaceUiProvider";
import { EngineCanvas } from "./ui/workspace/EngineCanvas";
import { WorkspaceTopBar } from "./ui/workspace/layout/WorkspaceTopBar";
import { ModeRail } from "./ui/workspace/layout/ModeRail";
import { InspectorPanel } from "./ui/workspace/layout/InspectorPanel";
import { CanvasOverlay } from "./ui/workspace/layout/CanvasOverlay";
import { WorkspaceSidebar } from "./ui/workspace/layout/WorkspaceSidebar";

export default function App() {
  return (
    <DesignProvider>
      <WorkspaceUiProvider>
        <div className="flex h-screen min-h-screen flex-col bg-[#eef0f4] text-gray-900">
          <WorkspaceTopBar />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <ModeRail />
            <WorkspaceSidebar />
            <main className="relative min-w-0 flex-1">
              <EngineCanvas />
              <CanvasOverlay />
            </main>
            <InspectorPanel />
          </div>
        </div>
      </WorkspaceUiProvider>
    </DesignProvider>
  );
}
