import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";

const FINISH_SWATCHES = ["#f0eee6", "#96653d", "#d6d6d6", "#2b2b2b"];
const ACCENT_SWATCHES = ["#f8f8f6", "#ece9df", "#dbdbd6", "#31342b"];

export const InspectorPanel = observer(() => {
  const { composition } = useDesign();

  return (
    <aside className="flex h-full w-64 min-w-64 max-w-64 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-[#f7f7f8]">
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="grid grid-cols-3 gap-2 text-gray-800">
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold">{composition.totalBeds}</div>
            <div className="text-sm">Bed</div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold">{composition.totalBaths}</div>
            <div className="text-sm">Bath</div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold">{composition.totalSqft}</div>
            <div className="text-sm">sqft</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mx-auto mb-5 h-24 w-36 rounded border border-gray-300 bg-white" />

        <section>
          <h3 className="text-xl font-semibold text-gray-800">Exterior Finish</h3>
          <div className="mt-3 flex gap-2">
            {FINISH_SWATCHES.map((color, index) => (
              <button
                key={`${color}-${index}`}
                className={`h-9 w-9 rounded border ${
                  index === 0 ? "border-blue-500 ring-1 ring-blue-300" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800">Exterior Accent</h3>
          <div className="mt-3 flex gap-2">
            {ACCENT_SWATCHES.map((color, index) => (
              <button
                key={`${color}-${index}`}
                className={`h-9 w-9 rounded border ${
                  index === 0 ? "border-blue-500 ring-1 ring-blue-300" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto border-t border-gray-200 px-4 py-4">
        <div className="mb-3 h-3 rounded bg-gradient-to-r from-gray-400 to-gray-500" />
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold text-gray-800">${composition.totalCost}</div>
            <div className="truncate text-[10px] text-gray-500">Estimated Construction Cost</div>
          </div>
          <button className="shrink-0 rounded bg-blue-900 px-4 py-2 text-xs font-semibold text-white">
            Order Now
          </button>
        </div>
      </div>
    </aside>
  );
});
