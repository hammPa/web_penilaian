import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------- EXPORT PDF PER-GRUP (Halaman AssessmentRecap) ----------
export async function groupRecapPdfExport({ group, sessionName }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // =====================================================================
  // HEADER
  // =====================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REKAPITULASI NILAI GRUP', margin, y);
  
  // Garis Bawah Header
  doc.setLineWidth(0.5);
  doc.setDrawColor(23, 32, 58);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Informasi Meta dalam bentuk grid teks 2 Kolom
  const leftColX = margin;
  const rightColX = pageWidth / 2;

  doc.text(`Sesi: ${sessionName || '-'}`, leftColX, y);
  doc.text(`Gugus: ${group.gugus || '-'}`, rightColX, y);
  y += 6;
  doc.text(`Grup: ${group.name || '-'}`, leftColX, y);
  doc.text(`Tim: ${group.teamName || '-'}`, rightColX, y);
  y += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Rata-Rata Nilai Grup: ${group.average}`, leftColX, y);
  y += 12;

  // Jika belum ada yang menilai
  if (!group.assessors || group.assessors.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Belum ada penilaian untuk grup ini.', margin, y);
    doc.save(`Rekap-${group.name || group.id}.pdf`);
    return;
  }

  // =====================================================================
  // TABEL PENILAIAN PER ASSESSOR
  // =====================================================================
  group.assessors.forEach((assessor, index) => {
    // 1. Judul Nama Penilai
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(23, 32, 58); // Biru Gelap
    doc.text(`Penilai: ${assessor.name}`, margin, y);
    
    // Total Nilai dari Penilai ditaruh di sebelah kanan sejajar dengan nama
    doc.setFontSize(11);
    doc.text(`Total: ${Number(assessor.score).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;

    // 2. Kelompokkan Data Berdasarkan Tabel (Untuk keperluan Rowspan)
    const groupedCriteria = assessor.perCriteria.reduce((acc, curr) => {
      const key = curr.tableName;
      if (!acc[key]) {
        acc[key] = { tableName: key, items: [], totalScore: 0 };
      }
      acc[key].items.push(curr);
      acc[key].totalScore += Number(curr.score || 0);
      return acc;
    }, {});

    // Urutkan nama tabel secara natural (Tabel 1, Tabel 2, dst)
    const groups = Object.values(groupedCriteria).sort((a, b) => 
      (a.tableName || '').localeCompare(b.tableName || '', undefined, { numeric: true })
    );

    const head = [['No', 'Tabel', 'Kriteria', 'Subtotal', 'Total Tabel']];
    const body = [];
    let rowNumber = 1;

    // 3. Susun Body Tabel dengan Efek Rowspan
    groups.forEach((groupData) => {
      const rowCount = groupData.items.length;
      
      groupData.items.forEach((item, idx) => {
        let row = [];
        
        // Hanya di index 0 (baris pertama tiap tabel) kita merender kolom Tabel dan Total Tabel
        if (idx === 0) {
          row.push({ content: String(rowNumber), styles: { halign: 'center' } });
          row.push({ content: groupData.tableName, rowSpan: rowCount, styles: { valign: 'middle', fontStyle: 'bold' } });
          row.push(item.criteriaName);
          row.push({ content: Number(item.score).toFixed(2), styles: { halign: 'center' } });
          row.push({ content: Number(groupData.totalScore).toFixed(2), rowSpan: rowCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } });
        } else {
          // Baris berikutnya, lewati sel yang sudah di-rowspan
          row.push({ content: String(rowNumber), styles: { halign: 'center' } });
          row.push(item.criteriaName);
          row.push({ content: Number(item.score).toFixed(2), styles: { halign: 'center' } });
        }
        body.push(row);
        rowNumber++;
      });
    });

    // 4. Render autoTable
    autoTable(doc, {
      head,
      body,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [23, 32, 58], textColor: 255, halign: 'center' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 }, // No
        1: { cellWidth: 35 }, // Tabel
        2: { cellWidth: 80 }, // Kriteria
        3: { cellWidth: 25 }, // Subtotal
        4: { cellWidth: 30 }  // Total Tabel
      },
      // Garis batas antar Tabel yang tegas
      didDrawCell: (data) => {
        // Cek jika ini adalah baris baru yang memiliki rowspan (baris dengan 5 kolom/item array asli)
        if (data.section === 'body' && data.row.index > 0 && data.column.index === 0) {
          if (data.row.raw.length === 5) {
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.4);
            doc.line(data.cell.x, data.cell.y, pageWidth - margin, data.cell.y);
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    // Sesuaikan posisi Y untuk penilai berikutnya
    y = doc.lastAutoTable.finalY + 15; 
  });

  // =====================================================================
  // RINGKASAN AKHIR (TOTAL RATA-RATA)
  // =====================================================================
  
  // Menggunakan autoTable tanpa header untuk membuat kotak elegan di bagian bawah
  autoTable(doc, {
    body: [
      [
        { content: 'RATA-RATA NILAI KESELURUHAN GRUP', styles: { halign: 'right', fontStyle: 'bold' } },
        { content: String(group.average), styles: { halign: 'center', fontStyle: 'bold' } }
      ]
    ],
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : y,
    theme: 'grid',
    bodyStyles: { fillColor: [200, 147, 62], textColor: 255, fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 150 }, // Total lebar dari No + Tabel + Kriteria + Subtotal
      1: { cellWidth: 30 }   // Lebar Total Tabel
    },
    margin: { left: margin, right: margin }
  });

  doc.save(`Rekap-${group.name || group.id}.pdf`);
}