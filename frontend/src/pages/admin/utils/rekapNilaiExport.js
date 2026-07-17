import * as XLSX from 'xlsx';

// Fungsi bantuan untuk mengubah index kolom (0, 1, 2) menjadi huruf kolom Excel (A, B, C... AA, AB)
const getExcelColName = (index) => {
  let colName = '';
  let dividend = index + 1;
  let modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    colName = String.fromCharCode(65 + modulo) + colName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return colName;
};

export const rekapNilai = ({
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

  const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || '-';

  // 1. Kumpulkan struktur Tabel -> Kriteria
  const sessionTables = tables.filter(t => t.sessionId === selectedSessionId);
  const criteriaColumns = [];
  sessionTables.forEach(t => {
    const tableCriteria = criteria.filter(c => c.tableId === t.id);
    tableCriteria.forEach(c => {
      criteriaColumns.push({ tableId: t.id, tableName: t.name, criteriaId: c.id, criteriaName: c.name });
    });
  });
  
  const totalCriteria = criteriaColumns.length;
  if (totalCriteria === 0) {
    if (showToast) showToast('Belum ada kriteria penilaian di sesi ini.', 'warning');
    return;
  }

  const MAX_ASSESSORS = 3;
  const blockWidth = 1 + totalCriteria + 1; // Nama Penilai + tiap kriteria + Total

  // 2. Bangun 2 baris header
  const totalCols = 3 + MAX_ASSESSORS * blockWidth + 1; 
  const headerRow0 = new Array(totalCols).fill('');
  const headerRow1 = new Array(totalCols).fill('');

  headerRow0[0] = 'Nama Grup';
  headerRow0[1] = 'Gugus';
  headerRow0[2] = 'Tim';

  const merges = [];
  [0, 1, 2].forEach(c => merges.push({ s: { r: 0, c }, e: { r: 1, c } }));

  for (let s = 0; s < MAX_ASSESSORS; s++) {
    const baseCol = 3 + s * blockWidth;

    headerRow0[baseCol] = `Nama Penilai ${s + 1}`;
    merges.push({ s: { r: 0, c: baseCol }, e: { r: 1, c: baseCol } });

    let colCursor = baseCol + 1;
    let i = 0;
    while (i < criteriaColumns.length) {
      const tableName = criteriaColumns[i].tableName;
      let span = 0;
      while (i < criteriaColumns.length && criteriaColumns[i].tableName === tableName) {
        headerRow1[colCursor + span] = criteriaColumns[i].criteriaName;
        span++;
        i++;
      }
      headerRow0[colCursor] = tableName;
      if (span > 1) {
        merges.push({ s: { r: 0, c: colCursor }, e: { r: 0, c: colCursor + span - 1 } });
      }
      colCursor += span;
    }

    const totalCol = baseCol + 1 + totalCriteria;
    headerRow0[totalCol] = `Total Penilai ${s + 1}`;
    merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });
  }

  const avgCol = totalCols - 1;
  headerRow0[avgCol] = 'Rata-Rata Akhir';
  merges.push({ s: { r: 0, c: avgCol }, e: { r: 1, c: avgCol } });

  // 3. Bangun baris data dan Maukkan Rumus Excel
  const dataRows = reportData.map((group, rowIndex) => {
    // Karena ada 2 baris header (index 0 dan 1), baris data Excel dimulai dari baris ke-3.
    const excelRowNumber = rowIndex + 3; 

    const teamName = teams.find(t => t.id === group.teamId)?.name || '-';
    const row = new Array(totalCols).fill('');
    row[0] = group.name;
    row[1] = group.gugus;
    row[2] = teamName;

    // Untuk menyimpan cell (huruf+angka) mana saja yang diisi untuk rumus AVERAGE
    const totalCellsRef = []; 

    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const baseCol = 3 + s * blockWidth;
      const assessor = group.assessors[s];

      if (!assessor) {
        row[baseCol] = '-';
        for (let k = 0; k < totalCriteria; k++) row[baseCol + 1 + k] = null; // Kosongkan
        row[baseCol + 1 + totalCriteria] = null;
        continue;
      }

      row[baseCol] = assessor.name;

      const criteriaScoreMap = {};
      assessor.perCriteria.forEach(pc => {
        criteriaScoreMap[`${pc.tableName}||${pc.criteriaName}`] = pc.score;
      });

      // Masukkan nilai Kriteria (Tanpa toFixed agar terbaca sebagai Number di Excel)
      criteriaColumns.forEach((col, k) => {
        const key = `${col.tableName}||${col.criteriaName}`;
        const score = criteriaScoreMap[key];
        row[baseCol + 1 + k] = score !== undefined ? Number(score) : 0;
      });

      // === GENERATE RUMUS SUM ===
      const startLetter = getExcelColName(baseCol + 1);
      const endLetter = getExcelColName(baseCol + totalCriteria);
      const totalColIndex = baseCol + 1 + totalCriteria;
      
      // Syntax Excel: { t: 'n', f: 'SUM(D3:F3)' }
      row[totalColIndex] = {
        t: 'n', // Type = Number
        f: `SUM(${startLetter}${excelRowNumber}:${endLetter}${excelRowNumber})`
      };

      // Simpan alamat sel Total (Contoh: "G3") untuk dipakai di rumus AVERAGE nanti
      totalCellsRef.push(`${getExcelColName(totalColIndex)}${excelRowNumber}`);
    }

    // === GENERATE RUMUS AVERAGE ===
    if (totalCellsRef.length > 0) {
      // Syntax Excel: AVERAGE(G3, K3, O3)
      row[avgCol] = {
        t: 'n',
        f: `AVERAGE(${totalCellsRef.join(', ')})`
      };
    } else {
      row[avgCol] = 0;
    }

    return row;
  });

  const rows = [headerRow0, headerRow1, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;

  // Lebar kolom
  const colWidths = [{ wch: 20 }, { wch: 12 }, { wch: 16 }];
  for (let s = 0; s < MAX_ASSESSORS; s++) {
    colWidths.push({ wch: 18 }); 
    for (let k = 0; k < totalCriteria; k++) colWidths.push({ wch: 12 });
    colWidths.push({ wch: 14 }); 
  }
  colWidths.push({ wch: 16 });
  ws['!cols'] = colWidths;

  ws['!freeze'] = { xSplit: 3, ySplit: 2 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${sessionName}`.slice(0, 31));

  XLSX.writeFile(wb, `Rekapitulasi_Nilai_${new Date().toISOString().split('T')[0]}.xlsx`);
};