"use client";

import { useEffect } from "react";
import { ChevronRight, Clock, FileText, KeySquare } from "lucide-react";
import { FaCarSide } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";

import { useProperty } from "../context/PropertyContext";

import {
  ActionCard,
  formatDate,
  formatTime,
  TrafficFlowChart,
  type Ticket,
  type TrafficPoint,
} from "./elements/DashboardHelpers";

interface DashboardProps {
  propertyName: string;
  kpis: {
    label: string;
    value: string | number;
    change: string;
    icon: React.ReactNode;
  }[];
  trafficPeriod: "today" | "week";
  setTrafficPeriod: (period: "today" | "week") => void;
  trafficData: TrafficPoint[];
  recentTickets: Ticket[];
  setReloadPageData: (value: boolean) => void;
}

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

  return THEME_PALETTES.find(
    (palette) =>
      normalizeThemeColor(palette.primary) ===
        normalizeThemeColor(storedPrimary) &&
      normalizeThemeColor(palette.secondary) ===
        normalizeThemeColor(storedSecondary)
  );
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

  /*
   * During the first render PropertyContext may still be empty.
   * Never overwrite a saved theme with amber while context is loading.
   */
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

  /*
   * Context updates can briefly arrive one color at a time.
   * Preserve the selected stored palette while the pair is mismatched.
   */
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
const Dashboard = ({
  propertyName,
  kpis,
  trafficPeriod,
  setTrafficPeriod,
  trafficData,
  recentTickets,
  setReloadPageData,
}: DashboardProps) => {
  const { primaryColor, secondaryColor } = useProperty();

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  const openTicket = (ticket: Ticket) => {
    const searchParams = new URLSearchParams({
      status: ticket.status || "received",
      ticketId: String(ticket.id),
    });

    window.location.href = `/check-in?${searchParams.toString()}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-5">
      <div
        className="mb-8 overflow-hidden rounded-4xl border border-(--primary-light) bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]
        transition-colors duration-300"
      >
        <div
          className="relative overflow-hidden bg-linear-to-br from-white via-(--primary-soft) to-white px-6 py-7
          transition-colors duration-300 md:px-8"
        >
          <div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--primary-light)_30%,transparent)] blur-3xl
            transition-colors duration-300"
          />

          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-(--primary-soft) blur-2xl transition-colors duration-300" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="w-full">
              <span
                className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] 
                text-primary shadow-sm transition-colors duration-300"
              >
                Premium Valet Dashboard
              </span>

              <div className="mt-4 flex items-start gap-3 md:items-center">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_30%,transparent)]
                  transition-all duration-300"
                >
                  <KeySquare className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-950">
                    {propertyName || "Valet Operations"}
                  </h1>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Monitor active sessions, vehicle activity, traffic flow,
                    revenue, and real-time valet operations.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/check-in";
                  }}
                  className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white
                  shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary
                  hover:shadow-[0_18px_40px_color-mix(in_srgb,var(--primary)_34%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:rotate-90">
                    <FaPlus className="h-3.5 w-3.5" />
                  </span>

                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      Quick Action
                    </span>

                    <span className="mt-1 text-sm font-black">
                      New Check-In
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:gap-6 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-4xl border border-slate-200 bg-white p-4 md:p-4 lg:p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5
            hover:border-(--primary-light) hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
          >
            <div className="mb-7 flex items-center justify-between gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)
                transition-colors duration-300"
              >
                {kpi.icon}
              </div>

              <span className="rounded-full bg-(--primary-soft) px-3 py-1 lg:text-xs text-[10px] font-black text-primary transition-colors duration-300 truncate">
                {kpi.change}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-500">{kpi.label}</p>

            <h3 className="mt-1 text-3xl font-black text-slate-950">
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:gap-7 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="max-w-[91.5vw] rounded-4xl border border-slate-200 bg-white p-4 shadow-sm md:max-w-none md:p-7">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="border-l-4 border-primary pl-3 font-serif text-3xl font-bold text-slate-950 transition-colors duration-300">
                  Traffic Flow
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {trafficPeriod === "today"
                    ? "Today's received vs ready vehicle movement"
                    : "This week's received vs ready vehicle movement"}
                </p>
              </div>

              <div
                className="flex w-fit shrink-0 items-center gap-1
                  rounded-full
                  border border-(--primary-light)
                  bg-(--primary-soft) p-1
                  transition-colors duration-300
                "
              >
                <button
                  type="button"
                  onClick={() => setTrafficPeriod("today")}
                  aria-pressed={trafficPeriod === "today"}
                  className={`
                    cursor-pointer rounded-full px-4 py-2
                    text-xs font-black
                    transition-all duration-300
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-(--primary-light)
                    ${
                      trafficPeriod === "today"
                        ? `bg-primary text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_28%,transparent)]`
                        : `text-primary hover:bg-white`
                    }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setTrafficPeriod("week")}
                  aria-pressed={trafficPeriod === "week"}
                  className={`cursor-pointer rounded-full px-4 py-2 text-xs font-black transition-all duration-300 focus:outline-none focus-visible:ring-2
                  focus-visible:ring-(--primary-light)
                    ${
                      trafficPeriod === "week"
                        ? `bg-primary text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_28%,transparent)]`
                        : `text-primary hover:bg-white`
                    }`}
                >
                  Week
                </button>
              </div>
            </div>

            <TrafficFlowChart data={trafficData} period={trafficPeriod} />
          </div>

          <div className="mt-7 grid max-w-[91.5vw] gap-5 md:max-w-none md:grid-cols-2">
            <ActionCard
              active
              icon={<Clock />}
              title="New Check-in"
              text="Start a new valet ticket session"
              link="/check-in"
            />

            <ActionCard
              icon={<FileText />}
              title="Ticket Report"
              text="View current shift performance"
              link="/report"
            />
          </div>
        </div>

        <aside className="max-w-[91.5vw] overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm md:max-w-none">
          <div className="border-b border-slate-200 p-6">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-950">
              <Clock className="h-5 w-5 text-primary transition-colors duration-300" />
              Recent Activity
            </h2>
          </div>

          <div className="divide-y divide-slate-200 px-5">
            {recentTickets.length === 0 ? (
              <div className="py-12 text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary
                  transition-colors duration-300"
                >
                  <FaCarSide className="h-5 w-5" />
                </div>

                <p className="text-sm font-semibold text-slate-400">
                  No recent tickets yet.
                </p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="group flex items-center gap-3 py-5 transition-colors duration-200"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--primary-soft) text-primary transition-all duration-300
                    group-hover:bg-primary group-hover:text-white"
                  >
                    <FaCarSide />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold leading-tight text-slate-900">
                      {ticket.color} {ticket.make} {ticket.model}
                    </h4>

                    <p className="text-sm text-slate-600">
                      #{ticket.ticketNumber || "—"} ·{" "}
                      <span className="font-bold capitalize text-primary transition-colors duration-300">
                        {ticket.status || "received"}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {formatTime(ticket.createdDateTime)}
                    </p>

                    <p className="text-slate-400">
                      {formatDate(ticket.createdDateTime)}
                    </p>

                    <p className="max-w-24 truncate font-bold capitalize text-slate-700">
                      {ticket.firstName || ticket.lastName
                        ? `${ticket.firstName || ""} ${
                            ticket.lastName || ""
                          }`.trim()
                        : "Guest"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openTicket(ticket)}
                    aria-label={`Open ticket ${
                      ticket.ticketNumber || ticket.id
                    }`}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-all duration-200
                    hover:bg-(--primary-soft) hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-5">
            <button
              type="button"
              onClick={() => setReloadPageData(true)}
              className="h-11 w-full cursor-pointer rounded-xl border-2 border-primary bg-(--primary-soft) text-sm font-bold text-primary shadow-sm
              transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)]
              focus:outline-none focus:ring-2 focus:ring-(--primary-light) focus:ring-offset-2"
            >
              Refresh Dashboard
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Dashboard;
