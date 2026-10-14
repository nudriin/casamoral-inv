/**
 * Pure client/shared utility for formatting and downloading CSV files
 * with UTF-8 BOM encoding for seamless Microsoft Excel compatibility.
 */

export function formatCSVWithBOM(rows: (string | number)[][]): string {
  const BOM = "\uFEFF";
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    )
    .join("\r\n");

  return BOM + csvContent;
}

/**
 * Triggers an immediate browser file download of CSV data
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
