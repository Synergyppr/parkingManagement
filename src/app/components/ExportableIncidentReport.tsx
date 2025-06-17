// import React, { useRef } from "react";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import FullIncidentReport from "./FullIncidentReport"; // adjust path if needed

// interface Props {
//   labelsMap: Record<string, string[]>;
//   isLabelChecked: (label: string) => boolean;
//   descriptions: Record<string, string>;
//   title: string;
// }

// const ExportableIncidentReport: React.FC<Props> = (props) => {
//   const reportRef = useRef<HTMLDivElement>(null);

//   const handleExportPDF = async () => {
//     if (!reportRef.current) return;

//     const canvas = await html2canvas(reportRef.current, {
//       scale: 2,
//       useCORS: true,
//     });

//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "pt",
//       format: "a4",
//     });

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();
//     const imgWidth = pageWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     let y = 0;

//     if (imgHeight < pageHeight) {
//       pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
//     } else {
//       // Handle multi-page
//       let heightLeft = imgHeight;
//       while (heightLeft > 0) {
//         pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
//         heightLeft -= pageHeight;
//         y -= pageHeight;
//         if (heightLeft > 0) pdf.addPage();
//       }
//     }

//     pdf.save("incident-report.pdf");
//   };

//   return (
//     <div>
//       <button
//         onClick={handleExportPDF}
//         className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
//       >
//         Export PDF
//       </button>

//       <div ref={reportRef} className="bg-white p-4">
//         <FullIncidentReport {...props} />
//       </div>
//     </div>
//   );
// };

// export default ExportableIncidentReport;
