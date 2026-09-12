export default function PanelLoading() {
  return (
    <>
      {/* Topbar skeleton */}
      <header className="h-14 border-b border-edge/50 glass-strong flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-edge/40 rounded animate-pulse" />
          <div className="h-4 w-4 bg-edge/30 rounded animate-pulse" />
          <div className="h-4 w-24 bg-edge/40 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-16 bg-edge/30 rounded-lg animate-pulse" />
          <div className="h-7 w-7 bg-edge/30 rounded-full animate-pulse" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <div className="h-3 w-20 bg-edge/40 rounded animate-pulse" />
              <div className="h-7 w-14 bg-edge/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="glass rounded-xl">
          <div className="px-5 py-4 border-b border-edge/50">
            <div className="h-4 w-32 bg-edge/40 rounded animate-pulse" />
          </div>
          <div className="p-5 space-y-4">
            <div className="h-3 w-full bg-edge/30 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-edge/30 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-edge/30 rounded animate-pulse" />
            <div className="h-10 w-full bg-edge/20 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-edge/20 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-edge/20 rounded-xl animate-pulse" />
          </div>
        </div>
      </main>
    </>
  );
}
