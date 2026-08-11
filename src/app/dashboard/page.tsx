"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Car, Clock, MapPin, KeySquare } from "lucide-react";

import { fetchTicketsData } from "../helpers/dashboardHelpers";
import { useProperty } from "../context/PropertyContext";
import { THEME_PALETTES } from "../lib/propertyTheme";

import PageLoader from "../components/elements/PageLoader";
import Dashboard from "../components/Dashboard";
import {
  DashboardData,
  Ticket,
  TrafficPeriod,
  TrafficPoint,
} from "../components/elements/DashboardHelpers";
import Footer from "../components/Footer";

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#f59e0b";

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const color = value.trim();

  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const normalizeThemeColor = (value: string) => value.trim().toLowerCase();

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

const applyThemeColors = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}): boolean => {
  if (typeof window === "undefined") return false;

  const root = document.documentElement;

  const primary = isValidThemeColor(primaryColor)
    ? primaryColor.trim()
    : DEFAULT_PRIMARY_COLOR;

  const secondary = isValidThemeColor(secondaryColor)
    ? secondaryColor.trim()
    : DEFAULT_SECONDARY_COLOR;

  const matchedPalette = findThemePalette(primary, secondary);

  if (matchedPalette) {
    root.dataset.theme = matchedPalette.name;

    root.style.setProperty("--primary", matchedPalette.primary);
    root.style.setProperty("--primary-light", matchedPalette.primaryLight);
    root.style.setProperty("--primary-soft", matchedPalette.primarySoft);

    root.style.setProperty("--secondary", matchedPalette.secondary);
    root.style.setProperty(
      "--secondary-light",
      matchedPalette.secondaryLight
    );
    root.style.setProperty("--secondary-soft", matchedPalette.secondarySoft);

    localStorage.setItem("primaryColor", matchedPalette.primary);
    localStorage.setItem("secondaryColor", matchedPalette.secondary);
    localStorage.setItem("parkey-theme", matchedPalette.name);

    return true;
  }

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
  localStorage.removeItem("parkey-theme");

  return true;
};

export default function DashboardPage() {
  const {
    propertyId,
    propertyName,
    locationMode,
    requestLocation,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
  } = useProperty();

  const requestIdRef = useRef(0);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeReady, setThemeReady] = useState(false);
  const [reloadPageData, setReloadPageData] = useState(false);
  const [trafficPeriod, setTrafficPeriod] =
    useState<TrafficPeriod>("today");

  /*
   * Keep the document CSS variables synchronized after the selected
   * property theme has already been fetched and applied.
   */
  useLayoutEffect(() => {
    if (!themeReady) return;

    if (
      !isValidThemeColor(primaryColor) ||
      !isValidThemeColor(secondaryColor)
    ) {
      return;
    }

    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor, themeReady]);

  useEffect(() => {
    let isCurrentRequest = true;

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    if (locationMode === "live") {
      requestLocation();
    }

    const fetchingAllTickets = async () => {
      /*
       * Do not show the dashboard using the previous property's theme.
       */
      setThemeReady(false);
      setLoading(true);

      if (!propertyId) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchTicketsData({
          propertyId,
          setLoading,
        });

        if (
          !isCurrentRequest ||
          requestIdRef.current !== currentRequestId
        ) {
          return;
        }

        const endpointPrimaryColor = isValidThemeColor(result?.primaryColor)
          ? result.primaryColor.trim()
          : DEFAULT_PRIMARY_COLOR;

        const endpointSecondaryColor = isValidThemeColor(
          result?.secondaryColor
        )
          ? result.secondaryColor.trim()
          : DEFAULT_SECONDARY_COLOR;

        /*
         * Apply the API theme immediately before mounting the dashboard.
         */
        applyThemeColors({
          primaryColor: endpointPrimaryColor,
          secondaryColor: endpointSecondaryColor,
        });

        /*
         * Save the API theme in PropertyContext for the Header, Dashboard,
         * Footer, modals, and other components using useProperty().
         */
        setPrimaryColor(endpointPrimaryColor);
        setSecondaryColor(endpointSecondaryColor);

        setData(result || null);

        /*
         * Allow the browser to commit the CSS variables before the
         * dashboard UI is mounted.
         */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (
              !isCurrentRequest ||
              requestIdRef.current !== currentRequestId
            ) {
              return;
            }

            setThemeReady(true);
            setLoading(false);
          });
        });
      } catch (error) {
        console.error("Unable to fetch dashboard data:", error);

        if (
          !isCurrentRequest ||
          requestIdRef.current !== currentRequestId
        ) {
          return;
        }

        /*
         * Use the default theme only when the property request fails.
         */
        applyThemeColors({
          primaryColor: DEFAULT_PRIMARY_COLOR,
          secondaryColor: DEFAULT_SECONDARY_COLOR,
        });

        setPrimaryColor(DEFAULT_PRIMARY_COLOR);
        setSecondaryColor(DEFAULT_SECONDARY_COLOR);

        setData(null);
        setThemeReady(true);
        setLoading(false);
      }
    };

    fetchingAllTickets();

    return () => {
      isCurrentRequest = false;
      setReloadPageData(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, locationMode, reloadPageData]);

  const tickets = useMemo(() => data?.tickets || [], [data?.tickets]);

  const readyTickets = useMemo(
    () => data?.readyTickets || [],
    [data?.readyTickets]
  );

  const parkedCount = tickets.filter(
    (ticket) => ticket.status === "parked"
  ).length;

  const requestedCount = tickets.filter(
    (ticket) => ticket.status === "requested"
  ).length;

  const readyCount =
    readyTickets.length ||
    tickets.filter((ticket) => ticket.status === "ready").length;

  const recentTickets = useMemo(() => {
    // Merge tickets + readyTickets, dedup by id
    const map = new Map<string, Ticket>();
    for (const t of tickets) map.set(t.id, t);
    for (const t of readyTickets) if (!map.has(t.id)) map.set(t.id, t);

    return Array.from(map.values())
      .sort(
        (a, b) =>
          new Date(b.lastUpdated || b.createdDateTime || 0).getTime() -
          new Date(a.lastUpdated || a.createdDateTime || 0).getTime()
      )
      .slice(0, 5);
  }, [tickets, readyTickets]);

  const trafficData = useMemo<TrafficPoint[]>(() => {
    const now = new Date();

    const getStatus = (status?: string | null) =>
      String(status || "received")
        .trim()
        .toLowerCase();

    // Dedup ready tickets by ID to avoid double-counting
    const readyMap = new Map<string, Ticket>();
    for (const ticket of readyTickets) {
      readyMap.set(ticket.id, ticket);
    }
    for (const ticket of tickets) {
      if (getStatus(ticket.status) === "ready" && !readyMap.has(ticket.id)) {
        readyMap.set(ticket.id, ticket);
      }
    }
    const allReadyTickets = Array.from(readyMap.values());

    const isSameDay = (dateA: Date, dateB: Date) =>
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate();

    const getTicketDate = (ticket: Ticket) => {
      if (!ticket.createdDateTime) return null;

      const date = new Date(ticket.createdDateTime);

      return Number.isNaN(date.getTime()) ? null : date;
    };

    // For ready tickets, use lastUpdated (when it became ready) instead of createdDateTime
    const getReadyDate = (ticket: Ticket) => {
      const dateStr = ticket.lastUpdated || ticket.createdDateTime;
      if (!dateStr) return null;

      const date = new Date(dateStr);

      return Number.isNaN(date.getTime()) ? null : date;
    };

    if (trafficPeriod === "week") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      return Array.from({ length: 7 }).map((_, index) => {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + index);

        const receivedForDay = tickets.filter((ticket) => {
          const ticketDate = getTicketDate(ticket);

          return ticketDate ? isSameDay(ticketDate, dayStart) : false;
        }).length;

        const readyForDay = allReadyTickets.filter((ticket) => {
          const ticketDate = getReadyDate(ticket);

          return ticketDate ? isSameDay(ticketDate, dayStart) : false;
        }).length;

        return {
          label: dayStart.toLocaleDateString("en-US", {
            weekday: "short",
          }),
          received: receivedForDay,
          ready: readyForDay,
        };
      });
    }

    const hours = [8, 10, 12, 14, 16, 18, 20];

    return hours.map((hour) => {
      const start = new Date(now);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(now);
      end.setHours(hour + 2, 0, 0, 0);

      const isInBucket = (date: Date | null) => {
        if (!date) return false;

        return isSameDay(date, now) && date >= start && date < end;
      };

      return {
        label: `${String(hour).padStart(2, "0")}:00`,
        received: tickets.filter((t) => isInBucket(getTicketDate(t))).length,
        ready: allReadyTickets.filter((t) => isInBucket(getReadyDate(t)))
          .length,
      };
    });
  }, [tickets, readyTickets, trafficPeriod]);

  const kpis = [
    {
      label: "Total Vehicles",
      value: tickets.length + readyTickets.length,
      change: "Live",
      icon: <Car className="h-5 w-5" />,
    },
    {
      label: "Vehicles Parked",
      value: parkedCount,
      change: `${parkedCount} parked`,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: "Vehicles Requested",
      value: requestedCount,
      change: `${requestedCount} requested`,
      icon: <KeySquare className="h-5 w-5" />,
    },
    {
      label: "Today Vehicle Delivered",
      value: readyCount,
      change: `${readyCount} ready`,
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  /*
   * The Dashboard, Header-dependent page content, and Footer are not
   * mounted until the selected property's theme is applied.
   */
  if (!themeReady) {
    return (
      <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center justify-center">
          <PageLoader />

          <p className="relative bottom-20 mt-1 text-center text-sm font-light text-white md:bottom-37.5 lg:bottom-43.75">
            Loading property theme...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-[90vh] bg-[#f8f5ed] text-slate-950">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <PageLoader />
          </div>
        )}

        <Dashboard
          propertyName={propertyName}
          kpis={kpis}
          trafficPeriod={trafficPeriod}
          setTrafficPeriod={setTrafficPeriod}
          trafficData={trafficData}
          recentTickets={recentTickets}
          setReloadPageData={setReloadPageData}
        />
      </main>

      <Footer />
    </>
  );
}