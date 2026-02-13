const ITEMS = [
  { id: "design", label: "Design", active: true },
  { id: "templates", label: "Templates", active: false },
  { id: "modules", label: "Modules", active: false },
  { id: "saved", label: "Saved", active: false },
];

export function ModeRail() {
  return (
    <aside className="w-14 border-r border-gray-200 bg-gray-50 py-4">
      <div className="flex flex-col items-center gap-4">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className="flex w-12 flex-col items-center gap-1"
            type="button"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
                item.active
                  ? "bg-gray-200 text-gray-900"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {item.label.charAt(0)}
            </div>
            <span className="text-[10px] text-gray-600">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
