// Generates an award certificate as a landscape A4 PDF (BRD 12.5, AI089). jsPDF loads on demand.

const PINK = [239, 28, 97];
const NAVY = [3, 11, 96];
const BLUE = [79, 107, 237];
const MUTED = [107, 104, 128];

const pdfText = (v) => String(v ?? "").replace(/–/g, "-").replace(/·/g, "-");

export const certificateHeading = (type) => (type === "innovation" ? "OF INNOVATION" : type === "team" ? "OF TEAM EXCELLENCE" : "OF ACHIEVEMENT");

export async function downloadCertificate({ instituteName, award, recipientName, recipientDetail, awardedOn, certificateNo, note }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  // Paper and borders
  doc.setFillColor(255, 250, 252);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(...PINK);
  doc.setLineWidth(2.4);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, W - 26, H - 26);
  // Corner accents
  doc.setFillColor(...BLUE);
  [[13, 13], [W - 13, 13], [13, H - 13], [W - 13, H - 13]].forEach(([x, y]) => doc.circle(x, y, 1.6, "F"));

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(pdfText(instituteName).toUpperCase(), cx, 32, { align: "center", charSpace: 1 });

  doc.setTextColor(...PINK);
  doc.setFontSize(36);
  doc.text("CERTIFICATE", cx, 55, { align: "center", charSpace: 3 });
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(certificateHeading(award.type), cx, 65, { align: "center", charSpace: 2 });

  doc.setTextColor(...MUTED);
  doc.setFontSize(12);
  doc.text("This certificate is proudly presented to", cx, 84, { align: "center" });

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(pdfText(recipientName), cx, 102, { align: "center" });
  doc.setDrawColor(...PINK);
  doc.setLineWidth(0.6);
  doc.line(cx - 70, 106, cx + 70, 106);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(10.5);
  if (recipientDetail) doc.text(pdfText(recipientDetail), cx, 113, { align: "center" });

  doc.setTextColor(30, 30, 50);
  doc.setFontSize(13);
  doc.text("in recognition of receiving the", cx, 126, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(17);
  doc.text(pdfText(award.name), cx, 136, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MUTED);
  doc.setFontSize(10.5);
  const reason = note || award.description;
  doc.splitTextToSize(pdfText(reason), 170).slice(0, 2).forEach((line, i) => doc.text(line, cx, 145 + i * 5.5, { align: "center" }));

  // Seal
  doc.setFillColor(...PINK);
  doc.circle(cx, 172, 11, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.circle(cx, 172, 8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("AWARD", cx, 173.2, { align: "center" });

  // Signatures and details
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(40, 176, 105, 176);
  doc.line(W - 105, 176, W - 40, 176);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  doc.text("Principal", 72.5, 182, { align: "center" });
  doc.text("Innovation Coordinator", W - 72.5, 182, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Awarded ${new Date(awardedOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 20, H - 18);
  doc.text(`Certificate no. ${certificateNo}`, W - 20, H - 18, { align: "right" });

  const name = `${certificateNo}-${recipientName}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${name}.pdf`);
  return `${name}.pdf`;
}
