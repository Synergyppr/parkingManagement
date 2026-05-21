import React, { JSX } from "react";

import { CiClock2 } from "react-icons/ci";

import { formatDate, formatHour } from "@/app/lib/clientUtils";
import { LogProps } from "../types/pagesProps";

const Log: React.FC<LogProps> = ({ logs }) => {
  if (!Array.isArray(logs) || logs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <CiClock2 className="w-10 h-10 mb-3" />
        <p className="font-medium text-gray-600">No log available for this ticket</p>
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
              className="flex items-center gap-3 mb-4 mt-2"
            >
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {formatDate(entry?.createdDateTime)?.split(" ")[0]}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          );
        }

        acc.push(
          <div
            key={`log-${entry?.createdDateTime}-${index}`}
            className="flex gap-3"
          >
            {/* Timeline dot and connector */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              {index < array.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0">
              {entry.description?.startsWith("Ticket status updated") ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    Status updated
                  </p>
                  <p className="text-xs text-gray-400">
                    <span className="capitalize">{entry?.oldValue}</span>
                    {" → "}
                    <span className="capitalize">{entry?.newValue}</span>
                  </p>
                </>
              ) : entry?.description?.startsWith("Ticket assign to") ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {entry?.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry?.oldValue} → {entry?.newValue}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {entry?.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {entry?.loggedBy ?? "System"} · {formatHour(entry?.createdDateTime)}
              </p>
            </div>
          </div>
        );

        return acc;
      }, [])}
    </div>
  );
};

export default Log;
