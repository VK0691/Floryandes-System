import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Receipt,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  TrendingDown,
  DollarSign,
  Printer,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { getClienteDetalle, registrarAbono } from '../services/clientesService';
import { descargarReciboPDF, imprimirReciboPDF } from '../utils/reciboPdfGenerator';

export default function ClienteDetallePanel({
  clienteId,
  onClose,
  onFacturar,
  onClienteUpdated,
  onVerFactura,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facturas'); // 'facturas' | 'abonos'
  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoMetodo, setAbonoMetodo] = useState('EFECTIVO');
  const [abonoRef, setAbonoRef] = useState('');
  const [abonoSubmitting, setAbonoSubmitting] = useState(false);
  const [abonoSuccess, setAbonoSuccess] = useState('');
  const [abonoError, setAbonoError] = useState('');
  const [ultimoPago, setUltimoPago] = useState(null);

  const loadDetails = async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const res = await getClienteDetalle(clienteId);
      setData(res);
    } catch (err) {
      console.error('Error loading client detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    setUltimoPago(null);
  }, [clienteId]);

  const handlePrintReceipt = (pagoObj) => {
    imprimirReciboPDF({
      id_pago: pagoObj.id_pago,
      numero_factura: pagoObj.numero_factura || (pagoObj.id_factura ? `Fact. #${pagoObj.id_factura}` : null),
      cliente: data?.cliente,
      fecha_pago: pagoObj.fecha_pago,
      monto: pagoObj.monto,
      metodo_pago: pagoObj.metodo_pago,
      referencia: pagoObj.referencia,
      saldo_anterior: pagoObj.saldo_anterior,
      saldo_restante: pagoObj.saldo_restante !== undefined ? pagoObj.saldo_restante : data?.cliente?.saldo_actual,
    });
  };

  const handleDownloadReceipt = (pagoObj) => {
    descargarReciboPDF({
      id_pago: pagoObj.id_pago,
      numero_factura: pagoObj.numero_factura || (pagoObj.id_factura ? `Fact. #${pagoObj.id_factura}` : null),
      cliente: data?.cliente,
      fecha_pago: pagoObj.fecha_pago,
      monto: pagoObj.monto,
      metodo_pago: pagoObj.metodo_pago,
      referencia: pagoObj.referencia,
      saldo_anterior: pagoObj.saldo_anterior,
      saldo_restante: pagoObj.saldo_restante !== undefined ? pagoObj.saldo_restante : data?.cliente?.saldo_actual,
    });
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    setAbonoError('');
    setAbonoSuccess('');
    setUltimoPago(null);

    const monto = parseFloat(abonoMonto);
    if (!monto || monto <= 0) {
      setAbonoError('Ingrese un monto válido.');
      return;
    }
    if (monto > 999999.99) {
      setAbonoError('El monto del abono no puede superar $999,999.99.');
      return;
    }

    setAbonoSubmitting(true);
    try {
      // Si hay una factura pendiente, asociar a la primera factura pendiente
      const facturaPendiente = data?.facturas?.find(f => f.estado === 'PENDIENTE');

      const res = await registrarAbono({
        id_cliente: clienteId,
        id_factura: facturaPendiente ? facturaPendiente.id_factura : null,
        monto: monto,
        metodo_pago: abonoMetodo,
        referencia: abonoRef || 'Abono en ventanilla',
        id_usuario: 1,
      });

      if (res.success) {
        setAbonoSuccess(`Abono de $${monto.toFixed(2)} registrado correctamente. Nuevo saldo: $${res.nuevoSaldo.toFixed(2)}`);
        setUltimoPago({
          id_pago: res.pago?.id_pago,
          numero_factura: facturaPendiente?.numero_factura,
          cliente: data?.cliente,
          fecha_pago: res.pago?.fecha_pago || new Date().toISOString().split('T')[0],
          monto: monto,
          metodo_pago: abonoMetodo,
          referencia: abonoRef || 'Abono en ventanilla',
          saldo_anterior: data?.cliente?.saldo_actual,
          saldo_restante: res.nuevoSaldo,
        });
        setAbonoMonto('');
        setAbonoRef('');
        setShowAbonoForm(false);
        await loadDetails();
        if (onClienteUpdated) onClienteUpdated();
      } else {
        setAbonoError(res.error || 'Error al procesar el abono.');
      }
    } catch (err) {
      setAbonoError(err.message || 'Error inesperado.');
    } finally {
      setAbonoSubmitting(false);
    }
  };

  if (!clienteId) return null;

  return (
    <div style={styles.panel} className="fade-in">
      {/* Panel Top Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.clientName}>
            {loading ? 'Cargando cliente...' : data?.cliente?.nombre}
          </h3>
          {data?.cliente && (
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: data.cliente.activo ? '#ECFDF5' : '#FEF2F2',
                color: data.cliente.activo ? '#059669' : '#DC2626',
              }}
            >
              {data.cliente.activo ? 'Cliente Activo' : 'Inactivo'}
            </span>
          )}
        </div>
        <button onClick={onClose} style={styles.closeBtn} title="Cerrar panel">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <span>Obteniendo historial del cliente...</span>
        </div>
      ) : data?.cliente ? (
        <div style={styles.body} className="modal-scroll">
          {/* Balance Highlight Card (Mockup p. 24) */}
          <div style={styles.balanceCard}>
            <div style={styles.balanceTop}>
              <span style={styles.balanceLabel}>Saldo Actual</span>
              <span
                style={{
                  ...styles.balanceTypeTag,
                  backgroundColor: Number(data.cliente.saldo_actual) > 0 ? '#FEE2E2' : '#DCFCE7',
                  color: Number(data.cliente.saldo_actual) > 0 ? '#DC2626' : '#15803D',
                }}
              >
                {Number(data.cliente.saldo_actual) > 0 ? 'Con Deuda Pendiente' : 'Al Día / Sin Deuda'}
              </span>
            </div>
            <div style={styles.balanceAmount} className="num-mono">
              ${Number(data.cliente.saldo_actual || 0).toFixed(2)}
            </div>

            {/* Quick Actions Row */}
            <div style={styles.balanceActions}>
              <button
                type="button"
                onClick={() => onFacturar(data.cliente)}
                style={styles.facturarBtn}
                title="Crear nueva factura para este cliente"
              >
                <Receipt size={15} />
                <span>Facturar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbonoForm(!showAbonoForm)}
                style={styles.abonoBtn}
                title="Registrar abono de dinero y rebajar deuda"
              >
                <DollarSign size={15} />
                <span>{showAbonoForm ? 'Cancelar Abono' : 'Registrar Abono'}</span>
              </button>
            </div>
          </div>

          {/* Alert messages & Receipt Actions (Historia 5.5) */}
          {abonoSuccess && (
            <div style={styles.successBox}>
              <div style={styles.successTopRow}>
                <CheckCircle2 size={16} />
                <span>{abonoSuccess}</span>
              </div>
              {ultimoPago && (
                <div style={styles.receiptActionsRow}>
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(ultimoPago)}
                    style={styles.printReceiptBtn}
                    title="Imprimir comprobante físico de abono"
                  >
                    <Printer size={13} />
                    <span>Imprimir Recibo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(ultimoPago)}
                    style={styles.downloadReceiptBtn}
                    title="Descargar Recibo en PDF"
                  >
                    <Download size={13} />
                    <span>Recibo PDF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {abonoError && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{abonoError}</span>
            </div>
          )}

          {/* Inline Form to Register Abono */}
          {showAbonoForm && (
            <form onSubmit={handleRegistrarAbono} style={styles.abonoForm}>
              <h4 style={styles.abonoFormTitle}>Nuevo Abono / Pago Parcial</h4>
              <div style={styles.abonoFormRow}>
                <div style={styles.abonoField}>
                  <label style={styles.abonoLabel}>Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999.99"
                    placeholder="0.00"
                    value={abonoMonto}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                        val = val.replace(/^0+/, '') || '0';
                      }
                      if (parseFloat(val) > 999999.99) val = '999999.99';
                      setAbonoMonto(val);
                    }}
                    onFocus={(e) => e.target.select()}
                    style={styles.abonoInput}
                    autoFocus
                  />
                </div>
                <div style={styles.abonoField}>
                  <label style={styles.abonoLabel}>Método</label>
                  <select
                    value={abonoMetodo}
                    onChange={(e) => setAbonoMetodo(e.target.value)}
                    style={styles.abonoSelect}
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>
              <div style={styles.abonoField}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.abonoLabel}>Referencia / Nota</label>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{abonoRef?.length || 0}/150</span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Ej: Depósito comprobante #8492"
                  value={abonoRef}
                  onChange={(e) => setAbonoRef(e.target.value.slice(0, 150))}
                  style={styles.abonoInput}
                />
              </div>
              <button
                type="submit"
                disabled={abonoSubmitting}
                style={styles.abonoSubmitBtn}
              >
                {abonoSubmitting ? 'Registrando...' : 'Confirmar Abono'}
              </button>
            </form>
          )}

          {/* Customer Metadata Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>RUC / Cédula:</span>
              <span style={styles.infoVal} className="num-mono">
                {data.cliente.ruc || 'No registrado'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Teléfono:</span>
              <span style={styles.infoVal} className="num-mono">
                {data.cliente.telefono || 'No registrado'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Tipo:</span>
              <span style={styles.infoVal}>{data.cliente.tipo_cliente}</span>
            </div>
            {data.cliente.direccion && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Dirección:</span>
                <span style={styles.infoVal}>{data.cliente.direccion}</span>
              </div>
            )}
            {data.cliente.correo && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Correo:</span>
                <span style={styles.infoVal}>{data.cliente.correo}</span>
              </div>
            )}
          </div>

          {/* Tabs: Facturas vs Abonos */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab('facturas')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'facturas' ? styles.tabBtnActive : {}),
              }}
            >
              Historial de Facturas ({data.facturas.length})
            </button>
            <button
              onClick={() => setActiveTab('abonos')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'abonos' ? styles.tabBtnActive : {}),
              }}
            >
              Historial de Abonos ({data.pagos.length})
            </button>
          </div>

          {/* Tab Content: Facturas (Historia 5.3) */}
          {activeTab === 'facturas' && (
            <div style={styles.historyList}>
              {/* Summary of pending invoice balances */}
              <div style={styles.invoicesSummaryBox}>
                <div>
                  <span style={styles.invoicesSummaryLabel}>Saldo Pendiente en Facturas:</span>
                  <div style={styles.invoicesSummaryVal} className="num-mono">
                    ${data.facturas
                      .filter((f) => f.estado !== 'ANULADA')
                      .reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div style={styles.invoicesSummaryRight}>
                  <span style={styles.invoicesSummaryPill}>
                    {data.facturas.filter((f) => f.estado === 'PENDIENTE').length} pendientes
                  </span>
                </div>
              </div>

              {data.facturas.length === 0 ? (
                <div style={styles.emptyHistory}>
                  No hay facturas registradas para este cliente todavía.
                </div>
              ) : (
                data.facturas.map((f) => (
                  <div
                    key={f.id_factura}
                    style={styles.historyItemClickable}
                    onClick={() => onVerFactura && onVerFactura(f.id_factura)}
                    title="Haz clic para ver el detalle de esta factura"
                  >
                    <div style={styles.historyItemTop}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={styles.historyId} className="num-mono">
                            #FACT. {f.numero_factura}
                          </span>
                          <Eye size={13} color="#1E4E79" />
                        </div>
                        <div style={styles.historyDate}>
                          <Calendar size={12} />
                          <span>{f.fecha_emision}</span>
                        </div>
                      </div>
                      <span
                        style={{
                          ...styles.invoiceStateTag,
                          backgroundColor:
                            f.estado === 'PAGADA' ? '#ECFDF5' : f.estado === 'ANULADA' ? '#FEF2F2' : '#FFFBEB',
                          color:
                            f.estado === 'PAGADA' ? '#059669' : f.estado === 'ANULADA' ? '#DC2626' : '#D97706',
                        }}
                      >
                        {f.estado}
                      </span>
                    </div>

                    <div style={styles.historyItemMetrics}>
                      <div style={styles.metricCol}>
                        <span style={styles.metricLabel}>Total:</span>
                        <strong className="num-mono">${Number(f.total_factura || 0).toFixed(2)}</strong>
                      </div>
                      <div style={styles.metricCol}>
                        <span style={styles.metricLabel}>Abonado:</span>
                        <span className="num-mono" style={{ color: '#059669', fontWeight: '700' }}>
                          ${Number(f.total_abonado || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.metricCol}>
                        <span style={styles.metricLabel}>Pendiente:</span>
                        <strong
                          className="num-mono"
                          style={{
                            color: Number(f.saldo_pendiente || 0) > 0 ? '#DC2626' : '#059669',
                          }}
                        >
                          ${Number(f.saldo_pendiente || 0).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Content: Abonos (Historia 5.5) */}
          {activeTab === 'abonos' && (
            <div style={styles.historyList}>
              {data.pagos.length === 0 ? (
                <div style={styles.emptyHistory}>
                  No se han registrado abonos o pagos para este cliente.
                </div>
              ) : (
                data.pagos.map((p) => (
                  <div key={p.id_pago} style={styles.historyItem}>
                    <div style={styles.historyItemTop}>
                      <div>
                        <span style={styles.pagoAmount} className="num-mono">
                          +${Number(p.monto).toFixed(2)}
                        </span>
                        <div style={styles.historyDate}>
                          <Clock size={12} />
                          <span>{p.fecha_pago}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.methodTag}>{p.metodo_pago}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintReceipt({
                              id_pago: p.id_pago,
                              numero_factura: p.id_factura ? p.id_factura : null,
                              fecha_pago: p.fecha_pago,
                              monto: p.monto,
                              metodo_pago: p.metodo_pago,
                              referencia: p.referencia,
                              saldo_restante: data.cliente?.saldo_actual,
                            });
                          }}
                          style={styles.abonoReceiptBtn}
                          title="Imprimir comprobante físico de este abono"
                        >
                          <Printer size={12} />
                          <span>Recibo</span>
                        </button>
                      </div>
                    </div>
                    {p.referencia && (
                      <div style={styles.pagoRefText}>{p.referencia}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 120px)',
  },
  header: {
    padding: '18px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
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
  loadingBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#E05A2B',
    animation: 'spin 0.8s linear infinite',
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
  },
  balanceCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  balanceTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  balanceTypeTag: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  balanceAmount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.03em',
  },
  balanceActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '4px',
  },
  facturarBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(224, 90, 43, 0.25)',
  },
  abonoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    color: '#1E4E79',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    padding: '12px 14px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  successTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  receiptActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px',
  },
  printReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
  },
  downloadReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    color: '#059669',
    border: '1px solid #6EE7B7',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  abonoForm: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)',
  },
  abonoFormTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
  },
  abonoFormRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  abonoField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  abonoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
  },
  abonoInput: {
    padding: '7px 10px',
    fontSize: '13px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
  },
  abonoSelect: {
    padding: '7px 10px',
    fontSize: '13px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  abonoSubmitBtn: {
    padding: '8px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    lineHeight: '1.4',
  },
  infoLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  infoVal: {
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #E2E8F0',
    gap: '10px',
  },
  tabBtn: {
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabBtnActive: {
    color: '#E05A2B',
    borderBottomColor: '#E05A2B',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyHistory: {
    padding: '24px 10px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
  },
  invoicesSummaryBox: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  invoicesSummaryLabel: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
  },
  invoicesSummaryVal: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#1E4E79',
    marginTop: '2px',
  },
  invoicesSummaryRight: {
    display: 'flex',
    alignItems: 'center',
  },
  invoicesSummaryPill: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  historyItemClickable: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  historyItemMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #EDF2F7',
    marginTop: '4px',
  },
  metricCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    color: '#64748B',
  },
  abonoReceiptBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#1E4E79',
    padding: '3px 7px',
    borderRadius: '5px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  historyItem: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  historyItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyId: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E4E79',
  },
  historyDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  invoiceStateTag: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  historyItemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#475569',
  },
  historySub: {
    color: '#334155',
  },
  historyPending: {
    color: '#DC2626',
  },
  pagoAmount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#059669',
  },
  methodTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
  },
  pagoRefText: {
    fontSize: '11px',
    color: '#64748B',
    fontStyle: 'italic',
  }
};
