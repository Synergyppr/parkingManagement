"use client";
import React, { useId } from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
export type Ticket = {
  id: string;
  ticketNumber?: string;
  firstName?: string | null;
  lastName?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  status?: string | null;
  createdDateTime?: string | null;
  transactions?: { amount?: number | string }[] | null;
};
export type DashboardData = {
  tickets?: Ticket[];
  readyTickets?: Ticket[];
  statuses?: string[];
};
export type TrafficPeriod = "today" | "week";
export type TrafficPoint = { label: string; received: number; ready: number };
interface TrafficFlowChartProps {
  data: TrafficPoint[];
  period: TrafficPeriod;
}
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  active?: boolean;
  link?: string;
}
export function TrafficFlowChart({ data, period }: TrafficFlowChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const receivedFillId = `received-fill-${gradientId}`;
  const readyFillId = `ready-fill-${gradientId}`;
  const receivedGlowId = `received-glow-${gradientId}`;
  const readyGlowId = `ready-glow-${gradientId}`;
  const formatChartLabel = (label: string) => {
    if (period === "week") {
      return label;
    }
    const [hourString, minuteString = "0"] = label.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return label;
    }
    return new Date(2025, 0, 1, hour, minute).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = Math.max(
    ...safeData.map((item) =>
      Math.max(Number(item.received) || 0, Number(item.ready) || 0)
    ),
    1
  );
  const width = 900;
  const height = 280;
  const top = 35;
  const bottom = 230;
  const left = 45;
  const right = 855;
  const points = safeData.map((item, index) => {
    const x =
      left + (index / Math.max(safeData.length - 1, 1)) * (right - left);
    const received = Number(item.received) || 0;
    const ready = Number(item.ready) || 0;
    return {
      ...item,
      received,
      ready,
      formattedLabel: formatChartLabel(item.label),
      x,
      receivedY: bottom - (received / maxValue) * (bottom - top),
      readyY: bottom - (ready / maxValue) * (bottom - top),
    };
  });
  const receivedLinePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.receivedY}`
    )
    .join(" ");
  const readyLinePath = points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.readyY}`
    )
    .join(" ");
  const receivedAreaPath =
    points.length > 0
      ? `${receivedLinePath} L ${points[points.length - 1].x} ${bottom} L ${
          points[0].x
        } ${bottom} Z`
      : "";
  const readyAreaPath =
    points.length > 0
      ? `${readyLinePath} L ${points[points.length - 1].x} ${bottom} L ${
          points[0].x
        } ${bottom} Z`
      : "";
  return (
    <div className=" relative h-72 overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-b from-white to-(--primary-soft) transition-colors duration-300 ">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <span className=" inline-flex items-center gap-2 rounded-full border border-(--primary-light) bg-white/90 px-3 py-1 text-[11px] font-black text-primary shadow-sm backdrop-blur-sm transition-colors duration-300 ">
          <span className=" h-2 w-2 rounded-full bg-primary transition-colors duration-300 " />{" "}
          Received{" "}
        </span>{" "}
        <span className=" inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[11px] font-black text-emerald-700 shadow-sm backdrop-blur-sm ">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready{" "}
        </span>{" "}
      </div>{" "}
      {points?.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="text-center">
            <div className=" mx-auto mb-3 h-10 w-10 rounded-full bg-(--primary-soft) ring-1 ring-(--primary-light) transition-colors duration-300 " />{" "}
            <p className="text-sm font-bold text-slate-500">
              No traffic data available.{" "}
            </p>
          </div>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
          aria-label={`${
            period === "today" ? "Today's" : "This week's"
          } received and ready vehicle traffic`}
        >
          <defs>
            <linearGradient id={receivedFillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />{" "}
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />{" "}
            </linearGradient>{" "}
            <linearGradient id={readyFillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />{" "}
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />{" "}
            </linearGradient>{" "}
            <filter
              id={receivedGlowId}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor="var(--primary)"
                floodOpacity="0.35"
              />{" "}
            </filter>{" "}
            <filter
              id={readyGlowId}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor="#10b981"
                floodOpacity="0.28"
              />{" "}
            </filter>{" "}
          </defs>{" "}
          {[40, 90, 140, 190, 240].map((y) => (
            <line
              key={y}
              x1="35"
              x2="865"
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 6"
            />
          ))}{" "}
          <path d={receivedAreaPath} fill={`url(#${receivedFillId})`} />{" "}
          <path d={readyAreaPath} fill={`url(#${readyFillId})`} />{" "}
          <path
            d={receivedLinePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${receivedGlowId})`}
            className="transition-colors duration-300"
          />{" "}
          <path
            d={readyLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${readyGlowId})`}
          />{" "}
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {" "}
              <circle
                cx={point.x}
                cy={point.receivedY}
                r="6"
                fill="var(--primary)"
                className="transition-colors duration-300"
              />{" "}
              <circle cx={point.x} cy={point.receivedY} r="3" fill="#ffffff" />{" "}
              <circle cx={point.x} cy={point.readyY} r="6" fill="#10b981" />{" "}
              <circle cx={point.x} cy={point.readyY} r="3" fill="#ffffff" />{" "}
              <text
                x={point.x}
                y="262"
                textAnchor="middle"
                className="fill-slate-500 text-[16px] font-bold"
              >
                {" "}
                {point.formattedLabel}{" "}
              </text>{" "}
              <text
                x={point.x}
                y={Math.max(Math.min(point.receivedY, point.readyY) - 16, 18)}
                textAnchor="middle"
                className="fill-slate-700 text-[16px] font-black"
              >
                {" "}
                {point.received}/{point.ready}{" "}
              </text>{" "}
            </g>
          ))}{" "}
        </svg>
      )}{" "}
    </div>
  );
}
export function ActionCard({
  icon,
  title,
  text,
  active = false,
  link,
}: ActionCardProps) {
  const router = useRouter();
  const handleNavigation = () => {
    router.push(link || "/");
  };
  return (
    <button
      type="button"
      onClick={handleNavigation}
      aria-label={`${title}: ${text}`}
      className={`group flex min-h-44 w-full cursor-pointer flex-col items-start rounded-4xl border p-6 text-left shadow-sm transition-all duration-300 
        hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light) focus-visible:ring-offset-2 ${
          active
            ? ` border-primary bg-primary text-white shadow-[0_18px_40px_color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-secondary`
            : `border-slate-200 bg-white text-slate-950 hover:border-(--primary-light) hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]`
        } `}
    >
      <div
        className={` mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105 ${
          active
            ? `bg-white text-primary shadow-[0_10px_24px_rgba(15,23,42,0.12)]`
            : `bg-(--primary-soft) text-primary ring-1 ring-(--primary-light)`
        } `}
      >
        {icon}{" "}
      </div>{" "}
      <h3 className="text-xl font-extrabold">{title}</h3>{" "}
      <p
        className={` mt-2 text-sm leading-6 ${
          active ? "text-white/85" : "text-slate-600"
        } `}
      >
        {" "}
        {text}{" "}
      </p>
      <div
        className={` ml-auto mt-auto flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1 ${
          active ? "bg-white/20 text-white" : `bg-(--primary-soft) text-primary`
        } `}
      >
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
export function formatTime(date?: string | null) {
  if (!date) {
    return "—";
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }
  return parsedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
export function formatDate(date?: string | null) {
  if (!date) {
    return "—";
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }
  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
