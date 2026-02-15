import type { SidebarViewMode } from "../types";

type Props = {
  value: SidebarViewMode;
  onChange: (mode: SidebarViewMode) => void;
};

export function SidebarViewToggle({ value, onChange }: Props) {
  const buttonClass = (active: boolean) =>
    `rounded-md border px-2 py-1 text-xs font-semibold ${
      active
        ? "border-gray-900 bg-gray-900 text-white"
        : "border-gray-300 bg-white text-gray-600"
    }`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={buttonClass(value === "grid")}
        onClick={() => onChange("grid")}
        title="Grid View"
      >
        Grid
      </button>
      <button
        type="button"
        className={buttonClass(value === "list")}
        onClick={() => onChange("list")}
        title="List View"
      >
        List
      </button>
    </div>
  );
}
