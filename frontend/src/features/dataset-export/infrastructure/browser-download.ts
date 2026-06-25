export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadBlob(blob, filename);
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  downloadBlob(blob, filename);
}
