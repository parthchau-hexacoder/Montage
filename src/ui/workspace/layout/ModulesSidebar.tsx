import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useDesign } from "../../../app/providers/DesignProvider";
import type { SidebarViewMode } from "./sidebar/types";

type Props = {
  viewMode: SidebarViewMode;
  onChangeViewMode: (mode: SidebarViewMode) => void;
};

const CATEGORY_CHIPS = ["Annex", "Dwelling", "Lifestyle"] as const;
type CategoryChip = (typeof CATEGORY_CHIPS)[number];

export const ModulesSidebar = observer(({ viewMode, onChangeViewMode }: Props) => {
  const {
    addModule,
    availableModuleDefinitions,
    isModulesLoading,
    modulesLoadError,
    loadModulesFromBackend,
  } = useDesign();
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryChip>("Annex");

  const filteredModules = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return availableModuleDefinitions.filter((definition) => {
      const textMatch =
        query.length === 0
          ? true
          : definition.name.toLowerCase().includes(query) ||
            definition.id.toLowerCase().includes(query);

      if (!textMatch) {
        return false;
      }

      const category = resolveCategory(definition.name, definition.id);
      if (!category) {
        return true;
      }

      return category === activeCategory;
    });
  }, [activeCategory, availableModuleDefinitions, searchValue]);

  return (
    <aside className="hidden h-full w-[330px] min-w-[330px] max-w-[330px] shrink-0 flex-col overflow-hidden border-r border-gray-300 bg-[#f5f6fa] px-4 py-4 lg:flex">
      <div className="shrink-0">
        <h2 className="text-[20px] font-semibold leading-none text-[#17253b]">Modules</h2>
        <div className="mt-2 h-px bg-[#d8dbe4]" />
      </div>

      <div className="mt-4 shrink-0 space-y-3">
        <div className="flex h-12 items-center rounded-md border border-[#d8dbe4] bg-white px-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13 13 3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search Modules"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
          />
          <button
            type="button"
            onClick={() => onChangeViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#4b5563] transition hover:bg-[#f3f4f6]"
            aria-label="Toggle modules layout"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round" />
              <circle cx="7" cy="6" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="13" cy="10" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="14" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>

        <div className="h-px bg-[#d8dbe4]" />

        <div className="flex flex-wrap gap-2">
          {CATEGORY_CHIPS.map((category) => {
            const isActive = category === activeCategory;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-md border px-3 py-1.5 text-[14px] font-medium leading-none transition ${
                  isActive
                    ? "border-[#1f2937] bg-white text-[#0f172a]"
                    : "border-[#a9b0c0] bg-white text-[#4b5563] hover:border-[#6b7280]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[#d8dbe4]" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3 pt-4 pr-1">
        {isModulesLoading && availableModuleDefinitions.length === 0 && (
          <div className="rounded-lg border border-[#d8dbe4] bg-white px-4 py-4 text-sm text-[#4b5563]">
            Loading modules...
          </div>
        )}

        {!isModulesLoading && modulesLoadError && availableModuleDefinitions.length === 0 && (
          <div className="space-y-3 rounded-lg border border-red-200 bg-white px-4 py-4">
            <p className="text-sm text-red-700">{modulesLoadError}</p>
            <button
              type="button"
              className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-700"
              onClick={() => loadModulesFromBackend(true)}
            >
              Retry
            </button>
          </div>
        )}

        {!isModulesLoading &&
          !modulesLoadError &&
          availableModuleDefinitions.length === 0 && (
            <div className="rounded-lg border border-[#d8dbe4] bg-white px-4 py-4 text-sm text-[#4b5563]">
              No modules found.
            </div>
          )}

        {viewMode === "grid" ? (
          <div className="space-y-3">
            {filteredModules.map((definition) => (
              <button
                key={definition.id}
                type="button"
                onClick={() => addModule(definition.id)}
                className="w-full rounded-xl border border-[#d6d8e2] bg-[#fbfbfd] p-3 text-left transition hover:border-[#b8bfce]"
              >
                {definition.previewImage ? (
                  <img
                    src={definition.previewImage}
                    alt={definition.name}
                    className="h-[220px] w-full rounded-md border border-[#d4d8e2] bg-white object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative h-[220px] w-full overflow-hidden rounded-md border border-[#d4d8e2] bg-[#f7f8fb]">
                    <svg viewBox="0 0 320 240" className="h-full w-full text-[#2f3a4a]">
                      <rect x="56" y="26" width="206" height="184" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <line x1="56" y1="94" x2="262" y2="94" stroke="currentColor" strokeWidth="2" />
                      <line x1="146" y1="94" x2="146" y2="210" stroke="currentColor" strokeWidth="2" />
                      <line x1="56" y1="146" x2="146" y2="146" stroke="currentColor" strokeWidth="2" />
                      <line x1="198" y1="94" x2="198" y2="210" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                )}
                <div className="px-2 pb-1 pt-3">
                  <div className="truncate text-[16px] font-semibold text-[#111827]">{definition.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[14px] text-[#111827]">
                    <span className="font-semibold">{formatCurrency(definition.pricePerSqft)}</span>
                    <span>{definition.metrics.baths} Bathroom</span>
                    <span>{definition.metrics.beds} Bedroom</span>
                    <span>{definition.metrics.sqft} sqft</span>
                  </div>
                </div>
              </button>
            ))}

            {filteredModules.length === 0 && !isModulesLoading && (
              <div className="rounded-lg border border-[#d8dbe4] bg-white px-4 py-4 text-sm text-[#4b5563]">
                No modules for this filter.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredModules.map((definition) => (
              <button
                key={definition.id}
                type="button"
                onClick={() => addModule(definition.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-[#d6d8e2] bg-white px-3 py-2 text-left transition hover:border-[#b8bfce]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#111827] text-xs font-bold text-white">
                  {definition.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#111827]">
                    {definition.name}
                  </div>
                  <div className="truncate text-[12px] text-[#6b7280]">{formatCurrency(definition.baseCost)}</div>
                </div>
              </button>
            ))}

            {filteredModules.length === 0 && !isModulesLoading && (
              <div className="rounded-lg border border-[#d8dbe4] bg-white px-4 py-4 text-sm text-[#4b5563]">
                No modules for this filter.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
});

function resolveCategory(name: string, id: string): CategoryChip | null {
  const normalized = `${name} ${id}`.toLowerCase();

  if (normalized.includes("annex")) {
    return "Annex";
  }

  if (normalized.includes("dwelling")) {
    return "Dwelling";
  }

  if (normalized.includes("lifestyle")) {
    return "Lifestyle";
  }

  return null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
