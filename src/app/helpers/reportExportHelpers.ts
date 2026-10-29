import jsPDF from "jspdf";
import JSZip from "jszip";
import {
  ReportEntry,
  JournalEntry,
  ReportKPIs,
  TipsReportEmployee,
  TipsReportKPIs,
  TipsReportTicket,
} from "../types";
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

interface PdfKpi {
  label: string;
  value: string;
  color: [number, number, number];
}

const drawTitleBar = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  startDate: string,
  endDate: string,
  exportTimestamp: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, MARGIN, 24);

  doc.text(`Exported: ${exportTimestamp}`, pageWidth - MARGIN, 14, {
    align: "right",
  });
  doc.text(`Date Range: ${startDate} to ${endDate}`, pageWidth - MARGIN, 24, {
    align: "right",
  });
};

const drawKpiRow = (doc: jsPDF, kpiData: PdfKpi[], y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const kpiWidth = (pageWidth - MARGIN * 2) / kpiData.length;

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
    doc.setTextColor(...kpiData[i].color);
    doc.text(kpiData[i].value, kx + 8, y + 18);
  }

  return y + 30;
};

const drawHeader = ({
  doc,
  title,
  propertyName,
  startDate,
  endDate,
  exportTimestamp,
  kpis,
}: PdfHeaderParams): number => {
  drawTitleBar(doc, title, propertyName, startDate, endDate, exportTimestamp);

  return drawKpiRow(
    doc,
    [
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
    ],
    44
  );
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

const applyPageFooters = (doc: jsPDF) => {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages);
  }
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

  applyPageFooters(doc);

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

  applyPageFooters(doc);

  doc.save(`transaction-report_${startDate}_${endDate}.pdf`);
};

// ── Tips PDF ───────────────────────────────────────────────────────────────

const TIPS_COLUMNS: TableColumn[] = [
  { header: "TICKET #", width: 35 },
  { header: "DATE", width: 65 },
  { header: "TIP", width: 30 },
];

const TIPS_ROW_HEIGHT = 8;

const getAverageTip = (totalTips: number, count: number) =>
  count > 0 ? totalTips / count : 0;

const formatPrDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    timeZone: PR_TIMEZONE,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const drawTipsHeader = (
  doc: jsPDF,
  propertyName: string,
  startDate: string,
  endDate: string,
  exportTimestamp: string,
  kpis: TipsReportKPIs
): number => {
  drawTitleBar(
    doc,
    "Tips Report",
    propertyName,
    startDate,
    endDate,
    exportTimestamp
  );

  const avgTip = getAverageTip(kpis.totalTips, kpis.transactionsWithTips);

  return drawKpiRow(
    doc,
    [
      {
        label: "TOTAL TIPS",
        value: `$${kpis.totalTips.toFixed(2)}`,
        color: [5, 150, 105],
      },
      {
        label: "EMPLOYEES",
        value: String(kpis.employeesWithTips),
        color: [15, 23, 42],
      },
      {
        label: "TRANSACTIONS",
        value: String(kpis.transactionsWithTips),
        color: [37, 99, 235],
      },
      {
        label: "AVG TIP / TXN",
        value: `$${avgTip.toFixed(2)}`,
        color: [124, 58, 237],
      },
    ],
    44
  );
};

/** Draws the ticket/tip table for one employee, paginating as needed. */
const drawTipsTicketTable = (
  doc: jsPDF,
  tickets: TipsReportTicket[],
  startY: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = drawTableHeader(doc, TIPS_COLUMNS, startY);

  for (let i = 0; i < tickets.length; i++) {
    if (y + TIPS_ROW_HEIGHT > pageHeight - 15) {
      doc.addPage();
      y = 15;
      y = drawTableHeader(doc, TIPS_COLUMNS, y);
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(MARGIN, y, pageWidth - MARGIN * 2, TIPS_ROW_HEIGHT, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + TIPS_ROW_HEIGHT, pageWidth - MARGIN, y + TIPS_ROW_HEIGHT);

    const t = tickets[i];
    let x = MARGIN + 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`#${t.ticketNumber}`, x, y + 5.5);
    x += TIPS_COLUMNS[0].width;

    doc.setFont("helvetica", "normal");
    doc.text(formatPrDateTime(t.date), x, y + 5.5);
    x += TIPS_COLUMNS[1].width;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(`$${t.tip.toFixed(2)}`, x, y + 5.5);

    y += TIPS_ROW_HEIGHT;
  }

  return y;
};

export const exportTipsPdf = (
  employees: TipsReportEmployee[],
  kpis: TipsReportKPIs,
  propertyName: string,
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const exportTimestamp = getExportTimestamp();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = drawTipsHeader(
    doc,
    propertyName,
    startDate,
    endDate,
    exportTimestamp,
    kpis
  );

  const employeeHeaderHeight = 14;

  for (const employee of employees) {
    const avgTip = getAverageTip(employee.totalTips, employee.ticketCount);

    // Check if employee header + at least one row fits on current page
    if (y + employeeHeaderHeight + TIPS_ROW_HEIGHT > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }

    // Employee header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(MARGIN, y, pageWidth - MARGIN * 2, employeeHeaderHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(employee.employeeName, MARGIN + 5, y + 6);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${employee.ticketCount} ticket${employee.ticketCount !== 1 ? "s" : ""}  ·  Avg $${avgTip.toFixed(2)}`,
      MARGIN + 5,
      y + 11.5
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `$${employee.totalTips.toFixed(2)}`,
      pageWidth - MARGIN - 5,
      y + 9,
      { align: "right" }
    );

    y += employeeHeaderHeight;
    y = drawTipsTicketTable(doc, employee.tickets, y);
    y += 6; // spacing between employees
  }

  applyPageFooters(doc);

  doc.save(`tips-report_${startDate}_${endDate}.pdf`);
};

// ── Tips by Employee (ZIP of one PDF per employee) ─────────────────────────

const SIGNATURE_BLOCK_HEIGHT = 40;

/** Total row + signature lines so the printed sheet can be handed to the employee. */
const drawTipsAcknowledgement = (
  doc: jsPDF,
  totalTips: number,
  startY: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = startY;
  if (y + SIGNATURE_BLOCK_HEIGHT > pageHeight - 15) {
    doc.addPage();
    y = 15;
  }

  // Total row
  doc.setFillColor(236, 253, 245);
  doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 10, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL TIPS", MARGIN + 4, y + 6.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`$${totalTips.toFixed(2)}`, pageWidth - MARGIN - 4, y + 6.5, {
    align: "right",
  });

  // Signature lines
  y += 30;
  const lineWidth = 70;
  doc.setDrawColor(148, 163, 184);
  doc.line(MARGIN, y, MARGIN + lineWidth, y);
  doc.line(pageWidth - MARGIN - lineWidth, y, pageWidth - MARGIN, y);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Employee Signature", MARGIN, y + 5);
  doc.text("Date", pageWidth - MARGIN - lineWidth, y + 5);
};

const buildEmployeeTipsPdf = (
  employee: TipsReportEmployee,
  propertyName: string,
  startDate: string,
  endDate: string,
  exportTimestamp: string
): jsPDF => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  drawTitleBar(
    doc,
    employee.employeeName,
    `Tips Statement  ·  ${propertyName}`,
    startDate,
    endDate,
    exportTimestamp
  );

  const highestTip = employee.tickets.reduce(
    (max, t) => Math.max(max, t.tip),
    0
  );

  let y = drawKpiRow(
    doc,
    [
      {
        label: "TOTAL TIPS",
        value: `$${employee.totalTips.toFixed(2)}`,
        color: [5, 150, 105],
      },
      {
        label: "TICKETS",
        value: String(employee.ticketCount),
        color: [15, 23, 42],
      },
      {
        label: "AVG TIP",
        value: `$${getAverageTip(employee.totalTips, employee.ticketCount).toFixed(2)}`,
        color: [124, 58, 237],
      },
      {
        label: "HIGHEST TIP",
        value: `$${highestTip.toFixed(2)}`,
        color: [37, 99, 235],
      },
    ],
    44
  );

  y = drawTipsTicketTable(doc, employee.tickets, y);
  drawTipsAcknowledgement(doc, employee.totalTips, y + 6);
  applyPageFooters(doc);

  return doc;
};

const toSafeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "employee";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportTipsByEmployeeZip = async (
  employees: TipsReportEmployee[],
  propertyName: string,
  startDate: string,
  endDate: string
) => {
  const exportTimestamp = getExportTimestamp();
  const folderName = `tips-by-employee_${toSafeFileName(propertyName)}_${startDate}_${endDate}`;
  const zip = new JSZip();
  const folder = zip.folder(folderName) ?? zip;
  const usedNames = new Map<string, number>();

  for (const employee of employees) {
    const baseName = toSafeFileName(employee.employeeName);
    const occurrence = (usedNames.get(baseName) ?? 0) + 1;
    usedNames.set(baseName, occurrence);
    const fileName =
      occurrence > 1 ? `${baseName}_${occurrence}.pdf` : `${baseName}.pdf`;

    const doc = buildEmployeeTipsPdf(
      employee,
      propertyName,
      startDate,
      endDate,
      exportTimestamp
    );
    folder.file(fileName, doc.output("arraybuffer"));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${folderName}.zip`);
};
