import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";

const FINISH_SWATCHES = ["#f0eee6", "#96653d", "#d6d6d6", "#2b2b2b"];
const ACCENT_SWATCHES = ["#f8f8f6", "#ece9df", "#dbdbd6", "#31342b"];

export const InspectorPanel = observer(() => {
  const { composition } = useDesign();

  return (
    <aside className="w-64 border-l border-gray-200 bg-[#f7f7f8]">
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-baseline gap-2 text-gray-800">
          <span className="text-4xl font-semibold">{composition.totalBeds}</span>
          <span className="text-sm">Bed</span>
          <span className="text-4xl font-semibold">{composition.totalBaths}</span>
          <span className="text-sm">Bath</span>
          <span className="text-4xl font-semibold">{composition.totalSqft}</span>
          <span className="text-sm">sqft</span>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mx-auto mb-5 h-24 w-36 rounded border border-gray-300 bg-white" />

        <section>
          <h3 className="text-3xl font-semibold text-gray-800">Exterior Finish</h3>
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
          <h3 className="text-3xl font-semibold text-gray-800">Exterior Accent</h3>
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
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold text-gray-800">${composition.totalCost}</div>
            <div className="text-[10px] text-gray-500">Estimated Construction Cost</div>
          </div>
          <button className="rounded bg-blue-900 px-4 py-2 text-xs font-semibold text-white">
            Order Now
          </button>
        </div>
      </div>
    </aside>
  );
});
