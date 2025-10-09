"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { useProperty } from "../context/PropertyContext";
import TicketDetailsModal from "./TicketDetailsModal";

interface TicketDetails {
  id: string;
  ticketId: string;
  ticketNumber: string;
  patronName: string;
  placeToVisit: string;
  employeeName: string;
  date: string;
  damagedParts?: { partName: string; description: string; carView: string }[];
  licensePlate?: string;
  createdDateTime: string;
}

const PAGE_SIZE = 10;

const Report = () => {
  const saveClickedRef = React.useRef(false);
  const { propertyId } = useProperty();
  const [report, setReport] = useState<
    {
      id: string;
      ticketNumber: string;
      patronName: string;
      placeToVisit: string;
      employeeName: string;
      date: string;
    }[]
  >([]);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(
    null
  );
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailsActiveTab, setDetailsActiveTab] = useState("Details");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [noIncident, setNoIncident] = useState(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] = useState(false);
  const [, setHasUnsavedChanges] = useState(false);

  const [incidentParts, setIncidentParts] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<
    { partName: string; description: string; carView: string }[]
  >([]);

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar); // Right-Side View
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar); // Left-Side View

  const getReportData = async () => {
    const sendForm = {
      propertyId: propertyId,
      pageNumber,
      pageSize: PAGE_SIZE,
      filters: {
        search: search?.trim() as string,
      },
    };

    const res = await fetch("/api/report/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendForm),
    });

    const data = await res.json();

    const result = data?.result?.data || [];
    const total = data?.result?.total || result?.length;

    setReport(result);
    setTotalPages(Math.ceil(total / PAGE_SIZE));
  };

  useEffect(() => {
    if (propertyId)
      setTimeout(() => {
        getReportData();
      }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageNumber, propertyId]);

  const handleSearchChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearch(e.target.value);
    setPageNumber(1); // Reset to page 1 on new search
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
  };

  const handleFetchTicketDetails = async (id: string) => {
    if (!id) return;

    try {
      const res = await fetch("/api/getTicketDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data?.status === "200") {
        setTicketDetails(data?.data);
        const damaged = data?.data?.damagedParts || [];

        const viewMap: Record<string, Record<string, string>> = {
          FrontView: carParts.frontViewCar,
          RearView: carParts.rearViewCar,
          PassengerView: carParts.passengerViewCar,
          DriverView: carParts.driverViewCar,
        };

        const newIncidentParts: string[] = [];
        const newDescriptions: Record<string, string> = {};

        damaged.forEach(
          (item: {
            partName: string;
            description: string;
            carView: string;
          }) => {
            const { partName, description, carView } = item;

            // Convert "RightHeadlight" → "Right Headlight"
            const formattedLabel = partName.replace(/([A-Z])/g, " $1").trim();
            const viewParts = viewMap[carView];

            if (!viewParts) {
              // console.warn(`Unknown carView: ${carView}`);
              return;
            }

            // Filter the label map for the current view only
            const viewLabelToIdsMap = generateLabelsMap(viewParts);
            const matchedPartIds = viewLabelToIdsMap[formattedLabel];

            if (matchedPartIds?.length) {
              matchedPartIds.forEach((id) => {
                const group = findLinkedGroup(id);
                newIncidentParts.push(...group);
              });

              if (description) {
                newDescriptions[formattedLabel] = description;
              }

              setShowTicketDetailsModal(true);
            } else {
              console.warn(
                `No matching label found for: ${formattedLabel} in ${carView}`
              );
            }
          }
        );

        const uniqueParts = Array.from(new Set(newIncidentParts));
        setIncidentParts(uniqueParts);
        setDescriptions(newDescriptions);
        setDamagedParts(damaged);
        setShowTicketDetailsModal(true);
      } else {
        Swal.fire({
          title: "Error",
          text: data?.result?.message || "Failed to fetch ticket details",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Failed to fetch ticket details", error);
      Swal.fire({
        title: "Error",
        text: (error as string) || "Failed to fetch ticket details",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleCloseTicketDetails = () => {
    setShowTicketDetailsModal(false);
    setTicketDetails(null);
    setIncidentParts([]);
    setDescriptions({});
    setDamagedParts([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Report
        </h1>

        {/* Search Bar */}
        <div className="mb-4 flex justify-center md:justify-center lg:justify-end text-gray-800">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 w-64"
          />
        </div>

        {/* Table for desktop */}
        <div className="hidden sm:block overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Patron
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Place
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  View Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {report.map((entry) => (
                <tr key={entry?.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry?.ticketNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry?.patronName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry?.placeToVisit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry?.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="uppercase">{entry?.date}</span>
                  </td>
                  <td
                    onClick={() =>
                      handleFetchTicketDetails(entry?.id as string)
                    }
                    className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    View Details
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-sm text-gray-500 py-6"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-4">
          {report?.length > 0 ? (
            report?.map((entry) => (
              <div
                key={entry?.id}
                className="bg-white p-4 rounded shadow-md space-y-2 text-sm text-gray-800"
              >
                <div>
                  <span className="font-semibold text-gray-700">Ticket #:</span>{" "}
                  {entry?.ticketNumber}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Patron:</span>{" "}
                  {entry?.patronName}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Place:</span>{" "}
                  {entry?.placeToVisit}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Employee:</span>{" "}
                  {entry?.employeeName}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  <span className="uppercase">{entry?.date}</span>
                </div>
                <div
                  onClick={() => handleFetchTicketDetails(entry?.id as string)}
                  className="whitespace-nowrap text-xs font-light text-blue-600 hover:underline cursor-pointer"
                >
                  View Details
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500">
              No records found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-gray-700 text-sm">
            Page {pageNumber} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={pageNumber === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showTicketDetailsModal}
        onClose={handleCloseTicketDetails}
        ticketDetails={ticketDetails as TicketDetails}
        detailsActiveTab={detailsActiveTab}
        setDetailsActiveTab={setDetailsActiveTab}
        transitionState={transitionState}
        setTransitionState={setTransitionState}
        noIncident={noIncident}
        setNoIncident={setNoIncident}
        incidentParts={incidentParts}
        setIncidentParts={setIncidentParts}
        descriptions={descriptions}
        setDescriptions={setDescriptions}
        damagedParts={damagedParts}
        viewAllDamagedParts={viewAllDamagedParts}
        setViewAllDamagedParts={setViewAllDamagedParts}
        formLicensePlate={ticketDetails?.licensePlate || ""}
        findLinkedGroup={findLinkedGroup}
        frontViewLabelsMap={frontViewLabelsMap}
        rearViewLabelsMap={rearViewLabelsMap}
        passengerViewLabelsMap={passengerViewLabelsMap}
        driverViewLabelsMap={driverViewLabelsMap}
        setHasUnsavedChanges={setHasUnsavedChanges}
        saveClickedRef={saveClickedRef}
      />
    </div>
  );
};

export default Report;
