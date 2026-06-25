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
  
  export type TrafficPoint = {
    label: string;
    received: number;
    ready: number;
  };

export function TrafficFlowChart({
  data,
  period,
}: {
  data: TrafficPoint[];
  period: TrafficPeriod;
}) {
  const formatChartLabel = (label: string) => {
    if (period === "week") return label;

    const [hourString, minuteString = "0"] = label.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (Number.isNaN(hour)) return label;

    return new Date(2025, 0, 1, hour, minute).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.received, item.ready)),
    1
  );

  const width = 900;
  const height = 280;
  const top = 35;
  const bottom = 230;
  const left = 45;
  const right = 855;

  const points = data.map((item, index) => {
    const x = left + (index / Math.max(data.length - 1, 1)) * (right - left);

    return {
      ...item,
      formattedLabel: formatChartLabel(item.label),
      x,
      receivedY: bottom - (item.received / maxValue) * (bottom - top),
      readyY: bottom - (item.ready / maxValue) * (bottom - top),
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

  const receivedAreaPath = `${receivedLinePath} L ${right} ${bottom} L ${left} ${bottom} Z`;
  const readyAreaPath = `${readyLinePath} L ${right} ${bottom} L ${left} ${bottom} Z`;

  return (
    <div className="relative h-72 overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-b from-white to-amber-50/25">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-[11px] font-black text-amber-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Received
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[11px] font-black text-emerald-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Ready
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="receivedFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d6a800" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#d6a800" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="readyFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.84 0 1 0 0 0.57 0 0 1 0 0 0 0 0 0.35 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.06 0 1 0 0 0.72 0 0 1 0 0.5 0 0 0 0.25 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

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
        ))}

        <path d={receivedAreaPath} fill="url(#receivedFill)" />
        <path d={readyAreaPath} fill="url(#readyFill)" />

        <path
          d={receivedLinePath}
          fill="none"
          stroke="#c99a00"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#goldGlow)"
        />

        <path
          d={readyLinePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#greenGlow)"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.receivedY} r="6" fill="#d6a800" />
            <circle cx={point.x} cy={point.receivedY} r="3" fill="#ffffff" />

            <circle cx={point.x} cy={point.readyY} r="6" fill="#10b981" />
            <circle cx={point.x} cy={point.readyY} r="3" fill="#ffffff" />

            <text
              x={point.x}
              y="262"
              textAnchor="middle"
              className="fill-slate-500 text-[16px] font-bold"
            >
              {point.formattedLabel}
            </text>

            <text
              x={point.x}
              y={Math.min(point.receivedY, point.readyY) - 16}
              textAnchor="middle"
              className="fill-slate-700 text-[16px] font-black"
            >
              {point.received}/{point.ready}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ActionCard({
  icon,
  title,
  text,
  active = false,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  active?: boolean;
  link?: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(link || "/")}
      type="button"
      className={`group flex min-h-44 cursor-pointer flex-col items-start rounded-4xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 ${
        active
          ? "border-amber-500 bg-amber-500 text-white shadow-amber-200"
          : "border-slate-200 bg-white text-slate-950 hover:border-amber-200"
      }`}
    >
      <div
        className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${
          active ? "bg-white text-amber-600" : "bg-amber-50 text-amber-600"
        }`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-extrabold">{title}</h3>

      <p className={`mt-2 text-sm ${active ? "text-white" : "text-slate-600"}`}>
        {text}
      </p>

      <div
        className={`ml-auto mt-auto flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-white/20" : "bg-slate-100"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}

export function formatTime(date?: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
