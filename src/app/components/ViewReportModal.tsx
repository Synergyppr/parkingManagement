"use client";
import React, { useRef } from "react";

import Modal from "./Modal";
import FullIncidentReport from "./FullIncidentReport";

type LabelMaps = Record<string, Record<string, string[]>>;

const ViewReportModal = ({
  isOpen,
  onClose,
  allLabelMaps,
  descriptions,
  incidentParts,
}: {
  isOpen: boolean;
  onClose: () => void;
  allLabelMaps: LabelMaps;
  descriptions: Record<string, string>;
  incidentParts: string[];
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const isLabelChecked = (
    label: string,
    labelsMap: Record<string, string[]>
  ) => {
    const ids = labelsMap[label];
    return ids?.some((id) => incidentParts.includes(id));
  };

  // const handleExportPDF = async () => {
  //   if (!reportRef.current) return;

  //   reportRef.current?.classList.add("html2canvas-export");
  //   await new Promise((r) => setTimeout(r, 100));
  //   const canvas = await html2canvas(reportRef.current, { scale: 2 });
  //   reportRef.current?.classList.remove("html2canvas-export");

  //   reportRef.current.classList.remove("html2canvas-export");

  //   const imgData = canvas.toDataURL("image/png");

  //   const pdf = new jsPDF({
  //     orientation: "portrait",
  //     unit: "pt",
  //     format: "a4",
  //   });

  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();
  //   const imgWidth = pageWidth;
  //   const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //   if (imgHeight < pageHeight) {
  //     pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  //   } else {
  //     let position = 0;
  //     let heightLeft = imgHeight;

  //     while (heightLeft > 0) {
  //       pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //       position -= pageHeight;
  //       if (heightLeft > 0) pdf.addPage();
  //     }
  //   }

  //   pdf.save("incident-report.pdf");
  // };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto p-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Full Incident Report
        </h2>
        <p className="text-xs mb-4 text-gray-700">
          Before attempting to submit the report, make sure to provide a
          description for every part marked as damaged.
        </p>
        {/* <button
          type="button"
          onClick={handleExportPDF}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export PDF
        </button> */}

        <div ref={reportRef}>
          <FullIncidentReport
            title="Front View"
            labelsMap={allLabelMaps.frontView}
            isLabelChecked={(label) =>
              isLabelChecked(label, allLabelMaps.frontView)
            }
            descriptions={descriptions}
          />
          <FullIncidentReport
            title="Rear View"
            labelsMap={allLabelMaps.rearView}
            isLabelChecked={(label) =>
              isLabelChecked(label, allLabelMaps.rearView)
            }
            descriptions={descriptions}
          />
          <FullIncidentReport
            title="Passenger Side"
            labelsMap={allLabelMaps.passengerView}
            isLabelChecked={(label) =>
              isLabelChecked(label, allLabelMaps.passengerView)
            }
            descriptions={descriptions}
          />
          <FullIncidentReport
            title="Driver Side"
            labelsMap={allLabelMaps.driverView}
            isLabelChecked={(label) =>
              isLabelChecked(label, allLabelMaps.driverView)
            }
            descriptions={descriptions}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ViewReportModal;
