// import * as XLSX from 'xlsx-js-style';
import * as XLSX from 'xlsx';

// Konfigurasi Style Cell
const styleHeader = {
  font: { bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
};

const styleText = {
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
};

// Fungsi bantuan untuk mengubah index kolom menjadi huruf Excel
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

// Fungsi bantuan untuk membersihkan nama sheet
const sanitizeSheetName = (name) => {
  return String(name).replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
};

// Fungsi bantuan untuk menghitung lebar kolom otomatis
const calculateColWidths = (rows, minWidth = 12) => {
  const colWidths = [];
  rows.forEach((row) => {
    row.forEach((cell, colIdx) => {
      let cellText = '';
      if (cell && typeof cell === 'object') {
        cellText = cell.v !== undefined && cell.v !== null ? String(cell.v) : (cell.f ? '0000000.00' : '');
      } else if (cell !== null && cell !== undefined) {
        cellText = String(cell);
      }
      
      const length = Math.max(cellText.length + 2, minWidth);
      if (!colWidths[colIdx] || length > colWidths[colIdx].wch) {
        colWidths[colIdx] = { wch: length };
      }
    });
  });
  return colWidths;
};

// Helper membuat cell text biasa
const createCell = (val, isHeader = false) => ({
  v: val,
  t: typeof val === 'number' ? 'n' : 's',
  s: isHeader ? styleHeader : styleText
});

// Helper membuat cell angka float 2 desimal
const createFloatCell = (val) => ({
  v: val,
  t: 'n',
  z: '0.00',
  s: styleText
});

// Helper membuat cell rumus float 2 desimal
const createFormulaCell = (formula, bold = false) => ({
  t: 'n',
  f: formula,
  z: '0.00',
  s: bold ? { font: { bold: true }, alignment: { horizontal: 'left', vertical: 'center' } } : styleText
});

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

  const sessionTables = tables.filter(t => t.sessionId === selectedSessionId);
  const tableList = sessionTables.map(t => ({ id: t.id, name: t.name }));
  const criteriaByTable = {};
  sessionTables.forEach(t => {
    criteriaByTable[t.id] = criteria.filter(c => c.tableId === t.id);
  });

  const totalTables = tableList.length;
  if (totalTables === 0) {
    if (showToast) showToast('Belum ada kriteria penilaian di sesi ini.', 'warning');
    return;
  }

  const MAX_ASSESSORS = reportData.reduce(
    (max, g) => Math.max(max, Array.isArray(g.assessors) ? g.assessors.length : 0),
    1
  );

  const wb = XLSX.utils.book_new();

  // Daftar Kriteria untuk Sheet "Rekap Kriteria"
  const criteriaColumns = [];
  sessionTables.forEach((t, tIdx) => {
    criteriaByTable[t.id].forEach((c, cIdx) => {
      criteriaColumns.push({
        tableId: t.id,
        tableName: t.name,
        criteriaName: c.name,
        code: `K${tIdx + 1}.${cIdx + 1}`
      });
    });
  });
  const totalCriteria = criteriaColumns.length;

  const teamIdsInReport = [];
  reportData.forEach(g => {
    if (g.teamId && !teamIdsInReport.includes(g.teamId)) teamIdsInReport.push(g.teamId);
  });

  const groupAssessorLocation = {};

  // =========================================================================
  // BUAT SHEET DETAIL PER TIM (KOLOM TABEL) & SHEET REKOMENDASI
  // =========================================================================
  const COL_GRUP = 0;
  const COL_PENILAI = 1;
  const COL_KODE = 2;
  const COL_TABLE_START = 3;
  const detailTotalCols = COL_TABLE_START + totalTables + 1;
  const detailTotalCol = detailTotalCols - 1;

  const DATA_START_EXCEL_ROW = 3; 

  teamIdsInReport.forEach((teamId, teamIndex) => {
    const team = teams.find(t => t.id === teamId);
    const teamLabel = (team?.name || `TIM ${teamIndex + 1}`).replace(/^Tim\b/i, 'TIM');
    const teamGroups = reportData.filter(g => g.teamId === teamId);
    const teamSheetName = sanitizeSheetName(teamLabel);

    // --- 1. BUILD SHEET PENILAIAN (KOLOM TABEL) ---
    const dTitleRow = new Array(detailTotalCols).fill('');
    dTitleRow[0] = createCell(`Tim: ${teamLabel}`, true);

    const dHeaderRow = new Array(detailTotalCols).fill('');
    dHeaderRow[COL_GRUP] = createCell('Nama Grup', true);
    dHeaderRow[COL_PENILAI] = createCell('Penilai', true);
    dHeaderRow[COL_KODE] = createCell('Kode Penilai', true);
    
    tableList.forEach((t, k) => {
      dHeaderRow[COL_TABLE_START + k] = createCell(t.name, true);
    });
    dHeaderRow[detailTotalCol] = createCell('Total', true);

    const dMerges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: detailTotalCols - 1 } }
    ];

    const dDataRows = [];

    teamGroups.forEach((group) => {
      groupAssessorLocation[group.id] = groupAssessorLocation[group.id] || new Array(MAX_ASSESSORS).fill(null);
      const groupRowStart = dDataRows.length;

      for (let s = 0; s < MAX_ASSESSORS; s++) {
        const assessor = group.assessors[s];
        const excelRowNumber = DATA_START_EXCEL_ROW + dDataRows.length;
        const row = new Array(detailTotalCols).fill('');

        row[COL_GRUP] = createCell(group.name);
        row[COL_KODE] = createCell(`T${teamIndex + 1}.${s + 1}`);

        if (!assessor) {
          row[COL_PENILAI] = createCell(''); 
          for (let k = 0; k < totalTables; k++) row[COL_TABLE_START + k] = createCell(null);
          row[detailTotalCol] = createCell(null);
          dDataRows.push(row);
          continue;
        }

        row[COL_PENILAI] = createCell(assessor.name);

        // Jumlahkan nilai per tabel dari data perCriteria
        tableList.forEach((t, k) => {
          let sumTable = 0;
          assessor.perCriteria.forEach(pc => {
            if (pc.tableName === t.name) {
              sumTable += Number(pc.score || 0);
            }
          });
          row[COL_TABLE_START + k] = createFloatCell(sumTable);
        });

        const startLetter = getExcelColName(COL_TABLE_START);
        const endLetter = getExcelColName(COL_TABLE_START + totalTables - 1);
        
        row[detailTotalCol] = createFormulaCell(`SUM(${startLetter}${excelRowNumber}:${endLetter}${excelRowNumber})`);

        groupAssessorLocation[group.id][s] = {
          sheetName: teamSheetName,
          excelRowNumber,
          totalColLetter: getExcelColName(detailTotalCol)
        };

        dDataRows.push(row);
      }

      const groupRowEnd = dDataRows.length - 1;
      if (groupRowEnd > groupRowStart) {
        const startExcelRow0 = DATA_START_EXCEL_ROW - 1 + groupRowStart;
        const endExcelRow0 = DATA_START_EXCEL_ROW - 1 + groupRowEnd;
        dMerges.push({ s: { r: startExcelRow0, c: COL_GRUP }, e: { r: endExcelRow0, c: COL_GRUP } });
        for (let rr = groupRowStart + 1; rr <= groupRowEnd; rr++) dDataRows[rr][COL_GRUP] = createCell('');
      }
    });

    const dRows = [dTitleRow, dHeaderRow, ...dDataRows];
    const dWs = XLSX.utils.aoa_to_sheet(dRows);
    dWs['!merges'] = dMerges;
    dWs['!cols'] = calculateColWidths(dRows);
    dWs['!freeze'] = { xSplit: 3, ySplit: 2 };

    XLSX.utils.book_append_sheet(wb, dWs, teamSheetName);

    // --- 2. KEMBALIKAN SHEET REKOMENDASI ---
    const rHeaderRow = [
      createCell('Nama Grup', true),
      createCell('Gugus', true),
      createCell('Rekomendasi', true)
    ];
    
    const rDataRows = teamGroups.map(group => {
      const rekomendasiText = (group.assessors || [])
        .filter(a => a && a.recommendation && a.recommendation.trim() !== '')
        .map(a => `${a.name}: ${a.recommendation.trim()}`)
        .join('\n');

      return [
        createCell(group.name),
        createCell(group.gugus),
        createCell(rekomendasiText)
      ];
    });
    
    const rRows = [rHeaderRow, ...rDataRows];
    const rWs = XLSX.utils.aoa_to_sheet(rRows);
    
    rWs['!cols'] = calculateColWidths(rRows, 15);
    rWs['!freeze'] = { xSplit: 0, ySplit: 1 };
    
    XLSX.utils.book_append_sheet(wb, rWs, sanitizeSheetName(`Rekomendasi ${teamLabel}`));
  });

  // =========================================================================
  // SHEET: REKAP KRITERIA
  // =========================================================================
  const rkTotalCols = 3 + totalCriteria; 
  const rkHeader = new Array(rkTotalCols).fill('');
  
  rkHeader[0] = createCell('Nama Unit / Grup', true);
  rkHeader[1] = createCell('TIM PENILAI', true);
  rkHeader[2] = createCell('Nama Penilai', true);
  
  criteriaColumns.forEach((col, k) => {
    rkHeader[3 + k] = createCell(col.code, true);
  });

  const rkDataRows = [];
  const rkMerges = [];
  const RK_DATA_START_ROW = 1; 

  reportData.forEach((group) => {
    const rawTeamName = teams.find(t => t.id === group.teamId)?.name || '';
    const teamName = rawTeamName.replace(/^Tim\b/i, 'TIM');
    const startRowIndex = RK_DATA_START_ROW + rkDataRows.length; 

    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      const row = new Array(rkTotalCols).fill('');

      if (s === 0) {
        row[0] = createCell(group.name);
        row[1] = createCell(teamName);
      } else {
        row[0] = createCell('');
        row[1] = createCell('');
      }

      if (!assessor) {
        row[2] = createCell('');
        for (let k = 0; k < totalCriteria; k++) row[3 + k] = createCell(null);
      } else {
        row[2] = createCell(assessor.name);
        
        const criteriaScoreMap = {};
        assessor.perCriteria.forEach(pc => {
          criteriaScoreMap[`${pc.tableName}||${pc.criteriaName}`] = pc.score;
        });

        // Masukkan data langsung ke Rekap Kriteria
        criteriaColumns.forEach((col, k) => {
          const key = `${col.tableName}||${col.criteriaName}`;
          const score = criteriaScoreMap[key];
          row[3 + k] = createFloatCell(score !== undefined ? Number(score) : 0);
        });
      }
      rkDataRows.push(row);
    }

    if (MAX_ASSESSORS > 1) {
      const endRowIndex = startRowIndex + MAX_ASSESSORS - 1;
      rkMerges.push({ s: { r: startRowIndex, c: 0 }, e: { r: endRowIndex, c: 0 } }); 
      rkMerges.push({ s: { r: startRowIndex, c: 1 }, e: { r: endRowIndex, c: 1 } }); 
    }
  });

  const rkRows = [rkHeader, ...rkDataRows];
  const rkWs = XLSX.utils.aoa_to_sheet(rkRows);
  rkWs['!merges'] = rkMerges;
  rkWs['!cols'] = calculateColWidths(rkRows, 12);
  rkWs['!freeze'] = { xSplit: 3, ySplit: 1 }; 

  const rekapKriteriaSheetName = sanitizeSheetName('Rekap Kriteria');
  XLSX.utils.book_append_sheet(wb, rkWs, rekapKriteriaSheetName);

  // =========================================================================
  // SHEET: REKAP NILAI (BOBOT)
  // =========================================================================
  const rekapTotalCols = 4 + totalTables + 2; 
  
  const rHeaderRow = new Array(rekapTotalCols).fill('');
  rHeaderRow[0] = createCell('Nama Grup', true);
  rHeaderRow[1] = createCell('Gugus', true);
  rHeaderRow[2] = createCell('TIM', true);
  rHeaderRow[3] = createCell('Nama Penilai', true);
  
  tableList.forEach((t, k) => {
    rHeaderRow[4 + k] = createCell(t.name, true);
  });
  rHeaderRow[4 + totalTables] = createCell('Total Nilai', true);
  rHeaderRow[5 + totalTables] = createCell('Rata-Rata Akhir', true);

  const rekapDataRows = [];
  const rekapMerges = [];
  const REKAP_DATA_START_ROW = 1; 

  reportData.forEach((group) => {
    const rawTeamName = teams.find(t => t.id === group.teamId)?.name || '';
    const teamName = rawTeamName.replace(/^Tim\b/i, 'TIM');
    const locs = groupAssessorLocation[group.id];

    const startRowIndex = REKAP_DATA_START_ROW + rekapDataRows.length; 
    const startExcelRow = startRowIndex + 1; 
    
    const totalCellsRef = [];

    for (let s = 0; s < MAX_ASSESSORS; s++) {
      const assessor = group.assessors[s];
      const loc = locs ? locs[s] : null;
      const row = new Array(rekapTotalCols).fill('');

      if (s === 0) {
        row[0] = createCell(group.name);
        row[1] = createCell(group.gugus);
        row[2] = createCell(teamName);
      } else {
        row[0] = createCell('');
        row[1] = createCell('');
        row[2] = createCell('');
      }

      if (!assessor || !loc) {
        row[3] = createCell('');
        for (let k = 0; k < totalTables; k++) row[4 + k] = createCell(null);
        row[4 + totalTables] = createCell(null);
      } else {
        row[3] = createCell(assessor.name);

        tableList.forEach((t, k) => {
          // Menarik referensi D, E, F dst. (COL_TABLE_START = 3 = Col 'D')
          const letter = getExcelColName(COL_TABLE_START + k);
          row[4 + k] = createFormulaCell(`'${loc.sheetName}'!${letter}${loc.excelRowNumber}`);
        });

        const totalColIndex = 4 + totalTables;
        row[totalColIndex] = createFormulaCell(`'${loc.sheetName}'!${loc.totalColLetter}${loc.excelRowNumber}`);
        
        const currentRowExcel = startExcelRow + s;
        totalCellsRef.push(`${getExcelColName(totalColIndex)}${currentRowExcel}`);
      }

      row[5 + totalTables] = createCell('');
      rekapDataRows.push(row);
    }

    if (totalCellsRef.length > 0) {
      rekapDataRows[startRowIndex - REKAP_DATA_START_ROW][5 + totalTables] = createFormulaCell(`AVERAGE(${totalCellsRef.join(', ')})`, true);
    } else {
      rekapDataRows[startRowIndex - REKAP_DATA_START_ROW][5 + totalTables] = createFloatCell(0);
    }

    if (MAX_ASSESSORS > 1) {
      const endRowIndex = startRowIndex + MAX_ASSESSORS - 1;
      rekapMerges.push({ s: { r: startRowIndex, c: 0 }, e: { r: endRowIndex, c: 0 } }); 
      rekapMerges.push({ s: { r: startRowIndex, c: 1 }, e: { r: endRowIndex, c: 1 } }); 
      rekapMerges.push({ s: { r: startRowIndex, c: 2 }, e: { r: endRowIndex, c: 2 } }); 
      rekapMerges.push({ s: { r: startRowIndex, c: 5 + totalTables }, e: { r: endRowIndex, c: 5 + totalTables } }); 
    }
  });

  const rekapRows = [rHeaderRow, ...rekapDataRows];
  const rekapWs = XLSX.utils.aoa_to_sheet(rekapRows);
  rekapWs['!merges'] = rekapMerges;
  rekapWs['!cols'] = calculateColWidths(rekapRows, 15);
  rekapWs['!freeze'] = { xSplit: 4, ySplit: 1 }; 

  const rekapSheetName = sanitizeSheetName('Rekap Nilai (Bobot)');
  XLSX.utils.book_append_sheet(wb, rekapWs, rekapSheetName);

  // =========================================================================
  // MENGATUR URUTAN SHEET: Rekap Nilai -> Rekap Kriteria -> TIM 1 ...
  // =========================================================================
  const sheetsOrder = [
    rekapSheetName,
    rekapKriteriaSheetName,
    ...wb.SheetNames.filter(name => name !== rekapSheetName && name !== rekapKriteriaSheetName)
  ];
  wb.SheetNames = sheetsOrder;

  XLSX.writeFile(wb, `Rekapitulasi_Nilai_${new Date().toISOString().split('T')[0]}.xlsx`);
};