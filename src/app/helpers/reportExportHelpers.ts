import jsPDF from "jspdf";
import { ReportEntry, JournalEntry, ReportKPIs } from "../types";
import { parseLocationName } from "../lib/clientUtils";

const PR_TIMEZONE = "America/Puerto_Rico";
const MARGIN = 15;

// ── Date Helpers (Puerto Rico timezone) ─────────────────────────────────────

export const getPuertoRicoToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: PR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const getDateOffset = (dateStr: string, days: number) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ── PDF Internals ───────────────────────────────────────────────────────────

const getExportTimestamp = () =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: PR_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());

interface TableColumn {
  header: string;
  width: number;
}

interface PdfHeaderParams {
  doc: jsPDF;
  title: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  exportTimestamp: string;
  kpis: ReportKPIs;
}

const drawHeader = ({
  doc,
  title,
  propertyName,
  startDate,
  endDate,
  exportTimestamp,
  kpis,
}: PdfHeaderParams): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(propertyName, MARGIN, 24);

  doc.text(`Exported: ${exportTimestamp}`, pageWidth - MARGIN, 14, {
    align: "right",
  });
  doc.text(`Date Range: ${startDate} to ${endDate}`, pageWidth - MARGIN, 24, {
    align: "right",
  });

  let y = 44;

  // KPI row
  const kpiWidth = (pageWidth - MARGIN * 2) / 4;
  const kpiData = [
    { label: "TICKETS", value: String(kpis.ticketCount), color: [15, 23, 42] },
    {
      label: "SALES",
      value: `$${kpis.salesAmount.toFixed(2)}`,
      color: [5, 150, 105],
    },
    {
      label: "REFUNDS",
      value: `$${kpis.refundAmount.toFixed(2)}`,
      color: [217, 119, 6],
    },
    {
      label: "VOIDS",
      value: `$${kpis.voidAmount.toFixed(2)}`,
      color: [220, 38, 38],
    },
  ];

  for (let i = 0; i < kpiData.length; i++) {
    const kx = MARGIN + i * kpiWidth;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(kx + 2, y, kpiWidth - 4, 22, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpiData[i].label, kx + 8, y + 9);

    doc.setFontSize(12);
    doc.setTextColor(
      kpiData[i].color[0],
      kpiData[i].color[1],
      kpiData[i].color[2]
    );
    doc.text(kpiData[i].value, kx + 8, y + 18);
  }

  y += 30;
  return y;
};

const drawTableHeader = (
  doc: jsPDF,
  columns: TableColumn[],
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(248, 250, 252);
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 10, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y + 10, pageWidth - MARGIN, y + 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);

  let x = MARGIN + 4;
  for (const col of columns) {
    doc.text(col.header, x, y + 7);
    x += col.width;
  }

  return y + 10;
};

const drawPageFooter = (
  doc: jsPDF,
  pageNum: number,
  totalPages: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 8, {
    align: "center",
  });
};

// ── Tickets PDF ─────────────────────────────────────────────────────────────

export const exportTicketsPdf = (
  tickets: ReportEntry[],
  kpis: ReportKPIs,
  propertyName: string,
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const exportTimestamp = getExportTimestamp();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const columns: TableColumn[] = [
    { header: "TICKET #", width: 28 },
    { header: "PATRON", width: 45 },
    { header: "PLACE", width: 40 },
    { header: "EMPLOYEE", width: 35 },
    { header: "DATE", width: 32 },
  ];

  let y = drawHeader({
    doc,
    title: "Ticket Report",
    propertyName,
    startDate,
    endDate,
    exportTimestamp,
    kpis,
  });

  y = drawTableHeader(doc, columns, y);

  const rowHeight = 8;

  for (let i = 0; i < tickets.length; i++) {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 15;
      y = drawTableHeader(doc, columns, y);
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(MARGIN, y, pageWidth - MARGIN * 2, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + rowHeight, pageWidth - MARGIN, y + rowHeight);

    const t = tickets[i];
    let x = MARGIN + 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`#${t.ticketNumber}`, x, y + 5.5);
    x += columns[0].width;

    doc.setFont("helvetica", "normal");
    doc.text((t.patronName || "—").substring(0, 25), x, y + 5.5);
    x += columns[1].width;

    doc.text((parseLocationName(t.placeToVisit) || "—").substring(0, 22), x, y + 5.5);
    x += columns[2].width;

    doc.text((t.employeeName || "—").substring(0, 20), x, y + 5.5);
    x += columns[3].width;

    doc.setFontSize(7);
    doc.text(t.date || "—", x, y + 5.5);

    y += rowHeight;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages);
  }

  doc.save(`ticket-report_${startDate}_${endDate}.pdf`);
};

// ── Transactions PDF ────────────────────────────────────────────────────────

const TX_LABELS: Record<string, string> = {
  SALE: "Sale",
  REFUND: "Refund",
  VOID: "Void",
  ATH_MOVIL_SALE: "ATH Movil",
};

export const exportTransactionsPdf = (
  journals: JournalEntry[],
  kpis: ReportKPIs,
  propertyName: string,
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const exportTimestamp = getExportTimestamp();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const columns: TableColumn[] = [
    { header: "TYPE", width: 25 },
    { header: "STATUS", width: 25 },
    { header: "AMOUNT", width: 25 },
    { header: "TERMINAL", width: 30 },
    { header: "REFERENCE", width: 25 },
    { header: "DATE", width: 50 },
  ];

  let y = drawHeader({
    doc,
    title: "Transaction Report",
    propertyName,
    startDate,
    endDate,
    exportTimestamp,
    kpis,
  });

  y = drawTableHeader(doc, columns, y);

  const rowHeight = 8;

  for (let i = 0; i < journals.length; i++) {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 15;
      y = drawTableHeader(doc, columns, y);
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(MARGIN, y, pageWidth - MARGIN * 2, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + rowHeight, pageWidth - MARGIN, y + rowHeight);

    const j = journals[i];
    let x = MARGIN + 4;

    // Type — color coded
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    if (j.operationType === "REFUND") {
      doc.setTextColor(217, 119, 6);
    } else if (j.operationType === "VOID") {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(5, 150, 105);
    }
    doc.text(TX_LABELS[j.operationType] || j.operationType, x, y + 5.5);
    x += columns[0].width;

    // Status — color coded
    if (j.paymentStatus === "APPROVED") {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(j.paymentStatus, x, y + 5.5);
    x += columns[1].width;

    // Amount
    doc.setTextColor(15, 23, 42);
    doc.text(`$${j.amount.toFixed(2)}`, x, y + 5.5);
    x += columns[2].width;

    // Terminal
    doc.setFont("helvetica", "normal");
    doc.text(j.terminalId || "—", x, y + 5.5);
    x += columns[3].width;

    // Reference
    doc.text(j.reference || "—", x, y + 5.5);
    x += columns[4].width;

    // Date
    doc.setFontSize(7);
    const dateStr = new Date(j.createdDateTime).toLocaleString("en-US", {
      timeZone: PR_TIMEZONE,
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    doc.text(dateStr, x, y + 5.5);

    y += rowHeight;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages);
  }

  doc.save(`transaction-report_${startDate}_${endDate}.pdf`);
};
