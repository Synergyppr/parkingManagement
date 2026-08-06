interface StatusTimelineProps {
  currentStatus: string;
  createdDateTime?: string;
  lastUpdated?: string;
}

const formatStepDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const StatusTimeline = ({
  currentStatus,
  createdDateTime,
  lastUpdated,
}: StatusTimelineProps) => {
  const statuses = ["received", "parked", "requested", "ready"];
  const normalized = currentStatus?.toLowerCase()?.trim() || "";
  // If status is unrecognized or empty, default to "parked" so the patron can request again
  const currentIdx =
    statuses.indexOf(normalized) !== -1
      ? statuses.indexOf(normalized)
      : normalized
      ? 0
      : 1;

  // Determine which step gets which date:
  // - "received" → createdDateTime (when the car arrived)
  // - "parked" → no date
  // - "requested" or "ready" → lastUpdated (when the status changed)
  const getStepDate = (status: string, idx: number): string | null => {
    if (idx > currentIdx) return null; // future steps — no date

    if (status === "received") {
      return formatStepDate(createdDateTime);
    }

    if ((status === "requested" || status === "ready") && idx === currentIdx) {
      return formatStepDate(lastUpdated);
    }

    return null;
  };

  return (
    <div className="mt-5 rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {statuses.map((status, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const stepDate = getStepDate(status, i);

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

                {stepDate && (
                  <></>
                  // <p className="mt-1 text-center text-[9px] font-semibold leading-tight text-slate-400">
                  //   {stepDate}
                  // </p>
                )}
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
