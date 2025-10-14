import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

/**
 * Exports data to Excel (.xlsx)
 * @param data - Array of objects
 * @param fileName - Desired output file name (without extension)
 */
export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${fileName}.xlsx`);
};
