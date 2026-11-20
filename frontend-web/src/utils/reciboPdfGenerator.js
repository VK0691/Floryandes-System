import jsPDF from 'jspdf';
import { COMPANY_INFO } from './companyInfo';

/**
 * Genera el documento PDF de comprobante/recibo de pago
 */
export function buildReciboDoc({
  id_pago,
  numero_factura,
  cliente,
  fecha_pago,
  monto,
  metodo_pago = 'EFECTIVO',
  referencia = '',
  saldo_anterior,
  saldo_restante,
}) {
  // Formato A5 horizontal o media página A4 (ideal para recibos de caja/cálculo rápido)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const primaryColor = [30, 78, 121]; // #1E4E79
  const accentColor = [224, 90, 43];  // #E05A2B
  const textColor = [15, 23, 42];     // #0F172A
  const greenColor = [5, 150, 105];   // #059669
  const grayBorder = [203, 213, 225];

  // Borde decorativo
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.rect(margin - 4, margin - 4, pageWidth - (margin - 4) * 2, pageHeight - (margin - 4) * 2);

  // Barra de acento superior
  doc.setFillColor(...primaryColor);
  doc.rect(margin - 4, margin - 4, pageWidth - (margin - 4) * 2, 4, 'F');
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - margin - 40, margin - 4, 40, 4, 'F');

  let currentY = margin + 6;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text(COMPANY_INFO.nombre, margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(COMPANY_INFO.razonSocial, margin, currentY);

  currentY += 3.8;
  doc.text(`RUC: ${COMPANY_INFO.ruc} • Matriz: ${COMPANY_INFO.direccion}`, margin, currentY);

  currentY += 3.8;
  doc.text(`Teléfono: ${COMPANY_INFO.telefono}`, margin, currentY);

  // Caja de Recibo a la derecha
  const boxW = 65;
  const boxH = 22;
  const boxX = pageWidth - margin - boxW;
  const boxY = margin + 2;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

  doc.setFillColor(...primaryColor);
  doc.roundedRect(boxX, boxY, boxW, 7, 2, 2, 'F');
  doc.rect(boxX, boxY + 3.5, boxW, 3.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RECIBO DE CAJA / ABONO', boxX + boxW / 2, boxY + 5, { align: 'center' });

  const numRecibo = id_pago ? String(id_pago).padStart(5, '0') : '00001';
  doc.setFontSize(11);
  doc.setTextColor(...accentColor);
  doc.text(`No. REC-${numRecibo}`, boxX + boxW / 2, boxY + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textColor);
  const fechaStr = fecha_pago || new Date().toISOString().split('T')[0];
  doc.text(`Fecha: ${fechaStr}`, boxX + boxW / 2, boxY + 18.5, { align: 'center' });

  // Contenedor principal de datos
  currentY = margin + 24;

  doc.setDrawColor(...grayBorder);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 46, 2, 2, 'FD');

  let innerY = currentY + 6;

  // Datos del Cliente y Factura
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('Recibimos de:', margin + 4, innerY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text((cliente?.nombre || 'Consumidor Final').toUpperCase(), margin + 30, innerY);

  if (cliente?.ruc) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(Cédula / RUC: ${cliente.ruc})`, margin + 115, innerY);
  }

  innerY += 6;
  if (numero_factura) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('Factura Asociada:', margin + 4, innerY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(`#FACT-${String(numero_factura).padStart(6, '0')}`, margin + 34, innerY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('Método de Pago:', margin + 75, innerY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text(metodo_pago || 'EFECTIVO', margin + 104, innerY);

  innerY += 6;
  if (referencia) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('Referencia / Detalle:', margin + 4, innerY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(referencia.slice(0, 65), margin + 37, innerY);
  }

  innerY += 8;

  // Caja destacada del monto abonado y saldos
  const cardW = (pageWidth - margin * 2 - 12) / 3;
  const cardH = 15;

  // Card 1: Saldo Anterior (si disponible)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 4, innerY, cardW, cardH, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Saldo Anterior:', margin + 7, innerY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  const sAnt = saldo_anterior !== undefined ? Number(saldo_anterior).toFixed(2) : '—';
  doc.text(sAnt !== '—' ? `$${sAnt}` : '—', margin + 7, innerY + 11);

  // Card 2: Monto Abonado
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(...greenColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 4 + cardW + 2, innerY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...greenColor);
  doc.text('MONTO ABONADO:', margin + 7 + cardW + 2, innerY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...greenColor);
  doc.text(`$${Number(monto || 0).toFixed(2)}`, margin + 7 + cardW + 2, innerY + 11.5);

  // Card 3: Saldo Restante
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + 4 + (cardW + 2) * 2, innerY, cardW, cardH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const sRest = Number(saldo_restante || 0);
  doc.setTextColor(sRest > 0 ? 220 : 5, sRest > 0 ? 38 : 150, sRest > 0 ? 38 : 105);
  doc.text('SALDO RESTANTE:', margin + 7 + (cardW + 2) * 2, innerY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`$${sRest.toFixed(2)}`, margin + 7 + (cardW + 2) * 2, innerY + 11.5);

  // Firmas de responsabilidad (Criterio: "Incluye el nombre de la empresa y una firma de recibido")
  const sigY = pageHeight - margin - 15;
  const sWidth = 50;

  // Firma Empresa
  const sig1X = margin + 20;
  doc.setDrawColor(180, 190, 205);
  doc.setLineWidth(0.35);
  doc.line(sig1X, sigY, sig1X + sWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text(COMPANY_INFO.nombre, sig1X + sWidth / 2, sigY + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Autorizada / Cajero', sig1X + sWidth / 2, sigY + 6.5, { align: 'center' });

  // Firma Cliente
  const sig2X = pageWidth - margin - sWidth - 20;
  doc.line(sig2X, sigY, sig2X + sWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...textColor);
  doc.text('Recibí Conforme', sig2X + sWidth / 2, sigY + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma del Cliente', sig2X + sWidth / 2, sigY + 6.5, { align: 'center' });

  // Pie de página
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Comprobante de abono emitido por ${COMPANY_INFO.nombre} • ${new Date().toLocaleDateString('es-EC')}`,
    pageWidth / 2,
    pageHeight - margin + 1,
    { align: 'center' }
  );

  return doc;
}

/**
 * Descargar recibo como archivo PDF
 */
export function descargarReciboPDF(reciboData) {
  const doc = buildReciboDoc(reciboData);
  const num = reciboData.id_pago ? String(reciboData.id_pago).padStart(5, '0') : 'abono';
  doc.save(`Recibo_Pago_Floryandes_${num}.pdf`);
}

/**
 * Imprimir directamente el recibo abriéndolo en una ventana para print
 */
export function imprimirReciboPDF(reciboData) {
  const doc = buildReciboDoc(reciboData);
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
 * Mensaje formateado para WhatsApp del recibo de abono
 */
export function generarMensajeWhatsAppRecibo(reciboData) {
  const num = reciboData.id_pago ? String(reciboData.id_pago).padStart(5, '0') : 'abono';
  const clienteNom = reciboData.cliente?.nombre || 'Cliente';
  const monto = Number(reciboData.monto || 0).toFixed(2);
  const saldoRest = Number(reciboData.saldo_restante || 0).toFixed(2);

  let msg = `🌸 *FLORYANDES - Recibo de Abono No. REC-${num}*\n`;
  msg += `Estimado/a *${clienteNom}*:\n\n`;
  msg += `Confirmamos la recepción de su abono:\n`;
  msg += `📅 Fecha: ${reciboData.fecha_pago || new Date().toISOString().split('T')[0]}\n`;
  msg += `💵 Monto Abonado: *$${monto}*\n`;
  msg += `💳 Método: ${reciboData.metodo_pago || 'EFECTIVO'}\n`;
  if (reciboData.numero_factura) {
    msg += `📄 Factura Asociada: #FACT-${String(reciboData.numero_factura).padStart(6, '0')}\n`;
  }
  msg += `⚠️ Saldo Restante: *$${saldoRest}*\n\n`;
  msg += `¡Muchas gracias por su puntualidad en los pagos!\n`;
  msg += `_${COMPANY_INFO.eslogan}_`;

  return encodeURIComponent(msg);
}
