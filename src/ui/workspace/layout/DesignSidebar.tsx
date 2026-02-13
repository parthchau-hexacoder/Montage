import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";

export const DesignSidebar = observer(() => {
  const { addModule, composition, disjointSelectedModule } = useDesign();
  const modules = Array.from(composition.modules.values());

  return (
    <aside className="w-64 border-r border-gray-200 bg-[#f5f5f8] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-gray-800">Design</h2>
      </div>

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

      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-3">
        <div className="text-xs font-semibold text-gray-700">Add module</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            className="rounded border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700"
            onClick={() => addModule("dwelling")}
          >
            Dwelling
          </button>
          <button
            className="rounded border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700"
            onClick={() => addModule("annex")}
          >
            Annex
          </button>
          <button
            className="rounded border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700"
            onClick={() => addModule("lifestyle")}
          >
            Lifestyle
          </button>
        </div>
      </div>

      <button
        className="mt-3 w-full rounded bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        onClick={disjointSelectedModule}
        disabled={!composition.selectedModuleId}
      >
        Disjoint Selected
      </button>
    </aside>
  );
});
