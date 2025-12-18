  // For Report (in ViewReportModal.tsx)
  
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
