import React, { JSX } from "react";

import { MdMail } from "react-icons/md";
import { CiClock2 } from "react-icons/ci";

import { formatDate, formatHour } from "@/app/lib/clientUtils";
import { LogProps } from "../types/pagesProps";

const Log: React.FC<LogProps> = ({ logs }) => {
  if (!Array.isArray(logs) || logs?.length === 0) {
    return (
      <div className="flex flex-col pt-4 p-1 m-auto justify-center text-center border rounded-md mt-2">
        <CiClock2 className="w-20 h-20 text-gray-200 m-auto relative top-2" />
        <p className="text-lg font-bold relative bottom-10">
          No log available for this ticket
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
    <div className="mt-0">
      <div
        className="pt-2"
        style={{
          boxShadow:
            "0 0.46875rem 2.1875rem rgba(4,9,20,0.03), 0 0.9375rem 1.40625rem rgba(4,9,20,0.03), 0 0.25rem 0.53125rem rgba(4,9,20,0.05), 0 0.125rem 0.1875rem rgba(4,9,20,0.03)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          wordWrap: "break-word",
          backgroundClip: "border-box",
          background:
            "radial-gradient(circle at center, #f8fafc 10%, #f1f5f9 90%)",
        }}
      >
        <div
          className="min-h-[300px] overflow-y-auto ml-1.5 mr-2 overflow-x-hidden"
          style={{ flex: "1 1 auto" }}
        >
          <div className="relative w-full pt-6 pb-4">
            <div className="absolute left-[42px] top-0 bottom-2 w-[2px] rounded-full ml-[-1px]" />

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
                    className="text-center mb-10 text-white font-semibold relative bottom-4"
                  >
                    <div className="bg-blue-500 py-2 px-2 rounded-sm shadow-sm">
                      {formatDate(entry?.createdDateTime)?.split(" ")[0]}
                    </div>
                  </div>
                );
              }

              acc.push(
                <div
                  key={`log-${entry?.createdDateTime}-${index}`}
                  className="relative mb-12 mt-6"
                >
                  <span className="absolute left-0 top-[-38px] h-[26.5px] bg-orange-600/80 shadow-sm rounded-sm px-2 text-sm text-white">
                    <span className="relative top-1 font-bold">
                      {formatHour(entry?.createdDateTime)}
                    </span>
                  </span>

                  <span className="absolute left-[30px] top-0 w-[25px] h-[25px] bg-[#003171] shadow-sm rounded-full text-white">
                    <MdMail className="m-auto relative top-1" />
                  </span>

                  <div className="ml-[70px] text-sm">
                    <div className="text-xs bg-blue-300/80 rounded-t-lg shadow-lg">
                      <div className="p-2 text-gray-800 leading-4">
                        <span className="font-bold text-[#003171]">
                          {entry?.loggedBy ?? "System"}
                        </span>{" "}
                        made a change
                      </div>
                    </div>

                    {/* Content */}
                    {entry.description?.startsWith("Ticket status updated") ? (
                      <div className="px-2 py-1 bg-white text-gray-800">
                        <div className="flex gap-1 pt-1">
                          <span>Old Status:</span>
                          <span className="font-bold capitalize text-gray-800">
                            {entry?.oldValue}
                          </span>
                        </div>
                        <div className="flex gap-1 pb-1">
                          <span>New Status:</span>
                          <span className="font-bold capitalize text-gray-800">
                            {entry?.newValue}
                          </span>
                        </div>
                      </div>
                    ) : entry?.description?.startsWith("Ticket assign to") ? (
                      <div className="px-2 py-1">
                        <div className="flex gap-1 pt-2">
                          <span className="font-bold">From:</span>
                          <span className="break-words">{entry?.oldValue}</span>
                        </div>
                        <div className="flex gap-1 pt-2">
                          <span className="font-bold">To:</span>
                          <span className="break-words">{entry?.newValue}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 px-2 bg-white text-gray-800">
                        {entry?.description}
                      </div>
                    )}
                  </div>
                </div>
              );

              return acc;
            }, [])}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Log;
