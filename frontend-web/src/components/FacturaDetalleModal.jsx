import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Ban,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  Share2,
  Plus
} from 'lucide-react';
import { getFacturaDetalle, anularFactura, registrarPagoFactura } from '../services/facturasService';
import { useAuth, ROLES } from '../context/AuthContext';
import { descargarFacturaPDF, imprimirFacturaPDF, generarMensajeWhatsAppFactura } from '../utils/facturaPdfGenerator';
import { descargarReciboPDF, imprimirReciboPDF, generarMensajeWhatsAppRecibo } from '../utils/reciboPdfGenerator';

export default function FacturaDetalleModal({ facturaId, isOpen, onClose, onFacturaActualizada }) {
  const { currentRole, currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment registration state (Historia 5.2 & 5.5)
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoMetodo, setAbonoMetodo] = useState('EFECTIVO');
  const [abonoRef, setAbonoRef] = useState('');
  const [abonoSubmitting, setAbonoSubmitting] = useState(false);
  const [abonoError, setAbonoError] = useState('');
  const [ultimoPagoRegistrado, setUltimoPagoRegistrado] = useState(null);

  const loadData = async () => {
    if (!facturaId) return;
    setLoading(true);
    try {
      const res = await getFacturaDetalle(facturaId);
      setData(res);
    } catch (err) {
      console.error('Error loading factura detalle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowAnularModal(false);
      setMotivoAnulacion('');
      setErrorMsg('');
      setShowAbonoForm(false);
      setAbonoMonto('');
      setAbonoRef('');
      setAbonoError('');
      setUltimoPagoRegistrado(null);
    }
  }, [facturaId, isOpen]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    if (!data) return;
    descargarFacturaPDF(data);
  };

  const handlePrintPDF = () => {
    if (!data) return;
    imprimirFacturaPDF(data);
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const phone = (data.factura?.cliente?.telefono || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('593') ? phone : (phone.startsWith('0') ? `593${phone.slice(1)}` : `593${phone}`);
    const text = generarMensajeWhatsAppFactura(data);
    const url = cleanPhone.length >= 9
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    setAbonoError('');
    setUltimoPagoRegistrado(null);

    const montoNum = parseFloat(abonoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setAbonoError('Ingrese un monto válido mayor a 0.');
      return;
    }
    const saldoPendiente = Number(f?.saldo_pendiente || 0);
    if (montoNum > saldoPendiente) {
      setAbonoError(`El abono no puede superar el saldo pendiente de $${saldoPendiente.toFixed(2)}.`);
      return;
    }

    setAbonoSubmitting(true);
    try {
      const res = await registrarPagoFactura({
        id_factura: facturaId,
        monto: montoNum,
        metodo_pago: abonoMetodo,
        referencia: abonoRef || `Abono a Factura #${f?.numero_factura}`,
        id_usuario: currentUser?.id || 1,
      });

      if (res.success) {
        setUltimoPagoRegistrado(res.pago);
        setShowAbonoForm(false);
        setAbonoMonto('');
        setAbonoRef('');
        await loadData();
        if (onFacturaActualizada) onFacturaActualizada();
      } else {
        setAbonoError(res.error || 'Error al registrar el abono.');
      }
    } catch (err) {
      setAbonoError(err.message || 'Error inesperado al registrar abono.');
    } finally {
      setAbonoSubmitting(false);
    }
  };

  const handlePrintPaymentReceipt = (pago) => {
    imprimirReciboPDF({
      id_pago: pago.id_pago,
      numero_factura: f?.numero_factura,
      cliente: f?.cliente,
      fecha_pago: pago.fecha_pago,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      referencia: pago.referencia,
      saldo_anterior: f?.saldo_anterior,
      saldo_restante: f?.saldo_pendiente,
      usuario_nombre: f?.usuario?.nombre,
    });
  };

  const handleDownloadPaymentReceipt = (pago) => {
    descargarReciboPDF({
      id_pago: pago.id_pago,
      numero_factura: f?.numero_factura,
      cliente: f?.cliente,
      fecha_pago: pago.fecha_pago,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      referencia: pago.referencia,
      saldo_anterior: f?.saldo_anterior,
      saldo_restante: f?.saldo_pendiente,
      usuario_nombre: f?.usuario?.nombre,
    });
  };

  const handleAnular = async (e) => {
    e.preventDefault();
    if (!motivoAnulacion.trim()) {
      setErrorMsg('Debe ingresar el motivo de anulación.');
      return;
    }

    setAnulando(true);
    setErrorMsg('');
    try {
      const res = await anularFactura(facturaId, motivoAnulacion.trim(), currentUser?.id || 1);
      if (res.success) {
        setShowAnularModal(false);
        await loadData();
        if (onFacturaActualizada) onFacturaActualizada();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al anular factura');
    } finally {
      setAnulando(false);
    }
  };

  const f = data?.factura;
  const isAnulada = f?.estado === 'ANULADA';
  const isPagada = f?.estado === 'PAGADA';
  const isAdmin = currentRole === ROLES.ADMIN;

  const utilidadTotal = data?.detalles?.reduce(
    (acc, d) => acc + (Number(d.cantidad) * (Number(d.precio_unitario) - Number(d.costo_unitario))),
    0
  ) || 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <FileText size={20} color="#1E4E79" />
            <div>
              <div style={styles.titleRow}>
                <h3 style={styles.title}>
                  Factura #{loading ? '...' : f?.numero_factura}
                </h3>
                {f && (
                  <span
                    style={{
                      ...styles.statusTag,
                      backgroundColor: isAnulada
                        ? '#FEF2F2'
                        : isPagada
                        ? '#ECFDF5'
                        : '#FFFBEB',
                      color: isAnulada
                        ? '#DC2626'
                        : isPagada
                        ? '#059669'
                        : '#D97706',
                    }}
                  >
                    {f.estado}
                  </span>
                )}
              </div>
              <span style={styles.subtitle}>
                Emisión: {f?.fecha_emision} • Registrado por: {f?.usuario?.nombre || 'Usuario'}
              </span>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={handleDownloadPDF}
              style={styles.pdfBtn}
              title="Descargar Factura en formato PDF"
            >
              <Download size={14} />
              <span>PDF</span>
            </button>

            <button
              onClick={handlePrintPDF}
              style={styles.printBtn}
              title="Imprimir Factura en PDF"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              style={styles.whatsappBtn}
              title="Enviar resumen de factura por WhatsApp"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>

            {isAdmin && !isAnulada && (
              <button
                onClick={() => setShowAnularModal(true)}
                style={styles.anularBtn}
                title="Anular venta y reintegrar existencias"
              >
                <Ban size={14} />
                <span>Anular Factura</span>
              </button>
            )}

            <button onClick={onClose} style={styles.closeBtn} title="Cerrar ventana">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body with vertical scrollbar */}
        <div style={styles.body} className="modal-scroll">
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <span>Cargando detalle de la factura...</span>
            </div>
          ) : f ? (
            <>
              {/* Client Info Banner */}
              <div style={styles.clientBox}>
                <div style={styles.clientBoxLeft}>
                  <User size={18} color="#1E4E79" />
                  <div>
                    <strong style={styles.clientName}>{f.cliente?.nombre}</strong>
                    <div style={styles.clientSub}>
                      RUC/Cédula: <span className="num-mono">{f.cliente?.ruc || 'Consumidor Final'}</span> • Teléfono: <span className="num-mono">{f.cliente?.telefono || 'No registrado'}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.clientBoxRight}>
                  <span style={styles.clientTypeTag}>{f.cliente?.tipo_cliente || 'Minorista'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={styles.th}>CANT.</th>
                      <th style={styles.th}>PRODUCTO</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO U.</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>COSTO U.</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detalles.map((d) => (
                      <tr key={d.id_detalle_factura} style={styles.tr}>
                        <td style={styles.tdQty} className="num-mono">{d.cantidad}</td>
                        <td style={styles.tdProd}>
                          <strong>[{d.producto?.codigo}]</strong> {d.producto?.nombre}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                          ${Number(d.precio_unitario).toFixed(2)}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                          ${Number(d.costo_unitario || 0).toFixed(2)}
                        </td>
                        <td style={{ ...styles.tdSubtotal, textAlign: 'right' }} className="num-mono">
                          ${Number(d.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div style={styles.summaryGrid} className="responsive-two-col">
                <div style={styles.summaryLeft}>
                  {f.observaciones && (
                    <div style={styles.obsBox}>
                      <span style={styles.obsLabel}>Observaciones:</span>
                      <p style={styles.obsText}>{f.observaciones}</p>
                    </div>
                  )}

                  {/* Profit indicator for admin */}
                  {isAdmin && (
                    <div style={styles.marginCard}>
                      <span style={styles.marginLabel}>Utilidad Neta de la Venta:</span>
                      <span style={styles.marginVal} className="num-mono">
                        +${Math.max(0, utilidadTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.summaryRight}>
                  <div style={styles.sumRow}>
                    <span>Subtotal Factura:</span>
                    <strong className="num-mono">${Number(f.total_factura).toFixed(2)}</strong>
                  </div>
                  <div style={styles.sumRow}>
                    <span>Saldo Anterior del Cliente:</span>
                    <span className="num-mono">${Number(f.saldo_anterior).toFixed(2)}</span>
                  </div>
                  <div style={styles.sumRow}>
                    <span>Total a Pagar:</span>
                    <strong className="num-mono" style={{ color: '#1E4E79' }}>
                      ${(Number(f.total_factura) + Number(f.saldo_anterior)).toFixed(2)}
                    </strong>
                  </div>
                  <div style={styles.sumRow}>
                    <span>Total Abonado:</span>
                    <span className="num-mono" style={{ color: '#059669' }}>
                      -${Number(f.total_abonado).toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.sumDivider}></div>
                  <div style={styles.sumRowTotal}>
                    <span>Saldo Pendiente:</span>
                    <strong
                      className="num-mono"
                      style={{
                        color: Number(f.saldo_pendiente) > 0 ? '#DC2626' : '#059669',
                      }}
                    >
                      ${Number(f.saldo_pendiente).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment History and New Abono Section (Historias 5.2 & 5.5) */}
              <div style={styles.paymentsSection}>
                <div style={styles.paymentsHeaderRow}>
                  <div style={styles.paymentsHeaderLeft}>
                    <CreditCard size={17} color="#1E4E79" />
                    <span style={styles.paymentsTitle}>Historial de Pagos y Abonos</span>
                    <span style={styles.paymentsCount}>({data.pagos.length})</span>
                  </div>

                  {!isAnulada && Number(f.saldo_pendiente) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAbonoForm(!showAbonoForm);
                        if (!showAbonoForm) {
                          setAbonoMonto(Number(f.saldo_pendiente).toFixed(2));
                          setAbonoError('');
                          setUltimoPagoRegistrado(null);
                        }
                      }}
                      style={styles.btnRegistrarAbono}
                      title="Registrar un abono o pago parcial para esta factura"
                    >
                      <Plus size={14} />
                      <span>{showAbonoForm ? 'Cancelar Abono' : 'Registrar Abono'}</span>
                    </button>
                  )}
                </div>

                {/* Banner de confirmación de pago con botones de Recibo */}
                {ultimoPagoRegistrado && (
                  <div style={styles.paymentSuccessBox}>
                    <div style={styles.paymentSuccessLeft}>
                      <CheckCircle2 size={20} color="#059669" />
                      <div>
                        <strong style={styles.paymentSuccessTitle}>
                          ¡Abono de ${Number(ultimoPagoRegistrado.monto).toFixed(2)} registrado exitosamente!
                        </strong>
                        <div style={styles.paymentSuccessSub}>
                          Se actualizó el saldo pendiente y se registró en la base de datos de pagos.
                        </div>
                      </div>
                    </div>
                    <div style={styles.paymentSuccessActions}>
                      <button
                        type="button"
                        onClick={() => handlePrintPaymentReceipt(ultimoPagoRegistrado)}
                        style={styles.printReceiptBtn}
                        title="Imprimir comprobante físico de este abono"
                      >
                        <Printer size={14} />
                        <span>Imprimir Recibo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPaymentReceipt(ultimoPagoRegistrado)}
                        style={styles.downloadReceiptBtn}
                        title="Descargar comprobante en PDF"
                      >
                        <Download size={14} />
                        <span>Recibo PDF</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulario para registrar abono a esta factura */}
                {showAbonoForm && !isAnulada && Number(f.saldo_pendiente) > 0 && (
                  <form onSubmit={handleRegistrarAbono} style={styles.inlineAbonoForm}>
                    <div style={styles.inlineAbonoTitleRow}>
                      <DollarSign size={16} color="#E05A2B" />
                      <h4 style={styles.inlineAbonoTitle}>Nuevo Abono para Factura #{f.numero_factura}</h4>
                    </div>

                    {abonoError && (
                      <div style={styles.abonoErrorAlert}>
                        <AlertCircle size={14} />
                        <span>{abonoError}</span>
                      </div>
                    )}

                    <div style={styles.inlineAbonoGrid} className="modal-form-row">
                      <div style={styles.inlineField}>
                        <label style={styles.inlineLabel}>
                          Monto a Abonar ($) <span style={{ color: '#E05A2B' }}>*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={Number(f.saldo_pendiente)}
                          value={abonoMonto}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (parseFloat(val) > Number(f.saldo_pendiente)) {
                              val = String(Number(f.saldo_pendiente).toFixed(2));
                            }
                            setAbonoMonto(val);
                          }}
                          onFocus={(e) => e.target.select()}
                          placeholder="0.00"
                          style={styles.inlineInput}
                          autoFocus
                          required
                        />
                        <span style={styles.inlineHint}>
                          Máx. pendiente: ${Number(f.saldo_pendiente).toFixed(2)}
                        </span>
                      </div>

                      <div style={styles.inlineField}>
                        <label style={styles.inlineLabel}>Método de Pago</label>
                        <select
                          value={abonoMetodo}
                          onChange={(e) => setAbonoMetodo(e.target.value)}
                          style={styles.inlineSelect}
                        >
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>

                      <div style={styles.inlineFieldWide}>
                        <label style={styles.inlineLabel}>Referencia / Detalle</label>
                        <input
                          type="text"
                          maxLength={150}
                          value={abonoRef}
                          onChange={(e) => setAbonoRef(e.target.value.slice(0, 150))}
                          placeholder="Ej: Depósito comprobante #8492 o Pago en ventanilla"
                          style={styles.inlineInput}
                        />
                      </div>
                    </div>

                    <div style={styles.inlineAbonoActions}>
                      <button
                        type="button"
                        onClick={() => setShowAbonoForm(false)}
                        style={styles.inlineCancelBtn}
                        disabled={abonoSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        style={styles.inlineSubmitBtn}
                        disabled={abonoSubmitting}
                      >
                        <DollarSign size={14} />
                        <span>{abonoSubmitting ? 'Guardando Pago...' : 'Confirmar Abono'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Tabla de pagos */}
                {data.pagos.length === 0 ? (
                  <span style={styles.noPayments}>No se han registrado abonos en esta factura todavía.</span>
                ) : (
                  <div style={styles.paymentsTableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.trHead}>
                          <th style={styles.th}>FECHA</th>
                          <th style={styles.th}>MÉTODO</th>
                          <th style={styles.th}>REFERENCIA</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>MONTO</th>
                          <th style={{ ...styles.th, textAlign: 'center', width: '95px' }}>COMPROBANTE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pagos.map((p) => (
                          <tr key={p.id_pago} style={styles.tr}>
                            <td style={styles.td} className="num-mono">{p.fecha_pago}</td>
                            <td style={styles.td}>
                              <span style={styles.metodoBadge}>{p.metodo_pago}</span>
                            </td>
                            <td style={styles.td}>{p.referencia || '—'}</td>
                            <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                              <strong>${Number(p.monto).toFixed(2)}</strong>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handlePrintPaymentReceipt(p)}
                                style={styles.rowReceiptBtn}
                                title="Imprimir Recibo de este abono"
                              >
                                <Printer size={13} />
                                <span>Recibo</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Cancellation Modal Overlay */}
        {showAnularModal && (
          <div style={styles.anularOverlay}>
            <div style={styles.anularCard}>
              <h4 style={styles.anularTitle}>Confirmar Anulación de Factura</h4>
              <p style={styles.anularDesc}>
                Esta acción marcará la factura #{f?.numero_factura} como <strong>ANULADA</strong>, reintegrará las cantidades al inventario físico de productos y revertirá el saldo pendiente del cliente.
              </p>

              {errorMsg && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAnular}>
                <div style={styles.anularField}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={styles.anularLabel}>Motivo de la anulación:</label>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{motivoAnulacion?.length || 0}/250</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Ej: Error en cantidad facturada / Cliente canceló el pedido"
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value.slice(0, 250))}
                    style={styles.anularTextarea}
                    autoFocus
                  />
                </div>

                <div style={styles.anularActions}>
                  <button
                    type="button"
                    disabled={anulando}
                    onClick={() => setShowAnularModal(false)}
                    style={styles.anularCancelBtn}
                  >
                    Regresar
                  </button>
                  <button
                    type="submit"
                    disabled={anulando}
                    style={styles.anularSubmitBtn}
                  >
                    {anulando ? 'Anulando...' : 'Confirmar Anulación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px 16px',
    overflowY: 'auto',
  },
  modal: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '740px',
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    padding: '18px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: '12px',
    zIndex: 2,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  statusTag: {
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#334155',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  pdfBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1E4E79',
    border: 'none',
    color: '#FFFFFF',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(30, 78, 121, 0.25)',
  },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#10B981',
    border: 'none',
    color: '#FFFFFF',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  anularBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  clientBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientBoxLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  clientName: {
    fontSize: '14px',
    color: '#0F172A',
    fontWeight: '700',
  },
  clientSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  clientTypeTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  tableCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflowX: 'auto',
    backgroundColor: '#FFFFFF',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '10px 14px',
    fontSize: '12px',
    color: '#334155',
  },
  tdQty: {
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  tdProd: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1E293B',
  },
  tdSubtotal: {
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '20px',
    alignItems: 'start',
  },
  summaryLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  obsBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  obsLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    display: 'block',
    marginBottom: '2px',
  },
  obsText: {
    fontSize: '12px',
    color: '#334155',
    lineHeight: '1.4',
  },
  marginCard: {
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#065F46',
  },
  marginVal: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#059669',
  },
  summaryRight: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sumRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#475569',
  },
  sumDivider: {
    height: '1px',
    backgroundColor: '#CBD5E1',
    margin: '4px 0',
  },
  sumRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '800',
  },
  paymentsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '6px',
    borderTop: '1px solid #F1F5F9',
  },
  paymentsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  paymentsHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  paymentsTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentsCount: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
  },
  btnRegistrarAbono: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#FFF7ED',
    border: '1px solid #FFEDD5',
    color: '#E05A2B',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  paymentSuccessBox: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  paymentSuccessLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  paymentSuccessTitle: {
    fontSize: '13px',
    color: '#15803D',
    display: 'block',
  },
  paymentSuccessSub: {
    fontSize: '11px',
    color: '#166534',
    marginTop: '2px',
  },
  paymentSuccessActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  printReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#15803D',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
  },
  downloadReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#FFFFFF',
    color: '#15803D',
    border: '1px solid #86EFAC',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  inlineAbonoForm: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  inlineAbonoTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  inlineAbonoTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  abonoErrorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: '7px 10px',
    borderRadius: '6px',
    fontSize: '11px',
  },
  inlineAbonoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  inlineField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inlineFieldWide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    gridColumn: '1 / -1',
  },
  inlineLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  inlineInput: {
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  inlineSelect: {
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  inlineHint: {
    fontSize: '10px',
    color: '#64748B',
  },
  inlineAbonoActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  inlineCancelBtn: {
    padding: '6px 12px',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  inlineSubmitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 14px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(224, 90, 43, 0.2)',
  },
  metodoBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  rowReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#1E4E79',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  noPayments: {
    fontSize: '12px',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  paymentsTableWrap: {
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  loadingBox: {
    padding: '50px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748B',
    fontSize: '13px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#E05A2B',
    animation: 'spin 0.8s linear infinite',
  },
  anularOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 10,
  },
  anularCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  anularTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: '8px',
  },
  anularDesc: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '12px',
  },
  anularField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  anularLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  anularTextarea: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
  },
  anularActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  anularCancelBtn: {
    padding: '8px 14px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  anularSubmitBtn: {
    padding: '8px 16px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};
