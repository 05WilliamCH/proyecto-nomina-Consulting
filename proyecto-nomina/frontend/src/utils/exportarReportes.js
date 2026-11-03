
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logo from "../assets/logo.jpg";

export function exportarPDF({
  titulo,
  periodo,
  columnas,
  filas,
  nombreArchivo,
  total,
  mostrarTotal = false,
  horizontal = false
}) {
  const pdf = new jsPDF({
    orientation: horizontal ? "landscape" : "portrait",
    unit: "mm",
    format: "a4"
  });

  // Logo de la empresa
pdf.addImage(logo, "PNG", 14, 10, 25, 25);

// Nombre de la empresa
pdf.setFontSize(16);
pdf.setFont("helvetica", "bold");
pdf.text("CONSULTING, S.A.", 45, 19);

// Título del reporte
pdf.setFontSize(12);
pdf.setFont("helvetica", "normal");
pdf.text(titulo, 45, 27);

// Periodo
pdf.setFontSize(10);
pdf.text(periodo, 45, 34);

  autoTable(pdf, {
    startY: 42,
    head: [columnas],
    body: filas,
    theme: "grid",
    styles: {
      fontSize: horizontal ? 7 : 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [31, 58, 95],
      textColor: 255
    }
  });

  if (mostrarTotal) {
    const posicionY = pdf.lastAutoTable.finalY + 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `Total: Q ${Number(total || 0).toLocaleString("es-GT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      14,
      posicionY
    );
  }

  pdf.save(`${nombreArchivo}.pdf`);
}

export function exportarExcel({
  titulo,
  periodo,
  columnas,
  filas,
  nombreArchivo,
  total,
  mostrarTotal = false
}) {
  const datos = [
    ["CONSULTING, S.A."],
    [titulo],
    [periodo],
    [],
    columnas,
    ...filas
  ];

  if (mostrarTotal) {
    datos.push([]);
    datos.push(["", "", "Total", Number(total || 0)]);
  }

  const hoja = XLSX.utils.aoa_to_sheet(datos);

  hoja["!cols"] = columnas.map(() => ({
    wch: 22
  }));

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    "Reporte"
  );

  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}
