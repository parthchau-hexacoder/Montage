import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";
import { SidebarViewToggle } from "./sidebar/components/SidebarViewToggle";
import { ModulePreview3D } from "./sidebar/components/ModulePreview3D";
import type { SidebarViewMode } from "./sidebar/types";

type Props = {
  viewMode: SidebarViewMode;
  onChangeViewMode: (mode: SidebarViewMode) => void;
  onOpenModulesTab: () => void;
};

export const DesignSidebar = observer(({
  viewMode,
  onChangeViewMode,
  onOpenModulesTab,
}: Props) => {
  const { composition, disjointSelectedModule } = useDesign();
  const modules = Array.from(composition.modules.values());

  return (
    <aside className="hidden h-full w-64 min-w-64 max-w-64 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-[#f5f5f8] p-4 lg:flex">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-3xl font-semibold text-gray-800">Design</h2>
        <SidebarViewToggle value={viewMode} onChange={onChangeViewMode} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {viewMode === "grid" ? (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <div
                key={module.instanceId}
                className="rounded-lg border border-gray-200 bg-white p-2"
              >
                <ModulePreview3D glbPath={module.definition.glbPath} />
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="min-w-0 text-xs text-gray-700">
                    <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-700">
                      {module.definition.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{module.definition.name}-{index + 1}</span>
                  </div>
                  <div className="text-xs text-gray-500">{index + 1}</div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onOpenModulesTab}
              className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-3xl text-gray-400"
              title="Open Modules"
            >
              +
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.instanceId}
                className="rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-xs font-bold text-white">
                    {module.definition.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">
                      {module.definition.name}-{index + 1}
                    </div>
                    <div className="truncate text-xs text-gray-500">{module.instanceId}</div>
                  </div>
                  <div className="text-xs text-gray-500">{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="mt-4 w-full shrink-0 rounded bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        onClick={disjointSelectedModule}
        disabled={!composition.selectedModuleId}
      >
        Disjoint Selected
      </button>
    </aside>
  );
});
