export function WorkspaceTopBar() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-4">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-700">
            M
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="text-sm text-gray-800">
            <span className="font-semibold">My Portfolio</span>
            <span className="mx-2 text-gray-400">|</span>
            <span>Untitled-1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-800">
            Share
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-800">
            View Plans
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
            TM
          </div>
        </div>
      </div>
    </header>
  );
}
