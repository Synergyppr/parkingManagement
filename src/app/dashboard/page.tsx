"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Car, Clock, MapPin, KeySquare } from "lucide-react";
import { fetchTicketsData } from "../helpers/dashboardHelpers";
import { useProperty } from "../context/PropertyContext";
import PageLoader from "../components/elements/PageLoader";
import Dashboard from "../components/Dashboard";
import {
  DashboardData,
  Ticket,
  TrafficPeriod,
  TrafficPoint,
} from "../components/elements/DashboardHelpers";
import Footer from "../components/Footer";

export default function DashboardPage() {
  const { propertyId, propertyName, locationMode, requestLocation } =
    useProperty();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadPageData, setReloadPageData] = useState(false);
  const [trafficPeriod, setTrafficPeriod] = useState<TrafficPeriod>("today");

  useEffect(() => {
    if (locationMode === "live") requestLocation();

    const fetchingAllTickets = async () => {
      const result = await fetchTicketsData({
        propertyId,
        setLoading,
      });

      setData(result || null);
    };

    if (propertyId) fetchingAllTickets();

    return () => setReloadPageData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, locationMode, reloadPageData]);

  const tickets = useMemo(() => data?.tickets || [], [data?.tickets]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const readyTickets = data?.readyTickets || [];

  const parkedCount = tickets.filter((t) => t.status === "parked").length;
  const requestedCount = tickets.filter((t) => t.status === "requested").length;
  const receivedCount = tickets.filter(
    (t) => !t.status || t.status === "received"
  ).length;
  const readyCount =
    readyTickets.length || tickets.filter((t) => t.status === "ready").length;

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort(
        (a, b) =>
          new Date(b.createdDateTime || 0).getTime() -
          new Date(a.createdDateTime || 0).getTime()
      )
      .slice(0, 5);
  }, [tickets]);

  const trafficData = useMemo<TrafficPoint[]>(() => {
    const now = new Date();

    const getStatus = (status?: string | null) =>
      String(status || "received")
        .trim()
        .toLowerCase();

    const allReadyTickets = [
      ...tickets.filter((ticket) => getStatus(ticket.status) === "ready"),
      ...readyTickets,
    ];

    const isSameDay = (dateA: Date, dateB: Date) =>
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate();

    const getTicketDate = (ticket: Ticket) => {
      if (!ticket.createdDateTime) return null;

      const date = new Date(ticket.createdDateTime);
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
          const ticketDate = getTicketDate(ticket);
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

      const isInBucket = (ticket: Ticket) => {
        const ticketDate = getTicketDate(ticket);
        if (!ticketDate) return false;

        return (
          isSameDay(ticketDate, now) && ticketDate >= start && ticketDate < end
        );
      };

      return {
        label: `${String(hour).padStart(2, "0")}:00`,
        received: tickets.filter(isInBucket).length,
        ready: allReadyTickets.filter(isInBucket).length,
      };
    });
  }, [tickets, readyTickets, trafficPeriod]);

  const kpis = [
    {
      label: "Active Valet Sessions",
      value: tickets?.length + readyTickets?.length,
      change: "Live",
      icon: <Car className="h-5 w-5" />,
    },
    {
      label: "Vehicles Parked",
      value: parkedCount,
      change: `${receivedCount} received`,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: "Vehicles Requested",
      value: requestedCount,
      change: `${requestedCount} requested`,
      icon: <KeySquare className="h-5 w-5" />,
    },
    {
      label: "Ready for Pickup",
      value: readyCount,
      change: `${readyCount} ready`,
      icon: <Clock className="h-5 w-5" />,
    },
  ];

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
