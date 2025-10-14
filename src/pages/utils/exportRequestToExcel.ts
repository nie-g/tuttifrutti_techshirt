import * as XLSX from "xlsx";

export const exportRequestToExcel = (data: any[], filename = "Design_Request_Report") => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // 🧩 Prepare worksheet data
  const worksheetData = data.map((item, index) => ({
    "#": index + 1,
    "Client Name": item.client,
    "Design Details": item.description,
    "Status": item.status,
    "Date Requested": item.createdAt,
  }));

  // 📄 Create a new workbook and add the worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Design Requests");

  // ✨ Auto-size columns
  const columnWidths = Object.keys(worksheetData[0]).map((key) => ({
    wch: Math.max(key.length + 2, 15),
  }));
  worksheet["!cols"] = columnWidths;

  // 💾 Export file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
