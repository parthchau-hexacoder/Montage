export function WorkspaceTopBar() {
  return (
    <header className="h-[58px] border-b border-gray-200 bg-[#f3f4f7] px-4 md:px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <img
            src="/icon.png"
            alt="Montage logo"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-white/70"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0 truncate text-sm text-[#1f2937]">
            <span className="font-semibold">hexaa</span>
            <span className="mx-3 text-gray-400">|</span>
            <span className="font-semibold">Untitled-1</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="hidden items-center gap-2 rounded-md border border-[#202733] bg-white px-4 py-2 text-xs font-semibold text-[#162338] md:flex">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M10 12V4" strokeLinecap="round" />
              <path d="m6.5 7.5 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 11.5v3a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 16 14.5v-3" strokeLinecap="round" />
            </svg>
            Share
          </button>
          <button className="hidden rounded-md border border-[#202733] bg-white px-4 py-2 text-xs font-semibold text-[#162338] sm:block">
            View Plans
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-white/70"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 3.5a4 4 0 0 0-4 4v2.6l-1.1 2.2a.8.8 0 0 0 .72 1.17h8.76a.8.8 0 0 0 .72-1.17L14 10.1V7.5a4 4 0 0 0-4-4Z" />
              <path d="M8.2 14.5a1.9 1.9 0 0 0 3.6 0" strokeLinecap="round" />
            </svg>
            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#de3c3c] text-[10px] font-semibold text-white">
              0
            </span>
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
            TU
          </div>
        </div>
      </div>
    </header>
  );
}
