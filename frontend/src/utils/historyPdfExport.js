import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Set default text color ke hitam pekat
  doc.setTextColor(0, 0, 0);

  // 1. MENGURUTKAN DATA (Sorting Numerik/Alfabet)
  sections.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
  sections.forEach(sec => {
    sec.criteria.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
  });

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
      doc.setTextColor(0, 0, 0); // Reset color after page break
    }
  };

  // =====================================================================
  // HEADER
  // =====================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LAPORAN HASIL PENILAIAN', margin, y);
  
  // Garis Bawah Header
  doc.setLineWidth(0.6);
  doc.setDrawColor(23, 32, 58);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Informasi Meta dalam bentuk grid teks 2 Kolom
  const leftColX = margin;
  const rightColX = pageWidth / 2;

  doc.text(`Sesi: ${sessionName || '-'}`, leftColX, y);
  doc.text(`Penilai: ${assessorName || '-'}`, rightColX, y);
  y += 6;
  doc.text(`Grup: ${groupName || '-'}`, leftColX, y);
  doc.text(`Tanggal: ${new Date(createdAt).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })}`, rightColX, y);
  y += 6;
  doc.text(`Tim: ${teamName || '-'}`, leftColX, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Keseluruhan: ${Number(total).toFixed(2)}`, rightColX, y);
  y += 12;

  // =====================================================================
  // FOTO DOKUMENTASI
  // =====================================================================
  if (photos && photos.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
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

  // =====================================================================
  // REKOMENDASI
  // =====================================================================
  if (recommendation && recommendation.trim() !== '') {
    checkPageBreak(20);
    autoTable(doc, {
      head: [['Rekomendasi / Catatan']],
      body: [[recommendation]],
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [23, 32, 58], textColor: 255, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // =====================================================================
  // DETAIL PENILAIAN (Tabel Per Seksi/Table)
  // =====================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Detail Penilaian', margin, y);
  y += 6;

  sections.forEach((section, index) => {
    // Memaksa section ke-2 dan seterusnya untuk mulai di halaman baru
    if (index > 0) {
      doc.addPage();
      y = margin;
    } else {
      checkPageBreak(30); // Cek ketersediaan ruang untuk section pertama
    }

    // Judul Section/Tabel
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Tabel: ${section.name}`, margin, y + 2);
    
    const head = [['Kriteria', 'Variabel Penilaian', 'Pilihan Level', 'Skor']];
    const body = [];

    section.criteria.forEach((crit) => {
      crit.items.forEach((item, itemIndex) => {
        const itemScoreStr = Number(item.score).toFixed(2);
        if (itemIndex === 0) {
          body.push([
            { content: crit.name, rowSpan: crit.items.length, styles: { valign: 'middle', fontStyle: 'bold', textColor: [0, 0, 0] } },
            item.name,
            item.levelText,
            { content: itemScoreStr, styles: { halign: 'center', fontStyle: 'bold' } }
          ]);
        } else {
          body.push([
            item.name,
            item.levelText,
            { content: itemScoreStr, styles: { halign: 'center', fontStyle: 'bold' } }
          ]);
        }
      });
      // Baris Tambahan untuk Subtotal Kriteria
      body.push([
        { content: `Subtotal ${crit.name}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 235, 245], textColor: [0, 0, 0] } },
        { content: Number(crit.subtotal).toFixed(2), styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 235, 245], textColor: [0, 0, 0] } }
      ]);
    });

    autoTable(doc, {
      head,
      body,
      startY: y + 5,
      theme: 'grid',
      headStyles: { fillColor: [23, 32, 58], textColor: 255, halign: 'center', fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, valign: 'middle', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  // =====================================================================
  // REKAP NILAI (Dipaksa masuk ke Halaman Baru agar rapi)
  // =====================================================================
  doc.addPage();
  y = margin;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Rekapitulasi Nilai Akhir', margin, y);
  y += 5;

  const rekapHead = [['No', 'Tabel', 'Kriteria', 'Subtotal', 'Total Tabel']];
  const rekapBody = [];
  let tableNo = 1;

  sections.forEach((sec) => {
    const rowCount = sec.criteria.length;
    const totalTable = sec.criteria.reduce((sum, crit) => sum + Number(crit.subtotal), 0);

    sec.criteria.forEach((crit, idx) => {
      let row = [];
      if (idx === 0) {
        row.push({ content: String(tableNo), rowSpan: rowCount, styles: { halign: 'center', valign: 'middle', textColor: [0, 0, 0] } });
        row.push({ content: sec.name, rowSpan: rowCount, styles: { valign: 'middle', fontStyle: 'bold', textColor: [0, 0, 0] } });
        row.push(crit.name);
        row.push({ content: Number(crit.subtotal).toFixed(2), styles: { halign: 'center' } });
        row.push({ content: totalTable.toFixed(2), rowSpan: rowCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: [0, 0, 0] } });
        tableNo++;
      } else {
        row.push(crit.name);
        row.push({ content: Number(crit.subtotal).toFixed(2), styles: { halign: 'center' } });
      }
      rekapBody.push(row);
    });
  });

  // Tambahkan baris Total Keseluruhan paling bawah
  rekapBody.push([
    { content: 'TOTAL NILAI KESELURUHAN', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [200, 147, 62], textColor: 255 } },
    { content: Number(total).toFixed(2), styles: { halign: 'center', fontStyle: 'bold', fillColor: [200, 147, 62], textColor: 255 } }
  ]);

  autoTable(doc, {
    head: rekapHead,
    body: rekapBody,
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [23, 32, 58], textColor: 255, halign: 'center', fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [0, 0, 0] }, 
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 45 },
      2: { cellWidth: 65 },
      3: { cellWidth: 25 },
      4: { cellWidth: 33 }
    },
    // Blok didDrawCell telah dihapus di sini agar autoTable mengurus garis murni secara otomatis
    margin: { left: margin, right: margin }
  });

  doc.save(fileName);
}

// ---------- HALAMAN USER & MODAL ADMIN (Tetap Sama) ----------
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