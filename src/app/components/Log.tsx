import React, { JSX } from "react";
import { CiClock2 } from "react-icons/ci";
import { formatDate, formatHour } from "@/app/lib/clientUtils";
import { LogProps } from "../types/pagesProps";

const Log: React.FC<LogProps> = ({ logs }) => {
  if (!Array.isArray(logs) || logs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <CiClock2 className="h-8 w-8" />
        </div>

        <p className="font-serif text-xl font-bold text-slate-950">
          No log available
        </p>

        <p className="mt-1 text-sm text-slate-500">
          There is no activity recorded for this ticket yet.
        </p>
      </div>
    );
  }

  const sortedLogs = [...logs]?.sort(
    (a, b) =>
      new Date(b?.createdDateTime)?.getTime() -
      new Date(a?.createdDateTime)?.getTime()
  );

  const extractDate = (dateString: string): string =>
    new Date(dateString)?.toDateString();

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
          Activity Timeline
        </span>
      </div>

      <div className="space-y-0">
        {sortedLogs?.reduce<JSX.Element[]>((acc, entry, index, array) => {
          const prevEntry = array[index - 1];
          const currentDate = extractDate(entry?.createdDateTime);
          const prevDate = prevEntry
            ? extractDate(prevEntry?.createdDateTime)
            : null;

          const showDate = !prevDate || currentDate !== prevDate;

          if (showDate) {
            acc.push(
              <div
                key={`date-${entry?.createdDateTime}`}
                className="my-5 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-200" />

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                  {formatDate(entry?.createdDateTime)?.split(" ")[0]}
                </span>

                <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
              </div>
            );
          }

          acc.push(
            <div
              key={`log-${entry?.createdDateTime}-${index}`}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-[0_6px_16px_rgba(214,168,0,0.28)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                {index < array.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-gradient-to-b from-amber-200 to-slate-200" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  {entry.description?.startsWith("Ticket status updated") ? (
                    <>
                      <p className="text-sm font-extrabold text-slate-950">
                        Status updated
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        <span className="capitalize text-slate-700">
                          {entry?.oldValue}
                        </span>
                        {" → "}
                        <span className="capitalize text-amber-700">
                          {entry?.newValue}
                        </span>
                      </p>
                    </>
                  ) : entry?.description?.startsWith("Ticket assign to") ? (
                    <>
                      <p className="text-sm font-extrabold text-slate-950">
                        {entry?.description}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {entry?.oldValue} →{" "}
                        <span className="text-amber-700">
                          {entry?.newValue}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-extrabold text-slate-950">
                      {entry?.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {entry?.loggedBy ?? "System"} ·{" "}
                    {formatHour(entry?.createdDateTime)}
                  </p>
                </div>
              </div>
            </div>
          );

          return acc;
        }, [])}
      </div>
    </div>
  );
};

export default Log;