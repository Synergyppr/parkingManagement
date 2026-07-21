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

import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { FaCommentDots } from "react-icons/fa6";

import TicketDetailsModal from "./TicketDetailsModal";
import PageLoader from "./elements/PageLoader";

const THEME_STORAGE_KEY = "parkey-theme";

type ThemePalette = {
  name: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  secondary: string;
  secondaryLight: string;
  secondarySoft: string;
};

const THEME_PALETTES: ThemePalette[] = [
  {
    name: "amber",
    primary: "#d97706",
    primaryLight: "#fbbf24",
    primarySoft: "#fffbeb",
    secondary: "#f59e0b",
    secondaryLight: "#fcd34d",
    secondarySoft: "#fef3c7",
  },
  {
    name: "sapphire",
    primary: "#2563eb",
    primaryLight: "#60a5fa",
    primarySoft: "#eff6ff",
    secondary: "#3b82f6",
    secondaryLight: "#93c5fd",
    secondarySoft: "#dbeafe",
  },
  {
    name: "emerald",
    primary: "#059669",
    primaryLight: "#34d399",
    primarySoft: "#ecfdf5",
    secondary: "#10b981",
    secondaryLight: "#6ee7b7",
    secondarySoft: "#d1fae5",
  },
  {
    name: "royal",
    primary: "#7c3aed",
    primaryLight: "#a78bfa",
    primarySoft: "#f5f3ff",
    secondary: "#8b5cf6",
    secondaryLight: "#c4b5fd",
    secondarySoft: "#ede9fe",
  },
  {
    name: "ruby",
    primary: "#dc2626",
    primaryLight: "#f87171",
    primarySoft: "#fef2f2",
    secondary: "#ef4444",
    secondaryLight: "#fca5a5",
    secondarySoft: "#fee2e2",
  },
  {
    name: "teal",
    primary: "#0f766e",
    primaryLight: "#2dd4bf",
    primarySoft: "#f0fdfa",
    secondary: "#14b8a6",
    secondaryLight: "#5eead4",
    secondarySoft: "#ccfbf1",
  },
  {
    name: "rose",
    primary: "#db2777",
    primaryLight: "#f472b6",
    primarySoft: "#fdf2f8",
    secondary: "#ec4899",
    secondaryLight: "#f9a8d4",
    secondarySoft: "#fce7f3",
  },
  {
    name: "obsidian",
    primary: "#111827",
    primaryLight: "#d4af37",
    primarySoft: "#f9f5e7",
    secondary: "#d4af37",
    secondaryLight: "#f4d675",
    secondarySoft: "#fef9e7",
  },
];

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
  id: string;
  fullName: string;
  comments?: string;
  ticketId: string;
  rating: number;
}

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

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Survey[]>([]);
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

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!propertyId) return;

      setLoading(true);

      try {
        const res = await fetch("/api/patronRating/getAll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: propertyId }),
        });

        const data = await res.json();

        if (data?.status === "200") {
          const surveys = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.data)
            ? data.data.data
            : Array.isArray(data?.result?.data)
            ? data.result.data
            : [];

          setReport(surveys);
        } else {
          setReport([]);
          console.log("Failed to fetch surveys", data?.message);
        }
      } catch (error) {
        console.error("Failed to fetch surveys", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [propertyId]);

  const safeReport = Array.isArray(report) ? report : [];

  const calculateAverageRating = () => {
    if (safeReport.length === 0) return 0;

    const total = safeReport.reduce(
      (sum, survey) => sum + Number(survey?.rating || 0),
      0
    );

    return total / safeReport.length;
  };

  const averageRating = calculateAverageRating();
  const latestSurveys = [...safeReport].sort((a, b) => (a.id < b.id ? 1 : -1));

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

          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SummaryCard
              label="Total Feedback"
              value={String(safeReport.length)}
              icon={<FaCommentDots />}
            />

            <SummaryCard
              label="Average Score"
              value={averageRating.toFixed(1)}
              icon={<FaStar />}
            />

            <SummaryCard
              label="Latest Reviews"
              value={String(latestSurveys.length)}
              icon={<FaRegStar />}
            />
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
              {latestSurveys.map((survey) => (
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

                    <span className="text-xs font-bold text-slate-400">
                      #{survey?.ticketId?.slice(0, 8)}
                    </span>
                  </div>
                </button>
              ))}
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
