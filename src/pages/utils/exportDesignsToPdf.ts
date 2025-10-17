import jsPDF from "jspdf";

/**
 * Exports Design data (not requests) to a formatted PDF with summary and pagination
 * @param data - Array of design records
 * @param fileName - Output file name (default: Design_Report)
 */
export const exportDesignReportToPDF = (data: any[], fileName = "Design_Report") => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let currentY = 50;

    // 🏢 Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TechShirt", margin, currentY);

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Design Report", margin, currentY + 20);

    // 🗓️ Date & Summary Line
    currentY += 45;
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated: ${currentDate} | Total Designs: ${data.length}`, margin, currentY);

    // 📊 Summary counts
    const approvedCount = data.filter((r) => r.status?.toLowerCase() === "approved").length;
    const revisionCount = data.filter((r) => r.status?.toLowerCase() === "revision").length;
    const draftCount = data.filter((r) => r.status?.toLowerCase() === "draft").length;

    doc.text(
      `Approved: ${approvedCount} | Revision: ${revisionCount} | Draft: ${draftCount}`,
      pageWidth - 310,
      currentY
    );

    // 🧱 Table Header
    currentY += 40;
    const rowHeight = 25;
    const colWidths = [40, 150, 180, 120, 120, 100];
    const colPositions = [margin];
    for (let i = 0; i < colWidths.length - 1; i++) {
      colPositions.push(colPositions[i] + colWidths[i]);
    }

    const headers = ["#", "Client", "Designer",  "Status", "Date"];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    headers.forEach((header, i) => doc.text(header, colPositions[i] + 5, currentY));
    currentY += 5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // 📋 Table Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.forEach((item, index) => {
      if (currentY + rowHeight > pageHeight - 60) {
        // New page
        doc.addPage();
        currentY = 50;
        doc.setFont("helvetica", "bold");
        headers.forEach((header, i) => doc.text(header, colPositions[i] + 5, currentY));
        currentY += 20;
        doc.setFont("helvetica", "normal");
      }

      const rowData = [
        (index + 1).toString(),
        item.client ?? "N/A",
        item.designer ?? "N/A",
        item.status ?? "N/A",
        item.createdAt ?? "N/A",
      ];

      const maxLengths = [3, 18, 18, 25, 15, 12];
      rowData.forEach((cell, i) => {
        let text = cell.toString();
        if (text.length > maxLengths[i]) text = text.substring(0, maxLengths[i] - 3) + "...";
        doc.text(text, colPositions[i] + 5, currentY);
      });

      currentY += rowHeight;
    });

    // 📈 Summary Section
    currentY += 30;
    if (currentY + 80 > pageHeight - 60) {
      doc.addPage();
      currentY = 50;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Summary", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    currentY += 20;

    doc.text(`Total Designs: ${data.length}`, margin, currentY);
    currentY += 15;
    doc.text(`Approved Designs: ${approvedCount}`, margin, currentY);
    currentY += 15;
    doc.text(`Revisions: ${revisionCount}`, margin, currentY);
    currentY += 15;
    doc.text(`Draft Designs: ${draftCount}`, margin, currentY);

    // 📆 Report Period
    if (data.length > 0) {
      const dates = data
        .map((r) => new Date(r.createdAt))
        .sort((a, b) => a.getTime() - b.getTime());
      const startDate = dates[0].toLocaleDateString();
      const endDate = dates[dates.length - 1].toLocaleDateString();
      currentY += 15;
      doc.text(`Report Period: ${startDate} to ${endDate}`, margin, currentY);
    }

    // 🦶 Footer (pagination)
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 80, pageHeight - 20);
      doc.text("TechShirt Management System", margin, pageHeight - 20);
    }

    // 💾 Save file
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    doc.save(`${fileName}_${timestamp}.pdf`);
    alert("Design Report PDF exported successfully!");
  } catch (err) {
    console.error("PDF export failed:", err);
    alert(`Failed to export Design Report PDF: ${(err as Error).message}`);
  }
};
