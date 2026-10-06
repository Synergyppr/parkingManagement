"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { useProperty } from "../context/PropertyContext";
import {
  CarPart,
  TicketDetails,
  TipsReportResponse,
  TipsReportEmployee,
  TipsReportKPIs,
} from "../types";
import { handleFetchTicketDetails } from "../helpers/dashboardHelpers";
import {
  getPuertoRicoToday,
  getDateOffset,
} from "../helpers/reportExportHelpers";

import TicketDetailsModal from "./TicketDetailsModal";

const DEFAULT_KPIS: TipsReportKPIs = {
  totalTips: 0,
  employeesWithTips: 0,
  transactionsWithTips: 0,
  topEmployee: null,
};

const formatTipDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const TipsReport = () => {
  const router = useRouter();
  const saveClickedRef = React.useRef(false);
  const { propertyId, propertyName } = useProperty();

  // Date range
  const [startDate, setStartDate] = useState(() => {
    const today = getPuertoRicoToday();
    return getDateOffset(today, -7);
  });
  const [endDate, setEndDate] = useState(getPuertoRicoToday);

  // Report data
  const [kpis, setKpis] = useState<TipsReportKPIs>(DEFAULT_KPIS);
  const [activeEmployees, setActiveEmployees] = useState<TipsReportEmployee[]>(
    [],
  );
  const [inactiveEmployees, setInactiveEmployees] = useState<
    TipsReportEmployee[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  // Expanded employees
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null,
  );

  // Ticket Details Modal state
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails,
  );
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
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

  const getTipsReport = async () => {
    if (!propertyId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/report/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, startDate, endDate }),
      });

      const data = await res.json();
      const result: TipsReportResponse | undefined = data?.result?.data;

      if (result) {
        setKpis(result.kpis || DEFAULT_KPIS);
        setActiveEmployees(result.activeEmployees || []);
        setInactiveEmployees(result.inactiveEmployees || []);
      } else {
        setKpis(DEFAULT_KPIS);
        setActiveEmployees([]);
        setInactiveEmployees([]);
      }
    } catch {
      setKpis(DEFAULT_KPIS);
      setActiveEmployees([]);
      setInactiveEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      const timer = setTimeout(() => {
        getTipsReport();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, startDate, endDate]);

  const openDetails = (ticketId: string) => {
    handleFetchTicketDetails({
      id: ticketId,
      setTicketDetails,
      setIncidentParts,
      setDescriptions,
      setDamagedParts,
      setShowTicketDetailsModal,
    });
  };

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployeeId((prev) => (prev === employeeId ? null : employeeId));
  };

  const currentEmployees =
    activeTab === "active" ? activeEmployees : inactiveEmployees;

  const avgTipPerTransaction =
    kpis.transactionsWithTips > 0
      ? kpis.totalTips / kpis.transactionsWithTips
      : 0;

  return (
    <div className="min-h-screen bg-(--primary-soft) px-4 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-6xl space-y-7">
        {/* Hero */}
        <section className="overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/report")}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-(--primary-light) hover:text-primary"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Back to Report
              </button>

              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Tips Report
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Analyze tip distributions across employees, track performance,
                and review individual transactions within the selected date
                range.
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

        {/* Date Range */}
        <section className="flex flex-col gap-4 sm:flex-row">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border-none bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border-none bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600/70">
              Total Tips
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-700 lg:text-3xl">
              ${kpis.totalTips.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-(--primary-light) bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Employees w/ Tips
            </p>
            <p className="mt-2 text-2xl font-black text-primary lg:text-3xl">
              {kpis.employeesWithTips}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600/70">
              Transactions
            </p>
            <p className="mt-2 text-2xl font-black text-blue-700 lg:text-3xl">
              {kpis.transactionsWithTips}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600/70">
              Avg Tip / Txn
            </p>
            <p className="mt-2 text-2xl font-black text-violet-700 lg:text-3xl">
              ${avgTipPerTransaction.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Top Employee Highlight */}
        {kpis.topEmployee && (
          <section className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600/70">
                    Top Performer
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-950">
                    {kpis.topEmployee.employeeName}
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Total Tips
                  </p>
                  <p className="mt-1 text-xl font-black text-emerald-700">
                    ${kpis.topEmployee.totalTips.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Tickets
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {kpis.topEmployee.ticketCount}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <section className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              activeTab === "active"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active ({activeEmployees.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inactive")}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              activeTab === "inactive"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Inactive ({inactiveEmployees.length})
          </button>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <p className="mt-4 text-sm font-bold text-slate-400">
              Loading tips data...
            </p>
          </div>
        )}

        {/* Employee Cards */}
        {!loading && (
          <section className="space-y-4">
            {currentEmployees.length === 0 ? (
              <div className="rounded-4xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="font-serif text-2xl font-bold text-slate-950">
                  No {activeTab} employees with tips
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different date range.
                </p>
              </div>
            ) : (
              currentEmployees.map((employee) => {
                const isExpanded = expandedEmployeeId === employee.employeeId;
                const avgTip =
                  employee.ticketCount > 0
                    ? employee.totalTips / employee.ticketCount
                    : 0;

                return (
                  <div
                    key={employee.employeeId}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition"
                  >
                    {/* Employee Header */}
                    <button
                      type="button"
                      onClick={() => toggleEmployee(employee.employeeId)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--primary-soft) text-sm font-black text-primary ring-1 ring-(--primary-light)">
                          {employee.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-950">
                            {employee.employeeName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {employee.ticketCount} ticket
                            {employee.ticketCount !== 1 ? "s" : ""} &middot; Avg
                            ${avgTip.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Total
                          </p>
                          <p className="text-lg font-black text-emerald-700">
                            ${employee.totalTips.toFixed(2)}
                          </p>
                        </div>
                        <svg
                          className={`h-5 w-5 text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Ticket List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            <span>Ticket #</span>
                            <span>Date</span>
                            <span>Tip</span>
                            <span className="text-right">Actions</span>
                          </div>

                          {employee.tickets.map((ticket, i) => (
                            <div
                              key={ticket.ticketId}
                              className={`grid grid-cols-4 items-center px-5 py-3.5 text-sm ${
                                i < employee.tickets.length - 1
                                  ? "border-b border-slate-50"
                                  : ""
                              }`}
                            >
                              <span className="font-mono font-black tracking-wide text-primary">
                                #{ticket.ticketNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                {formatTipDate(ticket.date)}
                              </span>
                              <span className="font-bold text-emerald-700">
                                ${ticket.tip.toFixed(2)}
                              </span>
                              <span className="text-right">
                                <button
                                  type="button"
                                  onClick={() => openDetails(ticket.ticketId)}
                                  className="rounded-lg bg-(--primary-soft) px-3 py-1.5 text-xs font-black text-primary ring-1 ring-(--primary-light) transition hover:bg-(--primary-light)"
                                >
                                  View More
                                </button>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Mobile Cards */}
                        <div className="space-y-2 p-4 md:hidden">
                          {employee.tickets.map((ticket) => (
                            <div
                              key={ticket.ticketId}
                              className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <p className="font-mono text-sm font-black tracking-wide text-primary">
                                    #{ticket.ticketNumber}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatTipDate(ticket.date)}
                                  </p>
                                </div>
                                <p className="text-lg font-black text-emerald-700">
                                  ${ticket.tip.toFixed(2)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openDetails(ticket.ticketId)}
                                className="w-full rounded-xl bg-(--primary-soft) py-2 text-center text-xs font-black text-primary ring-1 ring-(--primary-light) transition hover:bg-(--primary-light)"
                              >
                                View More
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}
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

export default TipsReport;
