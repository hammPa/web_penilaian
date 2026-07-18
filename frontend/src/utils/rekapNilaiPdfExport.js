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

  const sessionTables = tables.filter(t => t.sessionId === selectedSessionId);
  const tableList = sessionTables.map(t => ({ id: t.id, name: t.name }));
  const criteriaByTable = {};
  sessionTables.forEach(t => {
    criteriaByTable[t.id] = criteria.filter(c => c.tableId === t.id);
  });

  if (tableList.length === 0) {
    if (showToast) showToast('Belum ada kriteria penilaian di sesi ini.', 'warning');
    return;
  }

  const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || '-';

  const MAX_ASSESSORS = reportData.reduce(
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

  const teamIdsInReport = [];
  reportData.forEach(g => {
    if (g.teamId && !teamIdsInReport.includes(g.teamId)) teamIdsInReport.push(g.teamId);
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
    headStyles: { fillColor: [23, 32, 58], textColor: 255, fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, valign: 'middle' },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    styles: { cellPadding: 2, overflow: 'linebreak' },
    margin: { left: margin, right: margin }
  };

  // =========================================================================
  // HALAMAN 1: REKAP NILAI (BOBOT)
  // =========================================================================
  addTitle('Rekap Nilai (Bobot)', `Sesi: ${sessionName}`);

  const rekapHead = [['Nama Grup', 'Gugus', 'Tim', 'Nama Penilai', ...tableList.map(t => t.name), 'Total Nilai', 'Rata-Rata']];
  const rekapBody = [];

  reportData.forEach(group => {
    const teamName = sanitizeSheetName(teams.find(t => t.id === group.teamId)?.name || '-');
    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      const row = [
        s === 0 ? group.name : '',
        s === 0 ? group.gugus : '',
        s === 0 ? teamName : '',
        assessor ? assessor.name : ''
      ];
      tableList.forEach(t => {
        if (!assessor) { row.push(''); return; }
        const sum = assessor.perCriteria
          .filter(pc => pc.tableName === t.name)
          .reduce((acc, pc) => acc + Number(pc.score || 0), 0);
        row.push(sum.toFixed(2));
      });
      row.push(assessor ? Number(assessor.score).toFixed(2) : '');
      row.push(s === 0 ? group.average : '');
      rekapBody.push(row);
    }
  });

  autoTable(doc, {
    head: rekapHead,
    body: rekapBody,
    startY: 25,
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 22 }, 2: { cellWidth: 20 }, 3: { cellWidth: 28 } }
  });

  // =========================================================================
  // HALAMAN BARU: REKAP KRITERIA
  // =========================================================================
  doc.addPage();
  addTitle('Rekap Kriteria', `Sesi: ${sessionName}`);

  const rkHead = [['Nama Grup', 'Tim', 'Nama Penilai', ...criteriaColumns.map(c => c.code)]];
  const rkBody = [];

  reportData.forEach(group => {
    const teamName = sanitizeSheetName(teams.find(t => t.id === group.teamId)?.name || '-');
    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      const row = [s === 0 ? group.name : '', s === 0 ? teamName : '', assessor ? assessor.name : ''];

      if (!assessor) {
        criteriaColumns.forEach(() => row.push(''));
      } else {
        const map = {};
        assessor.perCriteria.forEach(pc => { map[`${pc.tableName}||${pc.criteriaName}`] = pc.score; });
        criteriaColumns.forEach(col => {
          const key = `${col.tableName}||${col.criteriaName}`;
          row.push(map[key] !== undefined ? Number(map[key]).toFixed(2) : '0.00');
        });
      }
      rkBody.push(row);
    }
  });

  // Catatan kode kriteria (legenda) di bawah judul, karena kolom cuma muat kode
  autoTable(doc, {
    head: rkHead,
    body: rkBody,
    startY: 25,
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 22 }, 2: { cellWidth: 28 } },
    didDrawPage: (data) => {
      // Legenda kode kriteria full name, di halaman terakhir tabel ini
    }
  });

  // Halaman legenda kode -> nama kriteria
  doc.addPage();
  addTitle('Keterangan Kode Kriteria', `Sesi: ${sessionName}`);
  autoTable(doc, {
    head: [['Kode', 'Tabel', 'Kriteria']],
    body: criteriaColumns.map(c => [c.code, c.tableName, c.criteriaName]),
    startY: 25,
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 20 } }
  });

  // =========================================================================
  // HALAMAN BARU PER TIM: DETAIL PENILAIAN
  // =========================================================================
  teamIdsInReport.forEach((teamId, teamIndex) => {
    const team = teams.find(t => t.id === teamId);
    const teamLabel = sanitizeSheetName(team?.name || `TIM ${teamIndex + 1}`);
    const teamGroups = reportData.filter(g => g.teamId === teamId);

    doc.addPage();
    addTitle(`Detail Penilaian - Tim: ${teamLabel}`, `Sesi: ${sessionName}`);

    const dHead = [['Nama Grup', 'Penilai', ...tableList.map(t => t.name), 'Total']];
    const dBody = [];

    teamGroups.forEach(group => {
      for (let s = 0; s < MAX_ASSESSORS; s++) {
        const assessor = group.assessors[s];
        const row = [s === 0 ? group.name : '', assessor ? assessor.name : ''];

        tableList.forEach(t => {
          if (!assessor) { row.push(''); return; }
          const sum = assessor.perCriteria
            .filter(pc => pc.tableName === t.name)
            .reduce((acc, pc) => acc + Number(pc.score || 0), 0);
          row.push(sum.toFixed(2));
        });
        row.push(assessor ? Number(assessor.score).toFixed(2) : '');
        dBody.push(row);
      }
    });

    autoTable(doc, {
      head: dHead,
      body: dBody,
      startY: 25,
      ...tableTheme,
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 32 } }
    });

    // Rekomendasi per tim (kalau ada)
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
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 } }
      });
    }
  });

  doc.save(`Rekapitulasi_Nilai_${new Date().toISOString().split('T')[0]}.pdf`);
};