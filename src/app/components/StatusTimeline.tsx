const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const statuses = ["received", "parked", "requested", "ready"];
  const currentIdx = statuses.indexOf(currentStatus?.toLowerCase() || "");

  return (
    <div className="mt-5 rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {statuses.map((status, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;

          return (
            <div key={status} className="">
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                    active
                      ? "bg-primary text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
                      : done
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done && !active ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-black">{i + 1}</span>
                  )}
                </div>

                <p
                  className={`mt-2 text-center text-[11px] font-black uppercase tracking-[0.12em] ${
                    active
                      ? "text-primary"
                      : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {status}
                </p>
              </div>

              {i < statuses.length - 1 && (
                <div
                  className={`mx-2 mt-5 h-1 flex-1 rounded-full ${
                    i < currentIdx ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
