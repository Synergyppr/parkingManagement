"use client";
import React, { useState, useEffect } from "react";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { useProperty } from "../context/PropertyContext";
import { CarPart, JournalEntry, ReportEntry, ReportKPIs, TicketDetails } from "../types";
import { handleFetchTicketDetails } from "../helpers/dashboardHelpers";
import {
  getPuertoRicoToday,
  getDateOffset,
  exportTicketsPdf,
  exportTransactionsPdf,
} from "../helpers/reportExportHelpers";
import { THEME_PALETTES, ThemePalette } from "../lib/propertyTheme";

import TicketDetailsModal from "./TicketDetailsModal";

const THEME_STORAGE_KEY = "parkey-theme";

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const color = value.trim();

  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^#[0-9a-fA-F]{8}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const normalizeThemeColor = (value: string) => value.trim().toLowerCase();

const getStoredThemeColor = (key: "primaryColor" | "secondaryColor") => {
  if (typeof window === "undefined") return null;

  const storedColor = localStorage.getItem(key);

  return isValidThemeColor(storedColor) ? storedColor.trim() : null;
};

const findThemePalette = (
  primaryColor?: string | null,
  secondaryColor?: string | null
) => {
  if (!isValidThemeColor(primaryColor) || !isValidThemeColor(secondaryColor)) {
    return undefined;
  }

  const primary = normalizeThemeColor(primaryColor);
  const secondary = normalizeThemeColor(secondaryColor);

  return THEME_PALETTES.find(
    (palette) =>
      normalizeThemeColor(palette.primary) === primary &&
      normalizeThemeColor(palette.secondary) === secondary
  );
};

const getStoredPalette = () => {
  if (typeof window === "undefined") return undefined;

  const storedThemeName = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedThemeName) {
    const paletteByName = THEME_PALETTES.find(
      (palette) => palette.name === storedThemeName
    );

    if (paletteByName) return paletteByName;
  }

  const storedPrimary = getStoredThemeColor("primaryColor");
  const storedSecondary = getStoredThemeColor("secondaryColor");

  if (!storedPrimary || !storedSecondary) return undefined;

  return findThemePalette(storedPrimary, storedSecondary);
};

const applyPalette = (palette: ThemePalette) => {
  const root = document.documentElement;

  root.dataset.theme = palette.name;

  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-light", palette.primaryLight);
  root.style.setProperty("--primary-soft", palette.primarySoft);

  root.style.setProperty("--secondary", palette.secondary);
  root.style.setProperty("--secondary-light", palette.secondaryLight);
  root.style.setProperty("--secondary-soft", palette.secondarySoft);

  localStorage.setItem("primaryColor", palette.primary);
  localStorage.setItem("secondaryColor", palette.secondary);
  localStorage.setItem(THEME_STORAGE_KEY, palette.name);
};

const applyCustomTheme = (primary: string, secondary: string) => {
  const root = document.documentElement;

  root.removeAttribute("data-theme");

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);

  root.style.setProperty(
    "--primary-light",
    `color-mix(in srgb, ${primary} 35%, white)`
  );

  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 10%, white)`
  );

  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 35%, white)`
  );

  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 10%, white)`
  );

  localStorage.setItem("primaryColor", primary);
  localStorage.setItem("secondaryColor", secondary);
  localStorage.removeItem(THEME_STORAGE_KEY);
};

const applyThemeColors = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof window === "undefined") return;

  const hasContextPrimary = isValidThemeColor(primaryColor);
  const hasContextSecondary = isValidThemeColor(secondaryColor);

  if (!hasContextPrimary || !hasContextSecondary) {
    const storedPalette = getStoredPalette();

    if (storedPalette) {
      applyPalette(storedPalette);
      return;
    }

    const storedPrimary = getStoredThemeColor("primaryColor");
    const storedSecondary = getStoredThemeColor("secondaryColor");

    if (storedPrimary && storedSecondary) {
      const storedMatchedPalette = findThemePalette(
        storedPrimary,
        storedSecondary
      );

      if (storedMatchedPalette) {
        applyPalette(storedMatchedPalette);
      } else {
        applyCustomTheme(storedPrimary, storedSecondary);
      }

      return;
    }

    applyPalette(THEME_PALETTES[0]);
    return;
  }

  const resolvedPrimary = primaryColor.trim();
  const resolvedSecondary = secondaryColor.trim();

  const contextPalette = findThemePalette(resolvedPrimary, resolvedSecondary);

  if (contextPalette) {
    applyPalette(contextPalette);
    return;
  }

  const storedPalette = getStoredPalette();

  if (
    storedPalette &&
    (normalizeThemeColor(storedPalette.primary) ===
      normalizeThemeColor(resolvedPrimary) ||
      normalizeThemeColor(storedPalette.secondary) ===
        normalizeThemeColor(resolvedSecondary))
  ) {
    applyPalette(storedPalette);
    return;
  }

  applyCustomTheme(resolvedPrimary, resolvedSecondary);
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const formatJournalDate = (dateStr: string) => {
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

const OPERATION_LABELS: Record<string, string> = {
  SALE: "Sale",
  REFUND: "Refund",
  VOID: "Void",
  ATH_MOVIL_SALE: "ATH Movil",
};

const OPERATION_STYLES: Record<string, string> = {
  SALE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ATH_MOVIL_SALE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REFUND: "bg-amber-50 text-amber-700 ring-amber-200",
  VOID: "bg-red-50 text-red-700 ring-red-200",
};

const DEFAULT_KPIS: ReportKPIs = {
  ticketCount: 0,
  salesAmount: 0,
  refundAmount: 0,
  voidAmount: 0,
};

const Report = () => {
  const saveClickedRef = React.useRef(false);
  const { propertyId, propertyName, primaryColor, secondaryColor } =
    useProperty();

  const [allTickets, setAllTickets] = useState<ReportEntry[]>([]);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails
  );
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [detailsActiveTab, setDetailsActiveTab] = useState("Details");
  const [transitionState, setTransitionState] = useState("fade-in");
  const [noIncident, setNoIncident] = useState(false);
  const [viewAllDamagedParts, setViewAllDamagedParts] = useState(false);
  const [, setHasUnsavedChanges] = useState(false);

  const [incidentParts, setIncidentParts] = useState<CarPart[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [damagedParts, setDamagedParts] = useState<CarPart[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const today = getPuertoRicoToday();
    return getDateOffset(today, -7);
  });
  const [endDate, setEndDate] = useState(getPuertoRicoToday);
  const [kpis, setKpis] = useState<ReportKPIs>(DEFAULT_KPIS);
  const [allJournals, setAllJournals] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"tickets" | "journals">(
    "tickets"
  );
  const [serverPagination, setServerPagination] = useState({
    totalEntries: 0,
    totalPages: 1,
  });

  const frontViewLabelsMap = generateLabelsMap(carParts.frontViewCar);
  const rearViewLabelsMap = generateLabelsMap(carParts.rearViewCar);
  const passengerViewLabelsMap = generateLabelsMap(carParts.passengerViewCar);
  const driverViewLabelsMap = generateLabelsMap(carParts.driverViewCar);

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  // Derived pagination — tickets: server-side, journals: client-side
  const journalTotalRecords = allJournals.length;
  const journalTotalPages = Math.max(
    1,
    Math.ceil(journalTotalRecords / pageSize)
  );
  const journalStartIndex = (pageNumber - 1) * pageSize;
  const journalPage = allJournals.slice(
    journalStartIndex,
    journalStartIndex + pageSize
  );

  const totalRecords =
    activeTab === "tickets"
      ? serverPagination.totalEntries
      : journalTotalRecords;
  const totalPages =
    activeTab === "tickets"
      ? serverPagination.totalPages
      : journalTotalPages;
  const report = allTickets; // already paginated by server

  const getReportData = async () => {
    const sendForm = {
      propertyId,
      startDate,
      endDate,
      pageNumber,
      pageSize,
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
    const result = data?.result?.data;

    if (result) {
      setAllTickets(result.tickets || []);
      setAllJournals(result.journals || []);
      setKpis(result.kpis || DEFAULT_KPIS);
      setServerPagination({
        totalEntries: result.pagination?.totalEntries ?? 0,
        totalPages: result.pagination?.totalPages ?? 1,
      });
    } else {
      setAllTickets([]);
      setAllJournals([]);
      setKpis(DEFAULT_KPIS);
      setServerPagination({ totalEntries: 0, totalPages: 1 });
    }
  };

  useEffect(() => {
    if (propertyId) {
      const timer = setTimeout(() => {
        getReportData();
      }, 400);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, propertyId, startDate, endDate, pageNumber, pageSize]);

  const handleSearchChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearch(e.target.value);
    setPageNumber(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPageNumber(1);
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
  };

  const handleTabChange = (tab: "tickets" | "journals") => {
    setActiveTab(tab);
    setPageNumber(1);
  };

  const handleExportTicketsPdf = () => {
    exportTicketsPdf(
      allTickets,
      kpis,
      propertyName || "Property",
      startDate,
      endDate
    );
  };

  const handleExportTransactionsPdf = () => {
    exportTransactionsPdf(
      allJournals,
      kpis,
      propertyName || "Property",
      startDate,
      endDate
    );
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
    <div className="min-h-screen bg-(--primary-soft) px-4 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-6xl space-y-7">
        {/* Hero */}
        <section className="overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span
                className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
              tracking-[0.18em] text-primary"
              >
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

        {/* Date Range + Search */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-[auto_auto_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPageNumber(1);
              }}
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
              onChange={(e) => {
                setEndDate(e.target.value);
                setPageNumber(1);
              }}
              className="mt-1 h-9 w-full rounded-lg border-none bg-transparent text-sm font-bold text-slate-900 outline-none"
            />
          </div>

          <div className="relative sm:col-span-2 md:col-span-1">
            <input
              autoFocus={false}
              type="text"
              placeholder="Search by ticket #, name, destination..."
              value={search}
              onChange={handleSearchChange}
              className="h-full w-full rounded-2xl border border-slate-200 bg-white px-5 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none
              transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-(--primary-soft) min-h-14"
            />
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-(--primary-light)">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Total Tickets
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {kpis.ticketCount}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600/70">
              Sales
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              ${kpis.salesAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600/70">
              Refunds
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              ${kpis.refundAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600/70">
              Voids
            </p>
            <p className="mt-2 text-3xl font-black text-red-700">
              ${kpis.voidAmount.toFixed(2)}
            </p>
          </div>
        </section>

        {/* Tabs + Export */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm w-fit">
            <button
              type="button"
              onClick={() => handleTabChange("tickets")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "tickets"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Tickets ({allTickets.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("journals")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "journals"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Transactions ({allJournals.length})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportTicketsPdf}
              disabled={allTickets.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700
              shadow-sm transition hover:border-(--primary-light) hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Tickets
            </button>

            <button
              type="button"
              onClick={handleExportTransactionsPdf}
              disabled={allJournals.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700
              shadow-sm transition hover:border-(--primary-light) hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Transactions
            </button>
          </div>
        </section>

        {activeTab === "tickets" && (
          <>
        {/* Desktop Table */}
        <section className="hidden overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:block">
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
                className={`grid w-full grid-cols-6 items-center px-5 py-4 text-left text-sm transition hover:bg-(--primary-soft)/50 ${
                  i < report.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <span className="font-mono font-black tracking-wide text-primary">
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

                <span className="text-right text-sm font-black text-primary cursor-pointer">
                  View
                </span>
              </button>
            ))
          )}
        </section>

        {/* Mobile Cards */}
        <section className="space-y-3 md:hidden">
          {report.length === 0 ? (
            <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm">
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
                className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-(--primary-light) 
                hover:bg-(--primary-soft)/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-black tracking-wide text-primary">
                      #{entry?.ticketNumber}
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold capitalize text-slate-950">
                      {entry?.patronName || "Unknown Patron"}
                    </h3>
                  </div>

                  <span className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-black text-primary ring-1 ring-(--primary-light)">
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
          </>
        )}

        {activeTab === "journals" && (
          <>
        {/* Desktop Journals Table */}
        <section className="hidden overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:block">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            <span>Type</span>
            <span>Status</span>
            <span>Amount</span>
            <span>Terminal</span>
            <span>Reference</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>

          {journalPage.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-2xl font-bold text-slate-950">
                No transactions found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different date range.
              </p>
            </div>
          ) : (
            journalPage.map((entry, i) => (
              <div
                key={entry.id}
                className={`grid grid-cols-7 items-center px-5 py-4 text-sm ${
                  i < journalPage.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                    OPERATION_STYLES[entry.operationType] ||
                    "bg-slate-50 text-slate-700 ring-slate-200"
                  }`}
                >
                  {OPERATION_LABELS[entry.operationType] ||
                    entry.operationType}
                </span>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    entry.paymentStatus === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {entry.paymentStatus}
                </span>

                <span className="font-bold text-slate-950">
                  ${entry.amount.toFixed(2)}
                </span>

                <span className="font-mono text-xs text-slate-500">
                  {entry.terminalId}
                </span>

                <span className="font-mono text-xs text-slate-500">
                  {entry.reference}
                </span>

                <span className="text-xs font-bold uppercase text-slate-400">
                  {formatJournalDate(entry.createdDateTime)}
                </span>

                {entry.externalTransactionId ? (
                  <button
                    type="button"
                    onClick={() => openDetails(entry.externalTransactionId!)}
                    className="text-right text-sm font-black text-primary cursor-pointer hover:underline"
                  >
                    View
                  </button>
                ) : (
                  <span className="text-right text-xs text-slate-300">—</span>
                )}
              </div>
            ))
          )}
        </section>

        {/* Mobile Journals Cards */}
        <section className="space-y-3 md:hidden">
          {journalPage.length === 0 ? (
            <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-serif text-2xl font-bold text-slate-950">
                No transactions found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different date range.
              </p>
            </div>
          ) : (
            journalPage.map((entry) => (
              <div
                key={entry.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                        OPERATION_STYLES[entry.operationType] ||
                        "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {OPERATION_LABELS[entry.operationType] ||
                        entry.operationType}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        entry.paymentStatus === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {entry.paymentStatus}
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-950">
                    ${entry.amount.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Terminal
                    </p>
                    <p className="mt-1 font-mono font-semibold text-slate-700">
                      {entry.terminalId}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Reference
                    </p>
                    <p className="mt-1 font-mono font-semibold text-slate-700">
                      {entry.reference}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {formatJournalDate(entry.createdDateTime)}
                    </p>
                  </div>
                </div>

                {entry.externalTransactionId && (
                  <button
                    type="button"
                    onClick={() => openDetails(entry.externalTransactionId!)}
                    className="mt-4 w-full rounded-2xl bg-(--primary-soft) py-2.5 text-center text-xs font-black text-primary ring-1 ring-(--primary-light)
                    transition hover:bg-(--primary-light)"
                  >
                    View Ticket
                  </button>
                )}
              </div>
            ))
          )}
        </section>
          </>
        )}

        {/* Pagination */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold">
              Showing{" "}
              <span className="text-slate-950">
                {activeTab === "tickets"
                  ? report.length
                  : journalPage.length}
              </span>{" "}
              of <span className="text-slate-950">{totalRecords}</span>{" "}
              {activeTab === "tickets" ? "tickets" : "transactions"}
            </span>

            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
              >
                Per page
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-(--primary-soft)"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              onClick={handlePrevPage}
              disabled={pageNumber <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition
              hover:bg-(--primary-soft) hover:text-primary disabled:opacity-40"
            >
              &lsaquo;
            </button>

            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Page {pageNumber} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={pageNumber >= totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition
              hover:bg-(--primary-soft) hover:text-primary disabled:opacity-40"
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
