"use client";
import React, { useCallback, useEffect, useId, useRef } from "react";
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
  lastUpdated?: string | null;
  transactions?: { amount?: number | string }[] | null;
};
export type DashboardData = {
  tickets?: Ticket[];
  readyTickets?: Ticket[];
  statuses?: string[];
};
export type TrafficPoint = { label: string; ready: number };
interface TrafficFlowChartProps {
  data: TrafficPoint[];
}

export function TrafficFlowChart({ data }: TrafficFlowChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const readyFillId = `ready-fill-${gradientId}`;
  const readyGlowId = `ready-glow-${gradientId}`;
  const nowHighlightId = `now-highlight-${gradientId}`;
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatChartLabel = (label: string) => {
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
    ...safeData.map((item) => Number(item.ready) || 0),
    1
  );

  const spacing = 120;
  const left = 60;
  const rightPad = 60;
  const width = Math.max(
    900,
    left + (safeData.length - 1) * spacing + rightPad
  );
  const height = 300;
  const top = 35;
  const bottom = 230;
  const right = width - rightPad;

  // Find the current time indicator index
  const now = new Date();
  const currentHour = now.getHours();
  let activeIndex = -1;
  // Each bucket is 2h starting at the label hour; find which bucket the current hour falls into
  activeIndex = safeData.findIndex((item) => {
    const [hourStr] = item.label.split(":");
    const bucketHour = Number(hourStr);
    return currentHour >= bucketHour && currentHour < bucketHour + 2;
  });

  const points = safeData.map((item, index) => {
    const x =
      left + (index / Math.max(safeData.length - 1, 1)) * (right - left);
    const ready = Number(item.ready) || 0;
    return {
      ...item,
      ready,
      formattedLabel: formatChartLabel(item.label),
      x,
      readyY: bottom - (ready / maxValue) * (bottom - top),
      isActive: index === activeIndex,
    };
  });

  // Auto-scroll to center the active point
  const scrollToActive = useCallback(() => {
    const container = scrollRef.current;
    if (!container || activeIndex < 0 || points.length === 0) return;

    const activePoint = points[activeIndex];
    if (!activePoint) return;

    // The SVG uses viewBox coordinates but minWidth matches pixel width
    const svgPixelWidth = width;
    const containerWidth = container.clientWidth;

    // Scale factor: since minWidth = viewBox width, the ratio is 1:1 in pixels
    const scrollTarget = activePoint.x - containerWidth / 2;
    container.scrollLeft = Math.max(
      0,
      Math.min(scrollTarget, svgPixelWidth - containerWidth)
    );
  }, [activeIndex, points, width]);

  useEffect(() => {
    scrollToActive();
  }, [scrollToActive]);

  const readyLinePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.readyY}`
    )
    .join(" ");

  const readyAreaPath =
    points.length > 0
      ? `${readyLinePath} L ${points[points.length - 1].x} ${bottom} L ${
          points[0].x
        } ${bottom} Z`
      : "";

  const nowLabel = "Now";

  return (
    <div
      ref={scrollRef}
      className="relative h-80 overflow-x-auto rounded-3xl border border-slate-200 bg-linear-to-b from-white to-(--primary-soft) transition-colors duration-300"
    >
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[11px] font-black text-emerald-700 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready
        </span>
      </div>

      {points?.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-(--primary-soft) ring-1 ring-(--primary-light) transition-colors duration-300" />
            <p className="text-sm font-bold text-slate-500">
              No traffic data available.
            </p>
          </div>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full"
          style={{ minWidth: `${width}px` }}
          role="img"
          aria-label="Today's ready vehicle traffic"
        >
          <defs>
            <linearGradient id={readyFillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
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
              />
            </filter>
            <radialGradient id={nowHighlightId}>
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          {[40, 90, 140, 190, 240].map((y) => (
            <line
              key={y}
              x1={left - 10}
              x2={right + 10}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 6"
            />
          ))}

          {/* Active time highlight column */}
          {activeIndex >= 0 && points[activeIndex] && (
            <>
              <rect
                x={points[activeIndex].x - spacing / 2}
                y={top - 10}
                width={spacing}
                height={bottom - top + 20}
                rx="14"
                fill={`url(#${nowHighlightId})`}
              />
              <line
                x1={points[activeIndex].x}
                y1={points[activeIndex].readyY}
                x2={points[activeIndex].x}
                y2={bottom + 5}
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.35"
              />
            </>
          )}

          {/* Area + Line */}
          <path d={readyAreaPath} fill={`url(#${readyFillId})`} />
          <path
            d={readyLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${readyGlowId})`}
          />

          {/* Points */}
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {/* Active point: "Now" / "Today" badge below the time label */}
              {point.isActive && (
                <>
                  <rect
                    x={point.x - 28}
                    y={268}
                    width="56"
                    height="22"
                    rx="11"
                    fill="var(--primary)"
                  />
                  <text
                    x={point.x}
                    y={282}
                    textAnchor="middle"
                    className="text-[12px] font-black"
                    fill="#ffffff"
                  >
                    {nowLabel}
                  </text>
                </>
              )}

              {/* Dots */}
              <circle
                cx={point.x}
                cy={point.readyY}
                r={point.isActive ? 9 : 6}
                fill={point.isActive ? "var(--primary)" : "#10b981"}
              />
              <circle
                cx={point.x}
                cy={point.readyY}
                r={point.isActive ? 4 : 3}
                fill="#ffffff"
              />

              {/* Time label */}
              <text
                x={point.x}
                y="262"
                textAnchor="middle"
                className={`text-[16px] font-bold ${
                  point.isActive ? "fill-primary" : "fill-slate-500"
                }`}
                fontWeight={point.isActive ? 900 : 700}
              >
                {point.formattedLabel}
              </text>

              {/* Value label */}
              <text
                x={point.x}
                y={Math.max(point.readyY - 16, 18)}
                textAnchor="middle"
                className={`text-[16px] font-black ${
                  point.isActive ? "fill-primary" : "fill-emerald-700"
                }`}
              >
                {point.ready}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
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
