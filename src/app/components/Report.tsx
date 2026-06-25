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
  const { propertyId, propertyName } = useProperty();

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
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar);
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar);

  const getReportData = async () => {
    const sendForm = {
      propertyId,
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
    setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
  };

  useEffect(() => {
    if (propertyId) {
      const timer = setTimeout(() => {
        getReportData();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageNumber, propertyId]);

  const handleSearchChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearch(e.target.value);
    setPageNumber(1);
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
  };

  const openDetails = (id: string) => {
    handleFetchTicketDetails({
      id,
      setTicketDetails,
      setIncidentParts,
      setDescriptions,
      setDamagedParts,
      setShowTicketDetailsModal,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f5ed] px-4 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(214,168,0,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-6xl space-y-7">
        {/* Hero */}
        <section className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                Valet Operations
              </span>

              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Ticket Report
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Review completed and active valet tickets, search guest records,
                and open full vehicle details from one premium operations view.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Current Property
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-950">
                {propertyName || "Active Property"}
              </p>
            </div>
          </div>
        </section>

        {/* Search + Stats */}
        <section className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ticket #, name, destination..."
              value={search}
              onChange={handleSearchChange}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none 
              transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 my-auto"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm md:min-w-[220px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Results
              </p>
              <p className="text-2xl font-black text-slate-950">
                {report.length}
              </p>
            </div>

            {/* <div className="h-11 w-11 rounded-2xl bg-amber-50 ring-1 ring-amber-200" /> */}
          </div>
        </section>

        {/* Desktop Table */}
        <section className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:block">
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/80 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            <span>Ticket #</span>
            <span>Patron</span>
            <span>Place</span>
            <span>Employee</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          {report.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-2xl font-bold text-slate-950">
                No records found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different ticket number, guest name, or destination.
              </p>
            </div>
          ) : (
            report.map((entry, i) => (
              <button
                key={entry?.id}
                type="button"
                onClick={() => openDetails(entry?.id)}
                className={`grid w-full grid-cols-6 items-center px-5 py-4 text-left text-sm transition hover:bg-amber-50/50 ${
                  i < report.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <span className="font-mono font-black tracking-wide text-amber-600">
                  #{entry?.ticketNumber}
                </span>

                <span className="truncate font-bold capitalize text-slate-950">
                  {entry?.patronName || "—"}
                </span>

                <span className="truncate font-medium text-slate-500">
                  {entry?.placeToVisit || "—"}
                </span>

                <span className="truncate font-medium text-slate-500">
                  {entry?.employeeName || "—"}
                </span>

                <span className="text-xs font-bold uppercase text-slate-400">
                  {entry?.date || "—"}
                </span>

                <span className="text-right text-sm font-black text-amber-600 cursor-pointer">
                  View
                </span>
              </button>
            ))
          )}
        </section>

        {/* Mobile Cards */}
        <section className="space-y-3 md:hidden">
          {report.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-serif text-2xl font-bold text-slate-950">
                No records found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another search term.
              </p>
            </div>
          ) : (
            report.map((entry) => (
              <button
                key={entry?.id}
                type="button"
                onClick={() => openDetails(entry?.id)}
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-black tracking-wide text-amber-600">
                      #{entry?.ticketNumber}
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold capitalize text-slate-950">
                      {entry?.patronName || "Unknown Patron"}
                    </h3>
                  </div>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                    View
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Place
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {entry?.placeToVisit || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Employee
                      </p>
                      <p className="mt-1 truncate font-semibold text-slate-700">
                        {entry?.employeeName || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Date
                      </p>
                      <p className="mt-1 truncate font-semibold text-slate-700">
                        {entry?.date || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </section>

        {/* Pagination */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold">
            Showing <span className="text-slate-950">{report.length}</span>{" "}
            tickets
          </span>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber === 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
            >
              &lsaquo;
            </button>

            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Page {pageNumber} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={pageNumber === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
            >
              &rsaquo;
            </button>
          </div>
        </section>
      </div>

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