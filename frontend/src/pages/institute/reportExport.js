// PDF and Excel export for the Reports page (AI086, AI087). Both libraries load on demand.

const PINK = [239, 28, 97];
const NAVY = [3, 11, 96];
const INK = [20, 17, 43];
const MUTED = [107, 104, 128];
const LINE = [233, 232, 243];
const HEAD_FILL = [241, 244, 255];

// Local calendar date (toISOString would give the UTC date, which is a day off late at night in IST).
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fileStem = (instituteName, filters) =>
  `${instituteName} report ${filters.classLabel} ${localDate(filters.generatedAt)}`
    .replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

// The built-in PDF fonts only cover Latin-1, so swap the few typographic characters we use.
const pdfText = (v) => String(v ?? "").replace(/–/g, "-").replace(/→/g, "->");

export async function exportReportPdf({ instituteName, filters, kpis, tables }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = 0;

  // Header band
  doc.setFillColor(...PINK);
  doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(pdfText(instituteName), M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(pdfText(`Institution report  ·  ${filters.rangeLabel}  ·  ${filters.classLabel}`), M, 23);
  doc.setFontSize(9);
  doc.text(`Generated ${filters.generatedAt.toLocaleString("en-IN")}`, M, 29);
  y = 44;

  // KPI boxes
  const boxW = (W - M * 2 - 9) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (boxW + 3);
    doc.setDrawColor(...LINE);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, boxW, 24, 2, 2, "FD");
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(pdfText(k.label), x + 4, y + 7);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(pdfText(k.value), x + 4, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(pdfText(k.note), boxW - 8)[0], x + 4, y + 21);
  });
  y += 34;

  const newPage = () => {
    doc.addPage();
    y = M + 4;
  };

  tables.forEach((t) => {
    const rowH = 7;
    if (y + 20 > H - M) newPage();
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(pdfText(t.title), M, y);
    y += 4;

    // Column widths: the first column (labels) takes the slack.
    const usable = W - M * 2;
    const numW = Math.min(30, usable / (t.columns.length + 1));
    const widths = t.columns.map((_, i) => (i === 0 ? usable - numW * (t.columns.length - 1) : numW));
    const drawHeader = () => {
      doc.setFillColor(...HEAD_FILL);
      doc.rect(M, y, usable, rowH, "F");
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      let x = M;
      t.columns.forEach((c, i) => {
        const text = doc.splitTextToSize(pdfText(c), widths[i] - 3)[0];
        doc.text(text, i === 0 ? x + 2 : x + widths[i] - 2, y + 4.8, { align: i === 0 ? "left" : "right" });
        x += widths[i];
      });
      y += rowH;
    };
    drawHeader();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    t.rows.forEach((row) => {
      if (y + rowH > H - M) {
        newPage();
        drawHeader();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
      }
      doc.setTextColor(...INK);
      let x = M;
      row.forEach((cell, i) => {
        const text = doc.splitTextToSize(pdfText(cell), widths[i] - 3)[0];
        doc.text(text, i === 0 ? x + 2 : x + widths[i] - 2, y + 4.8, { align: i === 0 ? "left" : "right" });
        x += widths[i];
      });
      doc.setDrawColor(...LINE);
      doc.line(M, y + rowH, M + usable, y + rowH);
      y += rowH;
    });
    y += 10;
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(pdfText(`${instituteName} · Institution report`), M, H - 6);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 6, { align: "right" });
  }

  const name = `${fileStem(instituteName, filters)}.pdf`;
  doc.save(name);
  return name;
}

// Excel sheet names: max 31 characters, none of : \ / ? * [ ]
const sheetName = (title) => title.replace(/[:\\/?*[\]]/g, " ").slice(0, 31);

export async function exportReportExcel({ instituteName, filters, kpis, tables }) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const bold = (value) => ({ value, fontWeight: "bold" });

  const summary = [
    [bold(instituteName)],
    ["Institution report"],
    ["Period", filters.rangeLabel],
    ["Class", filters.classLabel],
    ["Generated", filters.generatedAt.toLocaleString("en-IN")],
    [null],
    [bold("Measure"), bold("Value"), bold("Notes")],
    ...kpis.map((k) => [k.label, k.value, k.note]),
  ];

  const sheets = [
    { sheet: "Summary", data: summary, columns: [{ width: 28 }, { width: 18 }, { width: 44 }] },
    ...tables.map((t) => ({
      sheet: sheetName(t.title),
      data: [t.columns.map(bold), ...t.rows.map((row) => row.map((cell) => (cell === "—" ? null : cell)))],
      columns: t.columns.map((_, i) => ({ width: i === 0 ? 44 : 18 })),
    })),
  ];

  const name = `${fileStem(instituteName, filters)}.xlsx`;
  await writeExcelFile(sheets).toFile(name);
  return name;
}
