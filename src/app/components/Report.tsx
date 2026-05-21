"use client";
import React, { useState, useEffect } from "react";

import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { useProperty } from "../context/PropertyContext";
import { CarPart, ReportEntry, TicketDetails } from "../types";
import { handleFetchTicketDetails } from "../helpers/dashboardHelpers";

import TicketDetailsModal from "./TicketDetailsModal";

const PAGE_SIZE = 10;

const Report = () => {
  const saveClickedRef = React.useRef(false);
  const { propertyId } = useProperty();
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails
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

  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<CarPart[]>([]);

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

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Ticket Report</h1>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ticket #, name, destination..."
            value={search}
            onChange={handleSearchChange}
            className="w-full h-11 pl-4 pr-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-gray-900"
          />
        </div>

        {/* Table for desktop */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="hidden sm:grid grid-cols-6 px-4 py-3 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Ticket #</span><span>Patron</span><span>Place</span><span>Employee</span><span>Date</span><span>Actions</span>
          </div>

          {report.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No records found.</p>
            </div>
          ) : (
            report.map((entry, i) => (
              <div
                key={entry?.id}
                className={`flex flex-col sm:grid sm:grid-cols-6 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors text-sm ${
                  i < report.length - 1 ? "border-b border-gray-100" : ""
                }`}
                onClick={() =>
                  handleFetchTicketDetails({
                    id: entry?.id,
                    setTicketDetails,
                    setIncidentParts,
                    setDescriptions,
                    setDamagedParts,
                    setShowTicketDetailsModal,
                  })
                }
              >
                <span className="font-mono font-semibold text-blue-600">#{entry?.ticketNumber}</span>
                <span className="text-gray-900 capitalize">{entry?.patronName}</span>
                <span className="text-gray-500 truncate">{entry?.placeToVisit}</span>
                <span className="text-gray-500">{entry?.employeeName}</span>
                <span className="text-gray-400 text-xs uppercase">{entry?.date}</span>
                <span className="text-blue-600 text-xs sm:text-sm">View</span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{report.length} tickets</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600"
            >
              &lsaquo;
            </button>
            <span className="text-xs">Page {pageNumber} of {totalPages}</span>
            <button
              onClick={handleNextPage}
              disabled={pageNumber === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors text-gray-600"
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </div>
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showTicketDetailsModal}
        setIsOpen={setShowTicketDetailsModal}
        ticketDetails={ticketDetails}
        setTicketDetails={setTicketDetails}
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
