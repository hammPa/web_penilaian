import jsPDF from 'jspdf';

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Gagal mengambil gambar');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------- CORE RENDERER (dipakai bersama) ----------
async function renderAssessmentPdf({
  createdAt, total, photos, baseUrl, sections, fileName,
  sessionName, groupName, teamName, assessorName, recommendation
}) {
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
  doc.text('Hasil Penilaian', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Sesi: ${sessionName || '-'}`, margin, y);
  y += 5;
  doc.text(`Grup: ${groupName || '-'}     Tim: ${teamName || '-'}`, margin, y);
  y += 5;
  doc.text(`Penilai: ${assessorName || '-'}`, margin, y);
  y += 5;
  doc.text(
    `Tanggal: ${new Date(createdAt).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`,
    margin, y
  );
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Nilai: ${Number(total).toFixed(2)}`, margin, y);
  y += 10;

  // Foto dokumentasi
  if (photos && photos.length > 0) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Foto Dokumentasi', margin, y);
    y += 6;

    const imgSize = 40;
    let x = margin;
    for (const photoUrl of photos) {
      try {
        const base64 = await urlToBase64(`${baseUrl}${photoUrl}`);
        if (x + imgSize > pageWidth - margin) {
          x = margin;
          y += imgSize + 5;
        }
        checkPageBreak(imgSize + 5);
        doc.addImage(base64, 'JPEG', x, y, imgSize, imgSize);
        x += imgSize + 5;
      } catch (e) {
        console.error('Gagal memuat foto untuk PDF', e);
      }
    }
    y += imgSize + 10;
  }

  if (recommendation && recommendation.trim() !== '') {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Rekomendasi', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const wrappedRekomendasi = doc.splitTextToSize(recommendation, pageWidth - margin * 2);
    checkPageBreak(wrappedRekomendasi.length * 4 + 4);
    doc.text(wrappedRekomendasi, margin, y);
    y += wrappedRekomendasi.length * 4 + 8;
  }

  // Detail per tabel & kriteria
  sections.forEach(({ name: tableName, criteria: criteriaList }) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(tableName, margin, y);
    y += 7;

    criteriaList.forEach(({ name: criteriaName, subtotal, items }) => {
      const subtotalText = `Subtotal: ${Number(subtotal).toFixed(2)}`;
      const subtotalWidth = doc.getTextWidth(subtotalText) + 2;
      const nameMaxWidth = pageWidth - margin * 2 - subtotalWidth - 5; // sisakan jarak utk subtotal

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const wrappedName = doc.splitTextToSize(criteriaName, nameMaxWidth);

      checkPageBreak(wrappedName.length * 5 + 3);
      doc.text(wrappedName, margin, y);
      // Subtotal ditaruh sejajar baris pertama nama kriteria, rata kanan
      doc.text(subtotalText, pageWidth - margin - subtotalWidth + 2, y);

      y += wrappedName.length * 5 + 3;

      items.forEach(({ name, levelText, score }) => {
        checkPageBreak(12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const wrappedLabel = doc.splitTextToSize(name, pageWidth - margin * 2 - 20);
        doc.text(wrappedLabel, margin + 3, y);
        doc.text(Number(score).toFixed(2), pageWidth - margin - 12, y);
        y += wrappedLabel.length * 4;

        doc.setTextColor(110);
        const wrappedLevel = doc.splitTextToSize(levelText, pageWidth - margin * 2 - 20);
        doc.text(wrappedLevel, margin + 3, y);
        doc.setTextColor(0);
        y += wrappedLevel.length * 4 + 3;
      });

      y += 4;
    });
  });

  // Tabel Rekap Kriteria & Subtotal
  checkPageBreak(20);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Rekap Nilai', margin, y);
  y += 7;

  const colWidths = { no: 12, table: 45, kriteria: 78, subtotal: 30 };
  const tableWidth = colWidths.no + colWidths.table + colWidths.kriteria + colWidths.subtotal;
  const rowHeight = 8;

  const drawTableHeader = () => {
    checkPageBreak(rowHeight + 2);
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

  const drawTableRow = (rowNumber, tableName, criteriaName, subtotalValue, isEven) => {
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
    doc.text(Number(subtotalValue).toFixed(2), cx + 2, y + rowHeight / 2 + 1.5);

    y += rowHeight;
  };

  drawTableHeader();

  let rowNumber = 1;
  sections.forEach(({ name: tableName, criteria: criteriaList }) => {
    criteriaList.forEach(({ name: criteriaName, subtotal }) => {
      drawTableRow(rowNumber, tableName, criteriaName, subtotal, rowNumber % 2 === 0);
      rowNumber++;
    });
  });

  checkPageBreak(rowHeight + 2);
  doc.setFillColor(200, 147, 62);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y, tableWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total', margin + colWidths.no + colWidths.table + 2, y + rowHeight / 2 + 1.5);
  doc.text(Number(total).toFixed(2), margin + colWidths.no + colWidths.table + colWidths.kriteria + 2, y + rowHeight / 2 + 1.5);
  doc.setTextColor(0, 0, 0);

  doc.save(fileName);
}

// ---------- HALAMAN USER (AssessmentResult.jsx) ----------
export async function userHistoryPdfExport({ assessment, variables, criteria, tables, baseUrl }) {
  const variableMap = {};
  variables.forEach(v => { variableMap[v.id] = v; });
  const criteriaMap = {};
  criteria.forEach(c => { criteriaMap[c.id] = c; });

  const selectionMap = {};
  assessment.selections.forEach(s => { selectionMap[s.variableId] = s.selectedLevel; });

  const subtotalCriteriaIds = Object.keys(assessment.results.subtotals);
  const groupedTables = tables
    .map(t => ({ table: t, criteriaIds: subtotalCriteriaIds.filter(cid => criteriaMap[cid]?.tableId === t.id) }))
    .filter(g => g.criteriaIds.length > 0);
  const orphanCriteriaIds = subtotalCriteriaIds.filter(
    cid => !criteriaMap[cid] || !tables.some(t => t.id === criteriaMap[cid].tableId)
  );

  const buildCriteriaList = (criteriaIds, fallbackName) => criteriaIds.map(criteriaId => {
    const crit = criteriaMap[criteriaId] || { name: criteriaId };
    const subtotal = assessment.results.subtotals[criteriaId];
    const varIds = variables.filter(v => v.criteriaId === criteriaId).map(v => v.id);
    const items = varIds.map(vid => {
      const variable = variableMap[vid];
      const score = assessment.results.variableScores[vid] || 0;
      const selectedLevel = selectionMap[vid];
      const levelList = variable?.variables || variable?.levels;
      const levelDescription = selectedLevel !== undefined ? (levelList?.[selectedLevel]?.description || null) : null;
      const levelText = selectedLevel !== undefined
        ? `Level ${selectedLevel}${levelDescription ? ' (' + levelDescription + ')' : ''}`
        : 'Tidak dipilih';
      return { name: variable?.name || vid, levelText, score };
    });
    return { name: crit.name, subtotal, items };
  });

  const sections = groupedTables.map(({ table, criteriaIds }) => ({
    name: table.name,
    criteria: buildCriteriaList(criteriaIds)
  }));

  if (orphanCriteriaIds.length > 0) {
    sections.push({ name: 'Lainnya', criteria: buildCriteriaList(orphanCriteriaIds) });
  }

  await renderAssessmentPdf({
    createdAt: assessment.createdAt,
    total: assessment.results.total,
    photos: assessment.photos,
    baseUrl,
    sections,
    fileName: `Hasil-Penilaian-${assessment.id}.pdf`,
    sessionName: assessment.sessionName,
    groupName: assessment.groupName,
    teamName: assessment.teamName,
    assessorName: assessment.name,
    recommendation: assessment.recommendation
  });
}

// ---------- MODAL ADMIN (AdminAssessments.jsx) ----------
export async function adminAssessmentPdfExport({ item, tableMap, criteriaMap, variableMap, baseUrl }) {
  const { subtotals = {}, total = 0, details = [] } = item.results || {};

  const byCriteria = {};
  details.forEach(d => {
    const variable = variableMap[d.variableId];
    const criteriaId = variable?.criteriaId || 'unknown';
    if (!byCriteria[criteriaId]) byCriteria[criteriaId] = [];
    byCriteria[criteriaId].push({ ...d, variable });
  });

  const byTable = {};
  Object.entries(byCriteria).forEach(([criteriaId, items]) => {
    const tableId = criteriaMap[criteriaId]?.tableId || 'unknown';
    if (!byTable[tableId]) byTable[tableId] = {};
    byTable[tableId][criteriaId] = items;
  });

  const sections = Object.entries(byTable).map(([tableId, criteriaGroups]) => ({
    name: tableMap[tableId]?.name || 'Tabel tidak diketahui',
    criteria: Object.entries(criteriaGroups).map(([criteriaId, items]) => ({
      name: criteriaMap[criteriaId]?.name || 'Kriteria tidak diketahui',
      subtotal: subtotals[criteriaId] ?? 0,
      items: items.map(d => {
        const levelDesc = d.variable?.levels?.[d.level]?.description;
        return {
          name: d.variable?.name || 'Variabel tidak diketahui',
          levelText: `Level ${d.level}${levelDesc ? ' (' + levelDesc + ')' : ''}`,
          score: d.score
        };
      })
    }))
  }));

  await renderAssessmentPdf({
    createdAt: item.createdAt,
    total,
    photos: item.photos,
    baseUrl,
    sections,
    fileName: `Hasil-Penilaian-${item.name || item.id}.pdf`,
    sessionName: item.sessionName,
    groupName: item.groupName,
    teamName: item.teamName,
    assessorName: item.name,
    recommendation: item.recommendation
  });
}