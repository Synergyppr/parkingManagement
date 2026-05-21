const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
  const statuses = ["received", "parked", "requested", "ready"];
  const currentIdx = statuses.indexOf(currentStatus?.toLowerCase() || "");

  return (
    <div className="flex items-center mt-4 mb-4">
      {statuses?.map((status, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;

        return (
          <div key={status} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                active ? "bg-orange-500 text-white shadow-lg shadow-orange-200" :
                done ? "bg-emerald-500 text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {done && !active ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <p className={`text-xs mt-1 font-medium text-center leading-tight capitalize ${
                active ? "text-orange-500" : done ? "text-emerald-600" : "text-gray-400"
              }`}>{status}</p>
            </div>
            {i < statuses.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < currentIdx ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
