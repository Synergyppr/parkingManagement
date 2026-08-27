"use client";
import { ChevronRight, Clock, FileText, KeySquare, RefreshCw } from "lucide-react";
import { FaCarSide } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";

import {
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
  trafficData: TrafficPoint[];
  recentTickets: Ticket[];
  setReloadPageData: (value: boolean) => void;
}

const Dashboard = ({
  propertyName,
  kpis,
  trafficData,
  recentTickets,
  setReloadPageData,
}: DashboardProps) => {
  const openTicket = (ticket: Ticket) => {
    const searchParams = new URLSearchParams({
      status: ticket.status || "received",
      ticketId: String(ticket.id),
    });

    window.location.href = `/check-in?${searchParams.toString()}`;
  };

  const redirectToStatus = (status: string) => {
    const statuses = ["received", "requested", "parked", "ready"];
    if (!statuses.includes(status)) return;

    const searchParams = new URLSearchParams({
      status: status,
    });

    window.location.href = `/check-in?${searchParams.toString()}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-5">
      {/* Header */}
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
            <div>
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
            </div>

            {/* Quick Actions */}
            <div className="flex shrink-0 flex-wrap gap-3">
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
                  <span className="mt-1 text-sm font-black">New Check-In</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/report";
                }}
                className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-primary bg-white px-5 py-3 text-sm font-black text-primary
                shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--primary-soft)
                hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--primary-soft) transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  <FileText className="h-3.5 w-3.5" />
                </span>

                <span className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick Action
                  </span>
                  <span className="mt-1 text-sm font-black">Report</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => redirectToStatus(kpi?.change?.split(" ")[1])}
            className="cursor-pointer rounded-4xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5
            hover:border-(--primary-light) hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-4 lg:p-7"
          >
            <div className="mb-7 flex items-center justify-between gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)
                transition-colors duration-300"
              >
                {kpi.icon}
              </div>

              <span className="truncate rounded-full bg-(--primary-soft) px-3 py-1 text-[10px] font-black text-primary transition-colors duration-300 lg:text-xs">
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

      {/* Traffic Flow — full width */}
      <div className="mb-7 overflow-hidden rounded-4xl border border-slate-200 bg-white p-4 shadow-sm md:p-7">
        <div className="mb-5">
          <h2 className="border-l-4 border-primary pl-3 font-serif text-3xl font-bold text-slate-950 transition-colors duration-300">
            Traffic Flow
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Today&apos;s ready vehicle movement
          </p>
        </div>

        <TrafficFlowChart data={trafficData} />
      </div>

      {/* Recent Activity — full width */}
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-950">
            <Clock className="h-5 w-5 text-primary transition-colors duration-300" />
            Recent Activity
          </h2>

          <button
            type="button"
            onClick={() => setReloadPageData(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--primary-light) bg-(--primary-soft) px-4 py-2 text-xs font-bold text-primary
            transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)]
            focus:outline-none focus:ring-2 focus:ring-(--primary-light) focus:ring-offset-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-16 text-center">
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
          <div className="grid divide-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className={`group flex items-center gap-3 px-6 py-5 transition-colors duration-200 hover:bg-(--primary-soft)
                  ${index > 0 ? "border-t sm:border-t-0 sm:border-l border-slate-200" : ""}
                  ${index >= 2 ? "lg:border-t-0 lg:border-l" : ""}
                  ${index >= 1 ? "sm:border-l" : ""}
                `}
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

                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatTime(ticket.lastUpdated || ticket.createdDateTime)}{" "}
                    · {formatDate(ticket.lastUpdated || ticket.createdDateTime)}{" "}
                    ·{" "}
                    <span className="font-bold capitalize text-slate-500">
                      {ticket.firstName || ticket.lastName
                        ? `${ticket.firstName || ""} ${
                            ticket.lastName || ""
                          }`.trim()
                        : "Guest"}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openTicket(ticket)}
                  aria-label={`Open ticket ${
                    ticket.ticketNumber || ticket.id
                  }`}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-all duration-200
                  hover:bg-white hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
