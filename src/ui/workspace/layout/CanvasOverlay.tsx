import { observer } from "mobx-react-lite";
import { useDesign } from "../../../app/providers/DesignProvider";
import { CanvasLoader } from "./CanvasLoader";

type Props = {
  viewMode: "2d" | "3d";
  onChangeViewMode: (mode: "2d" | "3d") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export const CanvasOverlay = observer(
  ({ viewMode, onChangeViewMode, onZoomIn, onZoomOut }: Props) => {
    const { undo, redo, canUndo, canRedo, isCanvasLoading, isModulesLoading } = useDesign();

    return (
      <div className="pointer-events-none absolute inset-0 z-10">
        {isModulesLoading && <CanvasLoader fullscreen />}
        {!isModulesLoading && isCanvasLoading && <CanvasLoader />}

        <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 overflow-hidden rounded-md border border-[#d4d8e2] bg-white lg:flex">
          <button
            className={`pointer-events-auto px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "2d" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => onChangeViewMode("2d")}
          >
            2D Top
          </button>
          <button
            className={`pointer-events-auto border-l border-[#d4d8e2] px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "3d" ? "bg-gray-900 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => onChangeViewMode("3d")}
          >
            3D View
          </button>
        </div>

        <div className="absolute right-6 top-6 flex items-center gap-1 rounded-lg border border-[#d5d9e3] bg-[#f4f5f8] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onChangeViewMode(viewMode === "2d" ? "3d" : "2d")}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-[#d8dbe3] bg-white text-[#4b5563] transition hover:bg-[#eef2f6]"
            title={`Switch to ${viewMode === "2d" ? "3D" : "2D"} view`}
          >
            {viewMode === "2d" ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 4h6v6H3zM11 10h6v6h-6z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="m10 3.5 5.5 3.2v6.5L10 16.5 4.5 13.2V6.7z" />
                <path d="m10 3.5 5.5 3.2L10 10 4.5 6.7z" />
                <path d="M10 10v6.5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-[#d8dbe3] bg-[#edf0f5] text-[#9ca3af]"
            disabled
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 4v12M10 4v12M16 4v12" />
            </svg>
          </button>
          <button
            type="button"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-[#d8dbe3] bg-[#edf0f5] text-[#9ca3af]"
            disabled
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="5" y="8" width="10" height="8" rx="1.5" />
              <path d="M7.2 8V6a2.8 2.8 0 0 1 5.6 0v2" />
            </svg>
          </button>
          <button
            type="button"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-[#d8dbe3] bg-white text-[#4b5563] transition hover:bg-[#eef2f6]"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="m10 3.5 5.5 3.2v6.5L10 16.5 4.5 13.2V6.7z" />
            </svg>
          </button>
          <button
            type="button"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-[#d8dbe3] bg-white text-[#4b5563] transition hover:bg-[#eef2f6]"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3.5" y="4" width="13" height="12" rx="1.2" />
              <path d="m7.2 11.2 1.8-1.8 2 2 2.4-2.4 3 3" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-[#d7dbe4] bg-[#f2f4f8] px-3 py-2 shadow-sm">
          <button
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-transparent text-[#1f2937] transition hover:border-[#d4d8e2] hover:bg-white disabled:cursor-not-allowed disabled:text-[#c1c6d0]"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m8 6-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.2 10h6.4a4.4 4.4 0 0 1 4.4 4.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-transparent text-[#1f2937] transition hover:border-[#d4d8e2] hover:bg-white disabled:cursor-not-allowed disabled:text-[#c1c6d0]"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m12 6 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.8 10H9.4A4.4 4.4 0 0 0 5 14.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-transparent text-[#1f2937] transition hover:border-[#d4d8e2] hover:bg-white"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="9" r="4.8" />
              <path d="M9 6.8v4.4M6.8 9h4.4M13 13l3 3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded border border-transparent text-[#1f2937] transition hover:border-[#d4d8e2] hover:bg-white"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="9" r="4.8" />
              <path d="M6.8 9h4.4M13 13l3 3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);
