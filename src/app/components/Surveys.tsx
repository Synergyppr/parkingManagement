"use client";
import React, { useState, useRef, useEffect } from "react";
import { useProperty } from "../context/PropertyContext";
import {
  carParts,
  findLinkedGroup,
  generateLabelsMap,
} from "../lib/carPartsLegend";
import { CarPart, TicketDetails } from "../types";
import { handleFetchTicketDetails } from "../helpers/dashboardHelpers";
import { THEME_PALETTES, ThemePalette } from "../lib/propertyTheme";

import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { FaCommentDots } from "react-icons/fa6";
import {
  getPuertoRicoToday,
  getDateOffset,
} from "../helpers/reportExportHelpers";

import TicketDetailsModal from "./TicketDetailsModal";
import PageLoader from "./elements/PageLoader";

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

interface Survey {
  id: number;
  ticketId: string;
  ticketNumber: string;
  fullName: string;
  rating: number;
  comments?: string;
  date: string;
}

interface SurveyKPIs {
  totalResponses: number;
  averageRating: number;
  positiveResponses: number;
  positivePercentage: number;
}

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

const DEFAULT_KPIS: SurveyKPIs = {
  totalResponses: 0,
  averageRating: 0,
  positiveResponses: 0,
  positivePercentage: 0,
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

const renderStars = (rating: number, size: "sm" | "md" = "md") => {
  const stars = [];
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className={`${iconClass} text-primary`} />);
    } else if (rating >= i - 0.5) {
      stars.push(
        <FaStarHalfAlt key={i} className={`${iconClass} text-primary`} />
      );
    } else {
      stars.push(
        <FaRegStar key={i} className={`${iconClass} text-slate-300`} />
      );
    }
  }

  return stars;
};

const Surveys = () => {
  const { propertyId, primaryColor, secondaryColor } = useProperty();
  const saveClickedRef = useRef(false);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Survey[]>([]);
  const [kpis, setKpis] = useState<SurveyKPIs>(DEFAULT_KPIS);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>(
    {} as TicketDetails
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

  const [startDate, setStartDate] = useState(() => {
    const today = getPuertoRicoToday();
    return getDateOffset(today, -30);
  });
  const [endDate, setEndDate] = useState(getPuertoRicoToday);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  const fetchSurveys = async () => {
    if (!propertyId) return;

    setLoading(true);

    try {
      const res = await fetch("/api/patronRating/getAll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate,
          endDate,
          pageNumber,
          pageSize,
          filters: {},
        }),
      });

      const data = await res.json();
      console.log("=== SURVEY REPORT API RESPONSE ===", JSON.stringify(data, null, 2));

      if (data?.status === "200") {
        setReport(data?.data?.surveys || []);
        setKpis(data?.data?.kpis || DEFAULT_KPIS);
        setRatingDistribution(data?.data?.ratingDistribution || []);
        setTotalEntries(data?.data?.pagination?.totalEntries ?? 0);
        setTotalPages(data?.data?.pagination?.totalPages ?? 1);
      } else {
        setReport([]);
        setKpis(DEFAULT_KPIS);
        setRatingDistribution([]);
        setTotalEntries(0);
        setTotalPages(1);
        console.log("Failed to fetch surveys", data?.message);
      }
    } catch (error) {
      console.error("Failed to fetch surveys", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchSurveys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, startDate, endDate, pageNumber, pageSize]);

  const safeReport = Array.isArray(report) ? report : [];
  const averageRating = kpis.averageRating;

  return (
    <>
      {loading === true && propertyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <PageLoader />
            <p className="relative bottom-20 mt-1 text-sm font-medium text-white md:bottom-37.5 lg:bottom-43.75">
              Loading data, please wait a moment...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-(--primary-soft) px-4 py-8 border-x border-(--primary-light)">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

        <div className="relative mx-auto max-w-6xl space-y-7">
          <section className="overflow-hidden rounded-4xl border border-(--primary-light)/70 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span
                  className="inline-flex rounded-full border border-(--primary-light) bg-(--primary-soft) px-4 py-1 text-[10px] font-black uppercase 
                tracking-[0.18em] text-primary"
                >
                  Guest Experience
                </span>

                <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Service Feedback
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Review guest ratings, comments, and linked valet ticket
                  details to monitor the quality of every service interaction.
                </p>
              </div>

              <div className="rounded-4xl border border-(--primary-light) bg-linear-to-br from-(--primary-soft) to-white px-6 py-5 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Average Rating
                </p>

                <div className="mt-2 flex items-center justify-center gap-2">
                  {renderStars(averageRating, "sm")}
                </div>

                <p className="mt-2 font-serif text-3xl font-bold text-primary">
                  {averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard
              label="Total Responses"
              value={String(kpis.totalResponses)}
              icon={<FaCommentDots />}
            />

            <SummaryCard
              label="Average Rating"
              value={averageRating.toFixed(1)}
              icon={<FaStar />}
            />

            <SummaryCard
              label="Positive"
              value={String(kpis.positiveResponses)}
              icon={<FaStar />}
            />

            <SummaryCard
              label="Positive %"
              value={`${kpis.positivePercentage}%`}
              icon={<FaRegStar />}
            />
          </section>

          {/* Rating Distribution */}
          {ratingDistribution.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Rating Distribution
              </p>
              <div className="space-y-2.5">
                {[...ratingDistribution].reverse().map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <span className="w-8 text-right text-sm font-bold text-slate-700">
                      {item.rating}<FaStar className="ml-0.5 inline h-3 w-3 text-primary" />
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-bold text-slate-500">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Date Range Filters */}
          <section className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => startDateRef.current?.showPicker()}
              className="relative cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-left shadow-sm transition hover:border-(--primary-light)"
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Start Date
              </span>
              <span className="mt-1 block text-sm font-bold text-slate-900">
                {formatDisplayDate(startDate)}
              </span>
              <input
                ref={startDateRef}
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPageNumber(1);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                tabIndex={-1}
              />
            </button>

            <button
              type="button"
              onClick={() => endDateRef.current?.showPicker()}
              className="relative cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-left shadow-sm transition hover:border-(--primary-light)"
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                End Date
              </span>
              <span className="mt-1 block text-sm font-bold text-slate-900">
                {formatDisplayDate(endDate)}
              </span>
              <input
                ref={endDateRef}
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPageNumber(1);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                tabIndex={-1}
              />
            </button>
          </section>

          {safeReport.length === 0 && !loading ? (
            <section className="rounded-4xl border border-slate-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
                <FaCommentDots className="h-7 w-7" />
              </div>

              <h2 className="font-serif text-3xl font-bold text-slate-950">
                No feedback yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Guest ratings and comments will appear here after completed
                valet experiences.
              </p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {safeReport.map((survey) => (
                <button
                  key={survey?.id}
                  type="button"
                  onClick={() =>
                    handleFetchTicketDetails({
                      id: survey?.ticketId,
                      setTicketDetails,
                      setIncidentParts,
                      setDescriptions,
                      setDamagedParts,
                      setShowTicketDetailsModal,
                    })
                  }
                  className="group rounded-4xl border border-slate-200 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition
                  hover:-translate-y-0.5 hover:border-(--primary-light) hover:bg-(--primary-soft)/40 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-(--primary-light) to-primary text-sm font-black text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
                      {survey?.fullName?.[0]?.toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-950">
                        {survey?.fullName || "Guest"}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(survey?.rating, "sm")}
                        </div>

                        <span className="text-xs font-bold text-slate-400">
                          {survey?.rating?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    {survey?.comments ? (
                      <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                        &ldquo;{survey?.comments}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm italic leading-6 text-slate-400">
                        No comment provided.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-black text-primary ring-1 ring-(--primary-light) cursor-pointer">
                      View Ticket
                    </span>

                    <div className="text-right">
                      <span className="block font-mono text-xs font-black text-primary">
                        #{survey?.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(survey?.date).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* Pagination */}
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold">
                Showing{" "}
                <span className="text-slate-950">{safeReport.length}</span> of{" "}
                <span className="text-slate-950">{totalEntries}</span> reviews
              </span>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="surveyPageSize"
                  className="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Per page
                </label>
                <select
                  id="surveyPageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNumber(1);
                  }}
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
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
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
                type="button"
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
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
          formLicensePlate={""}
          findLinkedGroup={findLinkedGroup}
          frontViewLabelsMap={frontViewLabelsMap}
          rearViewLabelsMap={rearViewLabelsMap}
          passengerViewLabelsMap={passengerViewLabelsMap}
          driverViewLabelsMap={driverViewLabelsMap}
          setHasUnsavedChanges={setHasUnsavedChanges}
          saveClickedRef={saveClickedRef}
        />
      </div>
    </>
  );
};

export default Surveys;

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)">
        {icon}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
