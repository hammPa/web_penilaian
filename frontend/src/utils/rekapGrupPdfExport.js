import jsPDF from 'jspdf';

// ---------- EXPORT PDF PER-GRUP (Halaman AssessmentRecap) ----------
export async function groupRecapPdfExport({ group, sessionName }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Rekap Nilai Grup', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Sesi: ${sessionName || '-'}`, margin, y);
  y += 5;
  doc.text(`Grup: ${group.name || '-'}     Gugus: ${group.gugus || '-'}`, margin, y);
  y += 5;
  doc.text(`Tim: ${group.teamName || '-'}`, margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text(`Rata-Rata Nilai: ${group.average}`, margin, y);
  y += 10;

  if (group.assessors.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Belum ada penilaian untuk grup ini.', margin, y);
    doc.save(`Rekap-${group.name || group.id}.pdf`);
    return;
  }

  const colWidths = { no: 12, table: 42, kriteria: 76, score: 25 };
  const tableWidth = colWidths.no + colWidths.table + colWidths.kriteria + colWidths.score;
  const rowHeight = 8;

  const drawHeader = (title) => {
    checkPageBreak(rowHeight + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 6;

    doc.setFillColor(23, 32, 58);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.rect(margin, y, tableWidth, rowHeight, 'F');

    let cx = margin;
    doc.text('No', cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.no;
    doc.text('Tabel', cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.table;
    doc.text('Kriteria', cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.kriteria;
    doc.text('Subtotal', cx + 2, y + rowHeight / 2 + 1.5);

    doc.setTextColor(0, 0, 0);
    y += rowHeight;
  };

  const drawRow = (rowNumber, tableName, criteriaName, score, isEven) => {
    checkPageBreak(rowHeight + 2);
    if (isEven) {
      doc.setFillColor(245, 246, 248);
      doc.rect(margin, y, tableWidth, rowHeight, 'F');
    }
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, y, tableWidth, rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let cx = margin;
    doc.text(String(rowNumber), cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.no;

    const wrappedTable = doc.splitTextToSize(tableName, colWidths.table - 4);
    doc.text(wrappedTable[0] || '', cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.table;

    const wrappedKriteria = doc.splitTextToSize(criteriaName, colWidths.kriteria - 4);
    doc.text(wrappedKriteria[0] || '', cx + 2, y + rowHeight / 2 + 1.5);
    cx += colWidths.kriteria;

    doc.setFont('helvetica', 'bold');
    doc.text(Number(score).toFixed(2), cx + 2, y + rowHeight / 2 + 1.5);

    y += rowHeight;
  };

  // Loop tiap penilai (assessor) dalam grup
  group.assessors.forEach((assessor) => {
    drawHeader(`Penilai: ${assessor.name}  —  Total: ${Number(assessor.score).toFixed(2)}`);

    let rowNumber = 1;
    assessor.perCriteria.forEach((c) => {
      drawRow(rowNumber, c.tableName, c.criteriaName, c.score, rowNumber % 2 === 0);
      rowNumber++;
    });

    y += 8; // jarak antar penilai
  });

  // Ringkasan akhir
  checkPageBreak(rowHeight + 4);
  doc.setFillColor(200, 147, 62);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y, tableWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Rata-Rata Grup', margin + 2, y + rowHeight / 2 + 1.5);
  doc.text(String(group.average), margin + tableWidth - 25, y + rowHeight / 2 + 1.5);
  doc.setTextColor(0, 0, 0);

  doc.save(`Rekap-${group.name || group.id}.pdf`);
}