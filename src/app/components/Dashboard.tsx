import { ChevronRight, Clock, FileText, KeySquare } from "lucide-react";
import { FaCarSide } from "react-icons/fa6";
import {
  ActionCard,
  formatDate,
  formatTime,
  TrafficFlowChart,
  Ticket,
  TrafficPoint,
} from "./elements/DashboardHelpers";

const Dashboard = ({
  propertyName,
  kpis,
  trafficPeriod,
  setTrafficPeriod,
  trafficData,
  recentTickets,
  setReloadPageData,
}: {
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
}) => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-5">
      <div className="mb-8 overflow-hidden rounded-4xl border border-amber-200/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="relative overflow-hidden bg-linear-to-br from-white via-amber-50/70 to-white px-6 py-7 md:px-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-100/40 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-50 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-amber-200 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 shadow-sm">
                Premium Valet Dashboard
              </span>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_14px_32px_rgba(214,168,0,0.28)]">
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
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-6 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-4xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="mb-7 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                {kpi.icon}
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                {kpi.change}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-500">{kpi.label}</p>
            <h3 className="mt-1 text-3xl font-black">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:gap-7 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="max-w-[91.5vw] rounded-4xl border border-slate-200 bg-white p-4 shadow-sm md:p-7">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="border-l-4 border-amber-400 pl-3 font-serif text-3xl font-bold">
                  Traffic Flow
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {trafficPeriod === "today"
                    ? "Today's received vs ready vehicle movement"
                    : "This week's received vs ready vehicle movement"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 p-1 w-37.5">
                <button
                  type="button"
                  onClick={() => setTrafficPeriod("today")}
                  className={`rounded-full px-4 py-2 text-xs font-black transition cursor-pointer ${
                    trafficPeriod === "today"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-700 hover:bg-white"
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setTrafficPeriod("week")}
                  className={`rounded-full px-4 py-2 text-xs font-black transition cursor-pointer ${
                    trafficPeriod === "week"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-700 hover:bg-white"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>

            <TrafficFlowChart data={trafficData} period={trafficPeriod} />
          </div>

          <div className="mt-7 grid max-w-[91.5vw] gap-5 md:grid-cols-2">
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

        <aside className="max-w-[91.5vw] rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
              <Clock className="h-5 w-5 text-amber-600" />
              Recent Activity
            </h2>
          </div>

          <div className="divide-y divide-slate-200 px-5">
            {recentTickets.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-400">
                No recent tickets yet.
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 py-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <FaCarSide />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold leading-tight">
                      {ticket.color} {ticket.make} {ticket.model}
                    </h4>
                    <p className="text-sm text-slate-600">
                      #{ticket.ticketNumber || "—"} ·{" "}
                      <span className="font-bold capitalize text-amber-600">
                        {ticket.status || "received"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {formatTime(ticket?.createdDateTime)}
                    </p>

                    <p className="text-slate-400">
                      {formatDate(ticket?.createdDateTime)}
                    </p>

                    <p className="font-bold capitalize text-slate-700">
                      {ticket?.firstName || ticket?.lastName
                        ? `${ticket.firstName || ""} ${ticket.lastName || ""}`
                        : "Guest"}
                    </p>
                  </div>

                  <ChevronRight
                    onClick={() => {
                      window.location.href = `/check-in?status=${ticket.status}&ticketId=${ticket.id}`;
                    }}
                    className="h-4 w-4 cursor-pointer text-slate-400 hover:text-amber-500"
                  />
                </div>
              ))
            )}
          </div>

          <div className="p-5">
            <button
              type="button"
              onClick={() => setReloadPageData(true)}
              className="h-11 w-full cursor-pointer rounded-xl border-1.5 border-amber-500 bg-amber-50 text-sm font-bold text-amber-700 transition 
            duration-700 hover:bg-amber-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
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
