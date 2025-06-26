import Modal from "./Modal";
import Tabs from "./elements/Tabs";
import CarVector from "./CarVector";
import Log from "./Log";
import { TicketDetails } from "@/app/types";
import { formatDate, formatPhoneNumber } from "@/app/lib/clientUtils";

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketDetails: TicketDetails | null;
  detailsActiveTab: string;
  setDetailsActiveTab: (tab: string) => void;
  transitionState: string;
  setTransitionState: (state: string) => void;
  // Add CarVector-related props
  noIncident: boolean;
  setNoIncident: React.Dispatch<React.SetStateAction<boolean>>;
  incidentParts: string[];
  setIncidentParts: (val: string[]) => void;
  descriptions: Record<string, string>;
  setDescriptions: (val: Record<string, string>) => void;
  damagedParts: { carView: string; partName: string; description: string }[];
  viewAllDamagedParts: boolean;
  setViewAllDamagedParts: (val: boolean) => void;
  formLicensePlate: string;
  findLinkedGroup: (id: string) => string[];
  frontViewLabelsMap: Record<string, string[]>;
  rearViewLabelsMap: Record<string, string[]>;
  passengerViewLabelsMap: Record<string, string[]>;
  driverViewLabelsMap: Record<string, string[]>;
  setHasUnsavedChanges: (val: boolean) => void;
  saveClickedRef: React.MutableRefObject<boolean>;
}

export default function TicketDetailsModal({
  isOpen,
  onClose,
  ticketDetails,
  detailsActiveTab,
  setDetailsActiveTab,
  transitionState,
  setTransitionState,
  noIncident,
  setNoIncident,
  incidentParts,
  setIncidentParts,
  descriptions,
  setDescriptions,
  damagedParts,
  viewAllDamagedParts,
  setViewAllDamagedParts,
  formLicensePlate,
  findLinkedGroup,
  frontViewLabelsMap,
  rearViewLabelsMap,
  passengerViewLabelsMap,
  driverViewLabelsMap,
  setHasUnsavedChanges,
  saveClickedRef,
}: TicketDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <div className="absolute top-6 left-6 text-lg font-semibold text-gray-800 mb-4 min-w-full z-50">
          <Tabs
            isSmallScreen={false}
            tabs={["Details", "Damages", "Log"]}
            activeTab={detailsActiveTab}
            setActiveTab={setDetailsActiveTab}
            setTransitionState={setTransitionState}
          />
        </div>

        <div
          className={`transition-opacity duration-300 ${
            transitionState === "fade-out" ? "opacity-0" : "opacity-100"
          } border-b-1 border-x-1 border-solid border-gray-300`}
        >
          {detailsActiveTab === "Details" && (
            <div className="space-y-4 text-sm md:text-base pt-10 px-4 pb-4 text-gray-800 bg-gradient-to-b to-amber-100 via-amber-100/50">
              {/* Guest Info */}
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-orange-500 tracking-tight mb-1 italic ml-[-2px]">
                  Guest Information
                </h4>
                {/* <hr className="border-t-[1px] border-slate-600/60 mb-2" /> */}

                {ticketDetails?.patron && (
                  <>
                    {ticketDetails?.patron?.firstName?.length +
                      ticketDetails?.patron?.lastName?.length >
                      0 && (
                      <p>
                        <strong className="tracking-tighter">Name:</strong>{" "}
                        {`${ticketDetails?.patron?.firstName ?? ""} ${
                          ticketDetails?.patron?.lastName ?? ""
                        }`}
                      </p>
                    )}
                    <p>
                      <strong className="tracking-tighter">
                        Phone Number:
                      </strong>{" "}
                      <span>
                        {formatPhoneNumber(
                          ticketDetails?.patron?.phoneNumber as string
                        )}
                      </span>
                    </p>
                  </>
                )}
                {ticketDetails?.destination && (
                  <p>
                    <strong className="tracking-tighter">Destination:</strong>{" "}
                    <span>{ticketDetails?.destination}</span>
                  </p>
                )}
                <p className="mb-0">
                  <strong className="tracking-tighter">Created On:</strong>{" "}
                  {formatDate(ticketDetails?.createdDateTime || "")}
                </p>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-1">
                <h4 className="text-lg font-semibold text-orange-500 tracking-tight mb-1 italic ml-[-2px]">
                  Vehicle Information
                </h4>
                {/* <hr className="border-t-[1px] border-slate-600/60 mb-2" /> */}

                <p>
                  <strong className="tracking-tighter">Brand:</strong>{" "}
                  {ticketDetails?.vehicle?.brand}
                </p>
                <p>
                  <strong className="tracking-tighter">Model:</strong>{" "}
                  {ticketDetails?.vehicle?.model}
                </p>
                <p>
                  <strong className="tracking-tighter">Type:</strong>{" "}
                  {ticketDetails?.vehicle?.type}
                </p>
                <p className="capitalize">
                  <strong className="tracking-tighter">Color:</strong>{" "}
                  {ticketDetails?.vehicle?.color}
                </p>
                {ticketDetails?.vehicle?.licensePlate && (
                  <p>
                    <strong className="tracking-tighter">License Plate:</strong>{" "}
                    {ticketDetails?.vehicle?.licensePlate}
                  </p>
                )}
              </div>
            </div>
          )}

          {detailsActiveTab === "Damages" && (
            <div className="relative bg-gradient-to-b to-amber-50/50 via-white">
              <CarVector
                noIncident={noIncident}
                setNoIncident={
                  setNoIncident as React.Dispatch<React.SetStateAction<boolean>>
                }
                incidentParts={incidentParts}
                setIncidentParts={
                  setIncidentParts as React.Dispatch<
                    React.SetStateAction<string[]>
                  >
                }
                descriptions={descriptions}
                setDescriptions={
                  setDescriptions as React.Dispatch<
                    React.SetStateAction<Record<string, string>>
                  >
                }
                licensePlate={formLicensePlate}
                findLinkedGroup={findLinkedGroup}
                frontViewLabelsMap={frontViewLabelsMap}
                rearViewLabelsMap={rearViewLabelsMap}
                passengerViewLabelsMap={passengerViewLabelsMap}
                driverViewLabelsMap={driverViewLabelsMap}
                hideLabels={true}
                setHasUnsavedChanges={(value) =>
                  setHasUnsavedChanges(value as boolean)
                }
                saveClickedRef={saveClickedRef}
              />

              {damagedParts?.length > 0 && (
                <div className="text-center my-3">
                  <button
                    className="text-blue-500 underline text-sm cursor-pointer"
                    onClick={() => setViewAllDamagedParts(!viewAllDamagedParts)}
                  >
                    {viewAllDamagedParts
                      ? "Hide Description"
                      : "View Full Description"}
                  </button>
                </div>
              )}

              {viewAllDamagedParts && (
                <div className="absolute inset-0 bg-white/90 z-20 p-3 rounded-md shadow-lg mt-[26px] flex flex-col h-[96%]">
                  <h4 className="text-lg font-semibold text-blue-600 mb-1 text-center tracking-tighter">
                    Incident Report
                  </h4>
                  <div className="overflow-y-auto flex-1 pr-2 space-y-2 text-gray-800">
                    {damagedParts?.map((part, index) => (
                      <div
                        key={index}
                        className="border border-gray-300 rounded p-2 bg-white"
                      >
                        <p className="text-sm font-semibold">
                          {/* {part?.carView?.replace(/View$/, "")}{" "} */}
                          <span className="font-normal">
                            {part?.partName?.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </p>
                        <p className="text-sm text-orange-500">
                          {part?.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setViewAllDamagedParts(false)}
                      className="cursor-pointer text-white bg-blue-500 px-4 py-1 rounded hover:bg-blue-600 text-sm transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {detailsActiveTab === "Log" && (
            <Log logs={ticketDetails?.ticketLogs || []} />
          )}
        </div>
      </div>
    </Modal>
  );
}
