import { observer } from "mobx-react-lite";
import { useDesign } from "../../app/providers/DesignProvider";

export const ControlsPanel = observer(() => {
  const { addModule, composition } = useDesign();

  return (
    <div className="p-4 bg-gray-900 text-white w-64 space-y-4">
      <button
        className="w-full bg-blue-600 p-2 rounded"
        onClick={() => addModule("dwelling")}
      >
        Add Dwelling
      </button>

      <button
        className="w-full bg-green-600 p-2 rounded"
        onClick={() => addModule("annex")}
      >
        Add Annex
      </button>

      <button
        className="w-full bg-red-600 p-2 rounded"
        onClick={() => addModule("lifestyle")}
      >
        Add Lifestyle
      </button>

      <div className="pt-4">
        <div>Beds: {composition.totalBeds}</div>
        <div>Baths: {composition.totalBaths}</div>
        <div>Sqft: {composition.totalSqft}</div>
        <div>Cost: ${composition.totalCost}</div>
      </div>
    </div>
  );
});
