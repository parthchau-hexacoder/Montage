import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";
import { SidebarViewToggle } from "./sidebar/components/SidebarViewToggle";
import type { SidebarViewMode } from "./sidebar/types";

type Props = {
  viewMode: SidebarViewMode;
  onChangeViewMode: (mode: SidebarViewMode) => void;
};

export const ModulesSidebar = observer(({ viewMode, onChangeViewMode }: Props) => {
  const {
    addModule,
    availableModuleDefinitions,
    isModulesLoading,
    modulesLoadError,
    loadModulesFromBackend,
  } = useDesign();

  return (
    <aside className="flex h-full w-64 min-w-64 max-w-64 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-[#f5f5f8] p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-3xl font-semibold text-gray-800">Modules</h2>
        <SidebarViewToggle value={viewMode} onChange={onChangeViewMode} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isModulesLoading && availableModuleDefinitions.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm text-gray-600">
            Loading modules...
          </div>
        )}

        {!isModulesLoading && modulesLoadError && availableModuleDefinitions.length === 0 && (
          <div className="space-y-3 rounded-lg border border-red-200 bg-white px-3 py-4">
            <p className="text-sm text-red-700">{modulesLoadError}</p>
            <button
              type="button"
              className="rounded border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-700"
              onClick={() => loadModulesFromBackend(true)}
            >
              Retry
            </button>
          </div>
        )}

        {!isModulesLoading &&
          !modulesLoadError &&
          availableModuleDefinitions.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm text-gray-600">
              No modules found.
            </div>
          )}

        {viewMode === "grid" ? (
          <div className="space-y-3">
            {availableModuleDefinitions.map((definition, index) => (
              <div
                key={definition.id}
                className="rounded-lg border border-gray-200 bg-white p-2"
              >
                {definition.previewImage ? (
                  <img
                    src={definition.previewImage}
                    alt={definition.name}
                    className="h-28 w-full rounded-md border border-gray-200 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-xs font-medium text-gray-500">
                    No preview image
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="min-w-0 text-xs font-semibold text-gray-700">
                    {definition.name}
                  </div>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700"
                    onClick={() => addModule(definition.id)}
                  >
                    Add
                  </button>
                </div>
                <div className="px-1 text-[11px] text-gray-500">Type {index + 1}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {availableModuleDefinitions.map((definition) => (
              <div
                key={definition.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-xs font-bold text-white">
                  {definition.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-800">
                    {definition.name}
                  </div>
                  <div className="truncate text-xs text-gray-500">{definition.id}</div>
                </div>
                <button
                  type="button"
                  className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700"
                  onClick={() => addModule(definition.id)}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
});
