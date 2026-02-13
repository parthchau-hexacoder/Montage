import { DesignProvider } from "./app/providers/DesignProvider";
import { EngineCanvas } from "./ui/workspace/EngineCanvas";
import { ControlsPanel } from "./ui/workspace/ControlsPanel";

export default function App() {
  return (
    <DesignProvider>
      <div className="flex h-screen">
        <ControlsPanel />
        <div className="flex-1">
          <EngineCanvas />
        </div>
      </div>
    </DesignProvider>
  );
}
