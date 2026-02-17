import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";

const FINISH_SWATCHES = [
  "bg-[repeating-linear-gradient(180deg,#4b3a31_0px,#60483b_14px,#332824_14px,#332824_16px)]",
  "bg-[repeating-linear-gradient(180deg,#d7d8da_0px,#c3c5c8_14px,#abafb4_14px,#abafb4_16px)]",
  "bg-[repeating-linear-gradient(180deg,#1f1f20_0px,#2f2f30_14px,#111112_14px,#111112_16px)]",
  "bg-[repeating-linear-gradient(180deg,#ebedef_0px,#d5d7da_14px,#c8ccd0_14px,#c8ccd0_16px)]",
  "bg-[repeating-linear-gradient(180deg,#ad744f_0px,#c48a5f_14px,#8d5d3f_14px,#8d5d3f_16px)]",
];

export const InspectorPanel = observer(() => {
  const { composition } = useDesign();
  const beds = composition.totalBeds;
  const baths = composition.totalBaths;
  const sqft = composition.totalSqft > 0 ? composition.totalSqft : 256;
  const totalCost = composition.totalCost > 0 ? composition.totalCost : 0;

  return (
    <aside className="hidden h-full w-[330px] min-w-[330px] max-w-[330px] shrink-0 flex-col overflow-hidden border-l border-gray-300 bg-[#f8f8fa] xl:flex">
      <div className="border-b border-[#d6dae3] px-5 py-5">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-semibold leading-none text-[#142238]">{beds}</span>
            <span className="text-[14px] text-[#1f2937]">Bed</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-semibold leading-none text-[#142238]">{baths}</span>
            <span className="text-[14px] text-[#1f2937]">Bath</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-semibold leading-none text-[#142238]">{sqft}</span>
            <span className="text-[14px] text-[#1f2937]">sqft</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="h-[300px] w-full overflow-hidden border border-[#cfd5e0] bg-[repeating-linear-gradient(180deg,#4b3a31_0px,#5e473b_64px,#362a24_64px,#362a24_68px)]" />

        <section>
          <h3 className="mt-4 text-[22px] font-semibold leading-none text-[#15253a]">Exterior Finish</h3>
          <div className="mt-4 flex gap-2">
            {FINISH_SWATCHES.map((swatchClass, index) => (
              <button
                key={`${swatchClass}-${index}`}
                className={`h-10 w-10 border ${
                  index === 0 ? "border-[#22304a] ring-1 ring-[#a8b2c6]" : "border-[#c6ccd8]"
                } ${swatchClass}`}
                type="button"
              />
            ))}
          </div>
        </section>

        <p className="mt-5 text-[16px] font-semibold leading-tight text-[#111827]">
          MYNAH: Abodo Vulcan Cladding
        </p>
      </div>

      <div className="mt-auto border-t border-[#d6dae3] bg-[#eceef2]">
        <div className="h-[92px] border-b border-[#d3d8e2] bg-[repeating-linear-gradient(180deg,#dfe1e5_0px,#eceef1_44px,#c8ccd2_44px,#c8ccd2_48px)]" />
        <div className="flex items-end justify-between gap-3 bg-[rgba(239,241,245,0.95)] px-4 py-4">
          <div className="min-w-0">
            <div className="truncate text-[22px] font-semibold leading-none text-[#1f2937]">
              {formatCurrency(totalCost)}
            </div>
            <div className="truncate text-[13px] text-[#6b7280]">Estimated Construction Cost</div>
          </div>
          <button className="shrink-0 rounded bg-[#d4d6db] px-4 py-2 text-[14px] font-semibold text-white">
            Order Now
          </button>
        </div>
      </div>
    </aside>
  );
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
