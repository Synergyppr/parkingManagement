import React from "react";
import { MdMail } from "react-icons/md";
import { CiClock2 } from "react-icons/ci";
import { formatDate, formatHour } from "@/app/lib/clientUtils";

interface LogEntry {
  createdDateTime: string;
  loggedBy?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Log = ({ logs }: { logs: any[] }) => {
  if (!logs || logs?.length === 0 || !Array.isArray(logs)) return null;

  const sortedLog = [...logs]?.sort((a: LogEntry, b: LogEntry) => {
    const formattedA = new Date(a.createdDateTime);
    const formattedB = new Date(b.createdDateTime);
    return formattedB.getTime() - formattedA.getTime();
  });

  const extractDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toDateString();
  };

  if (!logs?.length)
    return (
      <div className="flex flex-col pt-4 p-1 m-auto justify-center text-center border rounded-md mt-2">
        <CiClock2 className="w-20 h-20 text-gray-200 m-auto relative top-2" />
        <p className="text-lg font-bold relative bottom-10">
          No log available for this ticket
        </p>
      </div>
    );

  return (
    <div>
      <div className="mt-6">
        <div className="pt-2"
          style={{
            boxShadow:
              "0 0.46875rem 2.1875rem rgba(4,9,20,0.03), 0 0.9375rem 1.40625rem rgba(4,9,20,0.03), 0 0.25rem 0.53125rem rgba(4,9,20,0.05), 0 0.125rem 0.1875rem rgba(4,9,20,0.03)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            wordWrap: "break-word",
            backgroundClip: "border-box",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(26,54,126,0.125)",
            borderRadius: ".25rem",
            background:
              "radial-gradient(circle at center, #f8fafc 10%, #f1f5f9 90%)",
          }}
        >
          <div
            className="min-h-[300px] overflow-y-auto ml-1.5 mr-2 overflow-x-hidden"
            style={{ flex: "1 1 auto" }}
          >
            <div className="relative w-[100%] pt-[1.5rem] pb-[1rem] px-0">
              <div className="absolute left-[42px] top-0 bottom-2 w-[2px] rounded-full ml-[-1px]"></div>
              {sortedLog?.reduce((acc, entry, index, array) => {
                const prevEntry = array[index - 1];
                const currentDate = extractDate(entry?.createdDateTime);
                const prevDate = prevEntry
                  ? extractDate(prevEntry?.createdDateTime)
                  : null;

                // Show date if current date is different from previous date
                const showDate = !prevDate || currentDate !== prevDate;

                if (showDate) {
                  acc.push(
                    <div
                      key={`date-${index}`}
                      className="text-center mb-10 text-white tracking-tight font-semibold relative bottom-4"
                    >
                      {/* <div className="border-t-2 border-double border-blue-400 my-2 mx-4" /> */}
                      <div className="bg-blue-500 py-2 px-2 rounded-sm shadow-sm">
                        {formatDate(entry?.createdDateTime).split(" ")[0]}
                      </div>
                      {/* <div className="border-t-2 border-double border-blue-400 my-2 mx-4" /> */}
                    </div>
                  );
                }

                acc.push(
                  <div key={index} className="relative mb-[3rem] mt-6">
                    <span className="text-white absolute left-[0px] top-[-38px] width-[100px] h-[26.5px] bg-orange-600/80 shadow-sm rounded-sm z-1 px-2 text-sm">
                      <span className="relative top-1 font-bold">
                        {formatHour(entry?.createdDateTime)}
                      </span>
                    </span>
                    <span className="text-white absolute left-[30px] top-0 w-[25px] h-[25px] bg-[#003171] shadow-sm rounded-full z-1">
                      <MdMail className="m-auto relative top-1" />
                    </span>
                    <div className="text-left relative ml-[70px] text-sm mb-10">
                      <div className="text-xs bg-blue-300/80 rounded-t-lg shadow-lg">
                        <div className="overflow-hidden p-2 text-gray-800 leading-4 rounded-b-sm">
                          <span className="font-bold text-[#003171] break-words pb-1 tracking-tight">
                            {entry?.loggedBy}
                          </span>{" "}
                          made a change
                        </div>
                      </div>

                      {entry?.description?.startsWith(
                        "Ticket status updated"
                      ) ? (
                        <div className="px-2 py-1 text-gray-800 bg-white">
                          <div className="flex gap-1 pt-1">
                            <div className="font-md tracking-tight">
                              Old Status:{" "}
                            </div>{" "}
                            <div
                              className={`text-sm capitalize font-bold`}
                            >
                              {entry?.oldValue}
                            </div>
                          </div>
                          <div className="flex gap-1 pb-1">
                            <div className="font-md tracking-tight">
                              New Status:{" "}
                            </div>{" "}
                            <div
                              className={`text-sm capitalize font-bold`}
                            >
                              {entry?.newValue}
                            </div>
                          </div>
                        </div>
                      ) : entry?.description?.startsWith("Ticket assign to") ? (
                        <div className="px-2 py-1">
                          <div className="flex gap-1 pt-2 pb-1 w-full flex-nowrap">
                            <div className="font-bold tracking-tight">
                              From:{" "}
                            </div>
                            <div className="break-words w-[80%]">
                              {entry?.oldValue}
                            </div>
                          </div>

                          <div className="flex gap-1 pt-2 pb-1 w-full flex-nowrap">
                            <div className="font-bold tracking-tight">To: </div>
                            <div className="break-words w-[87%]">
                              {entry?.newValue}
                            </div>
                          </div>
                        </div>
                      ) : entry?.description === "New note added" ||
                        entry?.description === "New chat message" ? (
                        <div className="text-md relative top-2 px-2 py-1">
                          {entry?.description === "New note added" ||
                          entry?.description.includes(
                            "Ticket escalated to level"
                          ) ||
                          entry?.description === "New chat message" ? (
                            <p>{entry?.description}</p>
                          ) : entry?.description?.startsWith(
                              "Ticket assign to"
                            ) ? (
                            <p>Ticket assign</p>
                          ) : (
                            <p></p>
                          )}
                          <p></p>
                        </div>
                      ) : (
                        <div className="py-2 px-2 text-gray-800 bg-white">
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
    </div>
  );
};

export default Log;
