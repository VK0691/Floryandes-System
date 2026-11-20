import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_INFO } from './companyInfo';

/**
 * Construye el documento jsPDF para una factura dada
 */
export function buildFacturaDoc({ factura, detalles = [], pagos = [] }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Paleta de colores Floryandes
  const primaryColor = [30, 78, 121]; // #1E4E79 (Azul Marino Floryandes)
  const accentColor = [224, 90, 43];  // #E05A2B (Naranja Terracota)
  const textColor = [15, 23, 42];     // #0F172A
  const grayLight = [241, 245, 249];  // #F1F5F9
  const grayBorder = [203, 213, 225]; // #CBD5E1

  // ==========================================
  // 1. ENCABEZADO CON MEMBRETE CORPORATIVO
  // ==========================================
  // Barra superior decorativa
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - 60, 0, 60, 5, 'F');

  let currentY = 14;

  // Marca Floryandes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(COMPANY_INFO.nombre, margin, currentY);

  // Isotipo / Flor gráfica estilizada al lado del nombre
  doc.setFillColor(...accentColor);
  doc.circle(margin + 58, currentY - 2.5, 2, 'F');

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(COMPANY_INFO.razonSocial, margin, currentY);

  currentY += 4;
  doc.text(`RUC: ${COMPANY_INFO.ruc}  •  Matriz: ${COMPANY_INFO.direccion}`, margin, currentY);

  currentY += 4;
  doc.text(`Tel: ${COMPANY_INFO.telefono}  •  Email: ${COMPANY_INFO.correo}`, margin, currentY);

  // Recuadro de la Factura (Derecha)
  const boxWidth = 72;
  const boxHeight = 28;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = 10;

  doc.setFillColor(...grayLight);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFillColor(...primaryColor);
  doc.roundedRect(boxX, boxY, boxWidth, 8, 2, 2, 'F');
  // Rectángulo inferior para cubrir esquinas redondeadas inferiores del header
  doc.rect(boxX, boxY + 4, boxWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURA DE VENTA', boxX + boxWidth / 2, boxY + 5.5, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...accentColor);
  const numFactura = String(factura.numero_factura || '0000').padStart(6, '0');
  doc.text(`No. ${numFactura}`, boxX + boxWidth / 2, boxY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.text(`Fecha: ${factura.fecha_emision || new Date().toISOString().split('T')[0]}`, boxX + 6, boxY + 19);

  const estado = factura.estado || 'PENDIENTE';
  const estadoColor = estado === 'PAGADA' ? [5, 150, 105] : estado === 'ANULADA' ? [220, 38, 38] : [217, 119, 6];
  doc.text('Estado:', boxX + 6, boxY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...estadoColor);
  doc.text(estado, boxX + 20, boxY + 24);

  // ==========================================
  // 2. DATOS DEL CLIENTE
  // ==========================================
  currentY = 43;

  doc.setDrawColor(...grayBorder);
  doc.setFillColor(252, 253, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  // Mini etiqueta
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, 3, 24, 'F');

  const cliente = factura.cliente || {};

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('INFORMACIÓN DEL CLIENTE', margin + 6, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textColor);

  // Columna 1
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente / Razón Social:', margin + 6, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text((cliente.nombre || 'Consumidor Final').toUpperCase(), margin + 44, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('RUC / Cédula:', margin + 6, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.ruc || '9999999999999', margin + 30, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', margin + 6, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.telefono || 'No registrado', margin + 22, currentY + 21);

  // Columna 2
  const col2X = margin + 105;
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Cliente:', col2X, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente.tipo_cliente || 'Minorista', col2X + 26, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', col2X, currentY + 16);
  doc.setFont('helvetica', 'normal');
  const dir = cliente.direccion ? cliente.direccion.slice(0, 40) : 'Mostrador / Ambato';
  doc.text(dir, col2X + 17, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Vendedor:', col2X, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(factura.usuario?.nombre || 'Administración Floryandes', col2X + 18, currentY + 21);

  currentY += 28;

  // ==========================================
  // 3. TABLA DE PRODUCTOS VENDIDOS
  // ==========================================
  const tableData = detalles.map((d) => [
    String(d.cantidad || 1),
    d.producto?.codigo || '—',
    d.producto?.nombre || 'Producto / Variedad Floral',
    d.producto?.unidad_medida || 'BONCHE',
    `$${Number(d.precio_unitario || 0).toFixed(2)}`,
    `$${Number(d.subtotal || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['CANT.', 'CÓDIGO', 'DESCRIPCIÓN', 'UNIDAD', 'P. UNIT.', 'SUBTOTAL']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // ==========================================
  // 4. OBSERVACIONES Y LIQUIDACIÓN FINANCIERA
  // ==========================================
  const summaryWidth = 78;
  const summaryX = pageWidth - margin - summaryWidth;
  const notesWidth = summaryX - margin - 6;

  // Recuadro de observaciones / notas
  if (factura.observaciones) {
    doc.setDrawColor(...grayBorder);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, currentY, notesWidth, 24, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryColor);
    doc.text('OBSERVACIONES:', margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textColor);
    const splitObs = doc.splitTextToSize(factura.observaciones, notesWidth - 6);
    doc.text(splitObs, margin + 3, currentY + 9);
  }

  // Recuadro de Totales (Liquidación)
  const sumHeight = 36;
  doc.setFillColor(...grayLight);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX, currentY, summaryWidth, sumHeight, 1.5, 1.5, 'FD');

  let sY = currentY + 5;
  const subtotalFact = Number(factura.total_factura || 0);
  const saldoAnt = Number(factura.saldo_anterior || 0);
  const totalLiq = subtotalFact + saldoAnt;
  const abonado = Number(factura.total_abonado || 0);
  const pendiente = Number(factura.saldo_pendiente || 0);

  // Filas de cálculo
  const drawSumRow = (label, value, isBold = false, color = textColor) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textColor);
    doc.text(label, summaryX + 4, sY);
    doc.setTextColor(...color);
    doc.text(value, summaryX + summaryWidth - 4, sY, { align: 'right' });
    sY += 5;
  };

  drawSumRow('Subtotal Venta:', `$${subtotalFact.toFixed(2)}`);
  drawSumRow('Saldo Anterior Cliente:', `$${saldoAnt.toFixed(2)}`);
  drawSumRow('Total a Pagar:', `$${totalLiq.toFixed(2)}`, true, primaryColor);
  drawSumRow('Total Abonado:', `-$${abonado.toFixed(2)}`, false, [5, 150, 105]);

  // Línea divisoria
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.3);
  doc.line(summaryX + 3, sY - 2, summaryX + summaryWidth - 3, sY - 2);

  sY += 1.5;
  // Saldo Pendiente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('SALDO PENDIENTE:', summaryX + 4, sY + 1);

  doc.setFontSize(10.5);
  doc.setTextColor(pendiente > 0 ? 220 : 5, pendiente > 0 ? 38 : 150, pendiente > 0 ? 38 : 105);
  doc.text(`$${pendiente.toFixed(2)}`, summaryX + summaryWidth - 4, sY + 1, { align: 'right' });

  currentY += Math.max(sumHeight, 28) + 4;

  // ==========================================
  // 5. HISTORIAL DE PAGOS DE ESTA FACTURA
  // ==========================================
  if (pagos && pagos.length > 0 && currentY < pageHeight - 45) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('PAGOS Y ABONOS REGISTRADOS PARA ESTA FACTURA:', margin, currentY);

    const pagosTableData = pagos.map(p => [
      p.fecha_pago || '—',
      p.metodo_pago || 'EFECTIVO',
      p.referencia || 'Abono',
      `$${Number(p.monto || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['FECHA', 'MÉTODO', 'REFERENCIA', 'MONTO ABONADO']],
      body: pagosTableData,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: primaryColor,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      },
      margin: { left: margin, right: margin },
    });

    currentY = doc.lastAutoTable.finalY + 4;
  }

  // ==========================================
  // 6. FIRMAS Y PIE DE PÁGINA
  // ==========================================
  const footerY = Math.max(currentY + 12, pageHeight - 32);

  // Líneas de firma
  const sigWidth = 55;
  const sig1X = margin + 15;
  const sig2X = pageWidth - margin - sigWidth - 15;

  doc.setDrawColor(180, 190, 205);
  doc.setLineWidth(0.4);
  doc.line(sig1X, footerY, sig1X + sigWidth, footerY);
  doc.line(sig2X, footerY, sig2X + sigWidth, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Entregué Conforme', sig1X + sigWidth / 2, footerY + 4, { align: 'center' });
  doc.text('Recibí Conforme (Cliente)', sig2X + sigWidth / 2, footerY + 4, { align: 'center' });

  // Mensaje final y barra de pie
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Gracias por su confianza • ${COMPANY_INFO.eslogan}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  return doc;
}

/**
 * Descarga directamente la factura como archivo PDF
 */
export function descargarFacturaPDF(facturaData) {
  const doc = buildFacturaDoc(facturaData);
  const num = String(facturaData.factura.numero_factura || '0000').padStart(6, '0');
  doc.save(`Factura_Floryandes_${num}.pdf`);
}

/**
 * Abre el PDF en una pestaña nueva para imprimir directamente
 */
export function imprimirFacturaPDF(facturaData) {
  const doc = buildFacturaDoc(facturaData);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}

/**
 * Genera el texto optimizado para enviar un resumen de factura por WhatsApp
 */
export function generarMensajeWhatsAppFactura(facturaData) {
  const f = facturaData.factura;
  const cliente = f.cliente || {};
  const num = String(f.numero_factura || '0000').padStart(6, '0');
  const total = Number(f.total_factura || 0).toFixed(2);
  const abonado = Number(f.total_abonado || 0).toFixed(2);
  const pendiente = Number(f.saldo_pendiente || 0).toFixed(2);

  let msg = `🌸 *FLORYANDES - Factura de Venta No. ${num}*\n`;
  msg += `Estimado/a *${cliente.nombre || 'Cliente'}*:\n\n`;
  msg += `Adjuntamos el resumen de su compra:\n`;
  msg += `📅 Fecha: ${f.fecha_emision}\n`;
  msg += `💵 Total Venta: $${total}\n`;
  msg += `✅ Total Abonado: $${abonado}\n`;
  msg += `⚠️ Saldo Pendiente: $${pendiente}\n`;
  msg += `📌 Estado: *${f.estado}*\n\n`;
  msg += `Muchas gracias por su preferencia.\n`;
  msg += `_${COMPANY_INFO.eslogan}_`;

  return encodeURIComponent(msg);
}
