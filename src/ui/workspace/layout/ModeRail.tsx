import type { JSX } from "react";
import type { SidebarTab } from "./sidebar/types";

const ITEMS: Array<{
  id: SidebarTab | "templates" | "saved";
  label: string;
  icon: (className: string) => JSX.Element;
}> = [
  {
    id: "design",
    label: "Design",
    icon: (className) => (
      <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3.5" y="3.5" width="13" height="13" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "templates",
    label: "Templates",
    icon: (className) => (
      <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="10.5" y="3.5" width="6" height="6" rx="1" />
        <rect x="3.5" y="10.5" width="6" height="6" rx="1" />
        <rect x="10.5" y="10.5" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    id: "modules",
    label: "Modules",
    icon: (className) => (
      <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3.5 6.5h6v6h-6zM10.5 7.5h6v6h-6z" />
      </svg>
    ),
  },
  {
    id: "saved",
    label: "Bookmarks",
    icon: (className) => (
      <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 3.5h8a1 1 0 0 1 1 1V16l-5-3-5 3V4.5a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  },
];

type Props = {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
};

export function ModeRail({ activeTab, onChangeTab }: Props) {
  return (
    <aside className="hidden w-[72px] border-r border-gray-200 bg-[#f6f7fb] py-5 lg:block">
      <div className="flex flex-col items-center gap-3">
        {ITEMS.map((item) => {
          const isInteractive = item.id === "design" || item.id === "modules";
          const isActive = item.id === activeTab;

          return (
            <button
              key={item.id}
              className={`flex w-[56px] flex-col items-center gap-1 rounded-md py-2 transition-colors ${
                isActive ? "bg-[#e6e8ee]" : "hover:bg-[#eceff5]"
              }`}
              type="button"
              onClick={
                isInteractive
                  ? () => onChangeTab(item.id as SidebarTab)
                  : undefined
              }
              disabled={!isInteractive}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  isActive ? "text-[#111827]" : "text-[#4b5563]"
                }`}
              >
                {item.icon("h-5 w-5")}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isActive
                    ? "text-[#111827]"
                    : isInteractive
                      ? "text-[#4b5563]"
                      : "text-[#9ca3af]"
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
