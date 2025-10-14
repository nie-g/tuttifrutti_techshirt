import jsPDF from "jspdf";

/**
 * Exports data to a formatted PDF document with summary.
 * @param data - Array of orders
 * @param fileName - Output file name (without extension)
 */
export const exportToPDF = (data: any[], fileName: string) => {
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

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TechShirt", margin, currentY);

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Orders Report", margin, currentY + 20);

    currentY += 45;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${currentDate} | Total Orders: ${data.length}`, margin, currentY);

    // Totals
    const totalAmount = data.reduce((sum, order) => {
      const amount = parseFloat(order.amount.replace(/[₱,]/g, "")) || 0;
      return sum + amount;
    }, 0);

    doc.text(
      `Total Revenue: PHP ${totalAmount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      })}`,
      pageWidth - 220,
      currentY
    );

    // Table Header
    currentY += 40;
    const rowHeight = 25;
    const colWidths = [40, 160, 160, 120, 100, 90];
    const colPositions = [margin];

    for (let i = 0; i < colWidths.length - 1; i++) {
      colPositions.push(colPositions[i] + colWidths[i]);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headers = ["No.", "Client", "Designer", "Amount", "Date", "Status"];

    headers.forEach((header, i) => doc.text(header, colPositions[i] + 5, currentY));
    currentY += 5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Table Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.forEach((order, index) => {
      if (currentY + rowHeight > pageHeight - 60) {
        doc.addPage();
        currentY = 50;
        doc.setFont("helvetica", "bold");
        headers.forEach((header, i) => doc.text(header, colPositions[i] + 5, currentY));
        currentY += 20;
        doc.setFont("helvetica", "normal");
      }

      const formatCurrency = (amount: string) => {
        const numericAmount = parseFloat(amount.replace(/[₱,PHP]/g, "")) || 0;
        return `PHP ${numericAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
      };

      const rowData = [
        (index + 1).toString(),
        order.client ?? "N/A",
        order.designer ?? "N/A",
        formatCurrency(order.amount ?? "0"),
        order.date ?? "N/A",
        order.status ?? "N/A",
      ];

      rowData.forEach((cell, i) => {
        let text = cell.toString();
        const maxLengths = [3, 22, 22, 16, 12, 10];
        if (text.length > maxLengths[i]) text = text.substring(0, maxLengths[i] - 3) + "...";
        doc.text(text, colPositions[i] + 5, currentY);
      });

      currentY += rowHeight;
    });

    // Summary Section
    currentY += 30;
    if (currentY + 80 > pageHeight - 60) {
      doc.addPage();
      currentY = 50;
    }

    const avgAmount = data.length > 0 ? totalAmount / data.length : 0;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Summary", margin, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    currentY += 20;
    doc.text(`Total Orders: ${data.length}`, margin, currentY);
    currentY += 15;
    doc.text(
      `Total Revenue: PHP ${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      margin,
      currentY
    );
    currentY += 15;
    doc.text(
      `Average Order Value: PHP ${avgAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      margin,
      currentY
    );

    // Report Period
    if (data.length > 0) {
      const dates = data.map((o) => new Date(o.date)).sort((a, b) => a.getTime() - b.getTime());
      const startDate = dates[0].toLocaleDateString();
      const endDate = dates[dates.length - 1].toLocaleDateString();
      currentY += 15;
      doc.text(`Report Period: ${startDate} to ${endDate}`, margin, currentY);
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 80, pageHeight - 20);
      doc.text("TechShirt Management System", margin, pageHeight - 20);
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    doc.save(`${fileName}_${timestamp}.pdf`);
    alert("PDF exported successfully!");
  } catch (err) {
    console.error("PDF export failed:", err);
    alert(`Failed to export PDF: ${(err as Error).message}`);
  }
};
