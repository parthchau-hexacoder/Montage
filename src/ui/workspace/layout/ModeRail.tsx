import type { SidebarTab } from "./sidebar/types";

const ITEMS: Array<{
  id: SidebarTab | "templates" | "saved";
  label: string;
}> = [
  { id: "design", label: "Design" },
  { id: "templates", label: "Templates" },
  { id: "modules", label: "Modules" },
  { id: "saved", label: "Saved" },
];

type Props = {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
};

export function ModeRail({ activeTab, onChangeTab }: Props) {
  return (
    <aside className="w-14 border-r border-gray-200 bg-gray-50 py-4">
      <div className="flex flex-col items-center gap-4">
        {ITEMS.map((item) => {
          const isInteractive = item.id === "design" || item.id === "modules";
          const isActive = item.id === activeTab;

          return (
          <button
            key={item.id}
            className="flex w-12 flex-col items-center gap-1"
            type="button"
            onClick={
              isInteractive
                ? () => onChangeTab(item.id as SidebarTab)
                : undefined
            }
            disabled={!isInteractive}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
                isActive
                  ? "bg-gray-200 text-gray-900"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {item.label.charAt(0)}
            </div>
            <span
              className={`text-[10px] ${
                isInteractive ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {item.label}
            </span>
          </button>
          );
        })}
      </div>
    </aside>
  );
}
