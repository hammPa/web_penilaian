import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const sanitizeSheetName = (name) => String(name).replace(/^Tim\b/i, 'TIM');

export const rekapNilaiPdf = ({
  reportData,
  sessions,
  selectedSessionId,
  tables,
  criteria,
  teams,
  showToast
}) => {
  if (reportData.length === 0) {
    if (showToast) showToast('Tidak ada data untuk diekspor', 'error');
    return;
  }

  // =========================================================================
  // 1. SORTING TABEL & KRITERIA (Merapikan Urutan Kolom)
  // =========================================================================
  const sessionTables = tables.filter(t => t.sessionId === selectedSessionId);
  // Urutkan Tabel secara natural (Tabel 1, Tabel 2, ... Tabel 10)
  sessionTables.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
  
  const tableList = sessionTables.map(t => ({ id: t.id, name: t.name }));
  const criteriaByTable = {};
  
  sessionTables.forEach(t => {
    const tableCriteria = criteria.filter(c => c.tableId === t.id);
    // Urutkan Kriteria di dalam masing-masing tabel
    tableCriteria.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
    criteriaByTable[t.id] = tableCriteria;
  });

  if (tableList.length === 0) {
    if (showToast) showToast('Belum ada kriteria penilaian di sesi ini.', 'warning');
    return;
  }

  const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || '-';

  // =========================================================================
  // 2. SORTING GRUP (Merapikan Urutan Baris)
  // =========================================================================
  // Clone array reportData lalu urutkan berdasarkan Nama Grup
  const sortedReportData = [...reportData].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
  );

  const MAX_ASSESSORS = sortedReportData.reduce(
    (max, g) => Math.max(max, Array.isArray(g.assessors) ? g.assessors.length : 0),
    1
  );

  const criteriaColumns = [];
  sessionTables.forEach((t, tIdx) => {
    criteriaByTable[t.id].forEach((c, cIdx) => {
      criteriaColumns.push({
        tableName: t.name,
        criteriaName: c.name,
        code: `K${tIdx + 1}.${cIdx + 1}`
      });
    });
  });

  // =========================================================================
  // 3. SORTING TIM (Merapikan Urutan Halaman Detail Tim)
  // =========================================================================
  const teamIdsInReport = [];
  sortedReportData.forEach(g => {
    if (g.teamId && !teamIdsInReport.includes(g.teamId)) teamIdsInReport.push(g.teamId);
  });
  
  // Urutkan ID Tim berdasarkan Nama Tim (Tim 1, Tim 2, dst)
  teamIdsInReport.sort((idA, idB) => {
    const teamA = teams.find(t => t.id === idA)?.name || '';
    const teamB = teams.find(t => t.id === idB)?.name || '';
    return teamA.localeCompare(teamB, undefined, { numeric: true });
  });

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const margin = 10;

  const addTitle = (title, subtitle) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, margin, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitle, margin, 20);
    doc.setTextColor(0);
  };

  const tableTheme = {
    headStyles: { fillColor: [23, 32, 58], textColor: 255, fontSize: 8, halign: 'center', valign: 'middle' },
    bodyStyles: { fontSize: 8, valign: 'middle', lineColor: [220, 220, 220], lineWidth: 0.1 },
    styles: { cellPadding: 2, overflow: 'linebreak' },
    margin: { left: margin, right: margin }
  };

  const groupBoundaryHooks = {
    didParseCell: (data) => {
      if (data.section === 'body') {
        const groupIndex = Math.floor(data.row.index / MAX_ASSESSORS);
        data.cell.styles.fillColor = groupIndex % 2 === 0 ? [255, 255, 255] : [245, 248, 252];
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index > 0) {
        const isFirstRowInGroup = data.row.index % MAX_ASSESSORS === 0;
        if (isFirstRowInGroup) {
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.6);
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        }
      }
    }
  };

  // =========================================================================
  // HALAMAN 1: REKAP NILAI (BOBOT)
  // =========================================================================
  addTitle('Rekap Nilai (Bobot)', `Sesi: ${sessionName}`);

  const rekapHead = [['Nama Grup', 'Gugus', 'Tim', 'Nama Penilai', ...tableList.map(t => t.name), 'Total Nilai', 'Rata-Rata']];
  const rekapBody = [];

  // Gunakan sortedReportData agar baris terurut (Grup 1, Grup 2, ...)
  sortedReportData.forEach(group => {
    const teamName = sanitizeSheetName(teams.find(t => t.id === group.teamId)?.name || '-');
    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      let row = [];

      if (s === 0) {
        row.push(
          { content: group.name, rowSpan: MAX_ASSESSORS, styles: { halign: 'left', valign: 'middle' } },
          { content: group.gugus || '-', rowSpan: MAX_ASSESSORS, styles: { halign: 'center', valign: 'middle' } },
          { content: teamName, rowSpan: MAX_ASSESSORS, styles: { halign: 'left', valign: 'middle' } },
          assessor ? assessor.name : '-'
        );
      } else {
        row.push(assessor ? assessor.name : '-');
      }

      tableList.forEach(t => {
        if (!assessor) { row.push(''); return; }
        const sum = assessor.perCriteria
          .filter(pc => pc.tableName === t.name)
          .reduce((acc, pc) => acc + Number(pc.score || 0), 0);
        row.push({ content: sum.toFixed(2), styles: { halign: 'center' } });
      });

      row.push({ content: assessor ? Number(assessor.score).toFixed(2) : '', styles: { halign: 'center' } });

      if (s === 0) {
        row.push({ 
          content: String(group.average), 
          rowSpan: MAX_ASSESSORS, 
          styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } 
        });
      }

      rekapBody.push(row);
    }
  });

  autoTable(doc, {
    head: rekapHead,
    body: rekapBody,
    startY: 25,
    ...tableTheme,
    ...groupBoundaryHooks,
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 22 }, 2: { cellWidth: 20 }, 3: { cellWidth: 28 } }
  });

  // =========================================================================
  // HALAMAN BARU: REKAP KRITERIA
  // =========================================================================
  doc.addPage();
  addTitle('Rekap Kriteria', `Sesi: ${sessionName}`);

  const rkHead = [['Nama Grup', 'Tim', 'Nama Penilai', ...criteriaColumns.map(c => c.code)]];
  const rkBody = [];

  sortedReportData.forEach(group => {
    const teamName = sanitizeSheetName(teams.find(t => t.id === group.teamId)?.name || '-');
    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      let row = [];

      if (s === 0) {
        row.push(
          { content: group.name, rowSpan: MAX_ASSESSORS, styles: { valign: 'middle' } },
          { content: teamName, rowSpan: MAX_ASSESSORS, styles: { valign: 'middle' } },
          assessor ? assessor.name : '-'
        );
      } else {
        row.push(assessor ? assessor.name : '-');
      }

      if (!assessor) {
        criteriaColumns.forEach(() => row.push(''));
      } else {
        const map = {};
        assessor.perCriteria.forEach(pc => { map[`${pc.tableName}||${pc.criteriaName}`] = pc.score; });
        criteriaColumns.forEach(col => {
          const key = `${col.tableName}||${col.criteriaName}`;
          row.push({ 
            content: map[key] !== undefined ? Number(map[key]).toFixed(2) : '0.00',
            styles: { halign: 'center' } 
          });
        });
      }
      rkBody.push(row);
    }
  });

  autoTable(doc, {
    head: rkHead,
    body: rkBody,
    startY: 25,
    ...tableTheme,
    ...groupBoundaryHooks,
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 22 }, 2: { cellWidth: 28 } }
  });

  doc.addPage();
  addTitle('Keterangan Kode Kriteria', `Sesi: ${sessionName}`);
  autoTable(doc, {
    head: [['Kode', 'Tabel', 'Kriteria']],
    body: criteriaColumns.map(c => [c.code, c.tableName, c.criteriaName]),
    startY: 25,
    ...tableTheme,
    alternateRowStyles: { fillColor: [245, 246, 248] },
    columnStyles: { 0: { cellWidth: 20 } }
  });

  // =========================================================================
  // HALAMAN BARU PER TIM: DETAIL PENILAIAN
  // =========================================================================
  teamIdsInReport.forEach((teamId, teamIndex) => {
    const team = teams.find(t => t.id === teamId);
    const teamLabel = sanitizeSheetName(team?.name || `TIM ${teamIndex + 1}`);
    const teamGroups = sortedReportData.filter(g => g.teamId === teamId);

    doc.addPage();
    addTitle(`Detail Penilaian - Tim: ${teamLabel}`, `Sesi: ${sessionName}`);

    const dHead = [['Nama Grup', 'Penilai', ...tableList.map(t => t.name), 'Total']];
    const dBody = [];

    teamGroups.forEach(group => {
      for (let s = 0; s < MAX_ASSESSORS; s++) {
        const assessor = group.assessors[s];
        let row = [];

        if (s === 0) {
          row.push(
            { content: group.name, rowSpan: MAX_ASSESSORS, styles: { valign: 'middle' } },
            assessor ? assessor.name : '-'
          );
        } else {
          row.push(assessor ? assessor.name : '-');
        }

        tableList.forEach(t => {
          if (!assessor) { row.push(''); return; }
          const sum = assessor.perCriteria
            .filter(pc => pc.tableName === t.name)
            .reduce((acc, pc) => acc + Number(pc.score || 0), 0);
          row.push({ content: sum.toFixed(2), styles: { halign: 'center' } });
        });
        
        row.push({ content: assessor ? Number(assessor.score).toFixed(2) : '', styles: { halign: 'center' } });
        dBody.push(row);
      }
    });

    autoTable(doc, {
      head: dHead,
      body: dBody,
      startY: 25,
      ...tableTheme,
      ...groupBoundaryHooks,
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 32 } }
    });

    const recBody = teamGroups
      .map(group => {
        const rekomendasiText = (group.assessors || [])
          .filter(a => a && a.recommendation && a.recommendation.trim() !== '')
          .map(a => `${a.name}: ${a.recommendation.trim()}`)
          .join('\n');
        return rekomendasiText ? [group.name, group.gugus, rekomendasiText] : null;
      })
      .filter(Boolean);

    if (recBody.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 25;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Rekomendasi', margin, finalY + 10);

      autoTable(doc, {
        head: [['Nama Grup', 'Gugus', 'Rekomendasi']],
        body: recBody,
        startY: finalY + 14,
        ...tableTheme,
        alternateRowStyles: { fillColor: [245, 246, 248] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 } }
      });
    }
  });

  doc.save(`Rekapitulasi_Nilai_${new Date().toISOString().split('T')[0]}.pdf`);
};