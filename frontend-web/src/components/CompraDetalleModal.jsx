import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Truck,
  User,
  DollarSign,
  PackageCheck,
  TrendingDown,
  AlertCircle,
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { getCompraDetalle } from '../services/comprasService';

export default function CompraDetalleModal({ compraId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!compraId || !isOpen) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await getCompraDetalle(compraId);
        setData(res);
      } catch (err) {
        console.error('Error cargando detalle de compra:', err);
        setErrorMsg('No se pudo cargar el detalle de la compra.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [compraId, isOpen]);

  if (!isOpen) return null;

  const compra = data?.compra;
  const detalles = data?.detalles || [];
  const movimientos = data?.movimientos || [];

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'PAGADA':
        return { bg: '#D1FAE5', color: '#065F46', text: 'PAGADA' };
      case 'PENDIENTE':
        return { bg: '#FEF3C7', color: '#92400E', text: 'PENDIENTE' };
      case 'ANULADA':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'ANULADA' };
      default:
        return { bg: '#F1F5F9', color: '#475569', text: estado || 'DESCONOCIDO' };
    }
  };

  const statusBadge = getStatusBadge(compra?.estado);

  const totalRecibido = detalles.reduce((acc, d) => acc + (parseFloat(d.cantidad_recibida) || 0), 0);
  const totalSano = detalles.reduce((acc, d) => acc + (parseFloat(d.cantidad_sana) || 0), 0);
  const totalPerdido = detalles.reduce((acc, d) => acc + (parseFloat(d.cantidad_perdida) || 0), 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}>
              <Truck size={22} color="#1E4E79" />
            </div>
            <div>
              <div style={styles.titleRow}>
                <h3 style={styles.title}>
                  Compra #{compra ? compra.numero_compra : '...'}
                </h3>
                {compra && (
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: statusBadge.bg,
                      color: statusBadge.color,
                    }}
                  >
                    {statusBadge.text}
                  </span>
                )}
              </div>
              <p style={styles.subtitle}>
                Detalle de recepción de mercadería, cantidades sanas y pérdidas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {loading ? (
            <div style={styles.loadingWrapper}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Cargando información de la compra...</p>
            </div>
          ) : errorMsg ? (
            <div style={styles.errorBanner}>
              <AlertCircle size={20} color="#DC2626" />
              <span>{errorMsg}</span>
            </div>
          ) : !compra ? (
            <p style={styles.emptyText}>No se encontraron datos de la compra.</p>
          ) : (
            <>
              {/* Meta information grid */}
              <div style={styles.metaGrid}>
                <div style={styles.metaCard}>
                  <div style={styles.metaIcon}>
                    <Truck size={18} color="#1E4E79" />
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Proveedor</span>
                    <span style={styles.metaValue}>
                      {compra.proveedor?.nombre || 'Proveedor Desconocido'}
                    </span>
                    <span style={styles.metaSub}>
                      {compra.proveedor?.tipo ? `Tipo: ${compra.proveedor.tipo}` : ''}
                      {compra.proveedor?.telefono ? ` - Tel: ${compra.proveedor.telefono}` : ''}
                    </span>
                  </div>
                </div>

                <div style={styles.metaCard}>
                  <div style={styles.metaIcon}>
                    <Calendar size={18} color="#059669" />
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Fecha de Compra</span>
                    <span style={styles.metaValue}>
                      {compra.fecha_compra
                        ? new Date(compra.fecha_compra).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'No registrada'}
                    </span>
                    <span style={styles.metaSub}>Registrado en sistema</span>
                  </div>
                </div>

                <div style={styles.metaCard}>
                  <div style={styles.metaIcon}>
                    <User size={18} color="#E05A2B" />
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Registrado por</span>
                    <span style={styles.metaValue}>
                      {compra.usuario?.nombre || 'Usuario del Sistema'}
                    </span>
                    <span style={styles.metaSub}>Responsable de bodega</span>
                  </div>
                </div>

                <div style={styles.metaCard}>
                  <div style={styles.metaIcon}>
                    <DollarSign size={18} color="#059669" />
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Total de Compra</span>
                    <span style={{ ...styles.metaValue, color: '#059669', fontSize: '18px' }}>
                      ${parseFloat(compra.total_compra || 0).toFixed(2)}
                    </span>
                    <span style={styles.metaSub}>
                      Saldo pendiente: ${parseFloat(compra.saldo_pendiente || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantities summary metrics */}
              <div style={styles.metricsBar}>
                <div style={styles.metricItem}>
                  <span style={styles.metricLabel}>Total Recibido:</span>
                  <span style={styles.metricVal}>{totalRecibido} bonches</span>
                </div>
                <div style={{ ...styles.metricItem, borderLeft: '1px solid #E2E8F0', paddingLeft: '16px' }}>
                  <span style={styles.metricLabel}>Total Sano (Ingreso Stock):</span>
                  <span style={{ ...styles.metricVal, color: '#059669' }}>{totalSano} bonches</span>
                </div>
                <div style={{ ...styles.metricItem, borderLeft: '1px solid #E2E8F0', paddingLeft: '16px' }}>
                  <span style={styles.metricLabel}>Total Pérdidas (Merma):</span>
                  <span style={{ ...styles.metricVal, color: totalPerdido > 0 ? '#DC2626' : '#64748B' }}>
                    {totalPerdido} bonches
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div style={styles.sectionHeader}>
                <PackageCheck size={18} color="#1E4E79" />
                <h4 style={styles.sectionTitle}>Productos Comprados ({detalles.length})</h4>
              </div>

              <div style={styles.tableCard}>
                <div style={styles.tableScroll}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Producto</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Cant. Recibida</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Cant. Sana</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Cant. Pérdida</th>
                        <th style={styles.th}>Motivo Pérdida</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Costo Unit.</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Costo Real Sano</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalles.map((d, idx) => {
                        const cantRecibida = parseFloat(d.cantidad_recibida) || 0;
                        const cantSana = parseFloat(d.cantidad_sana) || 0;
                        const cantPerdida = parseFloat(d.cantidad_perdida) || 0;
                        const costoUnit = parseFloat(d.costo_unitario) || 0;
                        const subtotal = parseFloat(d.subtotal) || 0;
                        // Costo real por bonche sano = costo_total / cant_sana
                        const costoRealSano = cantSana > 0 ? (cantRecibida * costoUnit) / cantSana : 0;

                        return (
                          <tr key={d.id_detalle_compra || idx} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={styles.prodInfo}>
                                <span style={styles.prodName}>
                                  {d.producto?.nombre || 'Producto no identificado'}
                                </span>
                                {d.producto?.codigo && (
                                  <span style={styles.prodCode}>{d.producto.codigo}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600' }}>
                              {cantRecibida}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: '#059669' }}>
                              {cantSana}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: cantPerdida > 0 ? '#DC2626' : '#94A3B8' }}>
                              {cantPerdida}
                            </td>
                            <td style={styles.td}>
                              {cantPerdida > 0 ? (
                                <span style={styles.motivoTag}>
                                  <TrendingDown size={12} color="#DC2626" />
                                  {d.motivo_perdida || 'No especificado'}
                                </span>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Sin pérdidas</span>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                              ${costoUnit.toFixed(2)}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: cantPerdida > 0 ? '#B45309' : '#334155' }}>
                              ${costoRealSano.toFixed(2)}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#1E4E79' }}>
                              ${subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={styles.tfootRow}>
                        <td style={styles.tdFootLabel} colSpan={7}>
                          Total de la Compra:
                        </td>
                        <td style={styles.tdFootVal}>
                          ${parseFloat(compra.total_compra || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Inventory Movements Log */}
              {movimientos.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={styles.sectionHeader}>
                    <Activity size={18} color="#1E4E79" />
                    <h4 style={styles.sectionTitle}>
                      Trazabilidad de Inventario ({movimientos.length} movimientos generados)
                    </h4>
                  </div>
                  <div style={styles.tableCard}>
                    <div style={styles.tableScroll}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Tipo</th>
                            <th style={styles.th}>Producto</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Cantidad</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Costo Unit.</th>
                            <th style={styles.th}>Referencia / Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientos.map((m, idx) => {
                            const isEntrada = m.tipo_movimiento === 'ENTRADA';
                            return (
                              <tr key={m.id_movimiento || idx} style={styles.tr}>
                                <td style={styles.td}>
                                  <span
                                    style={{
                                      ...styles.badge,
                                      backgroundColor: isEntrada ? '#D1FAE5' : '#FEE2E2',
                                      color: isEntrada ? '#065F46' : '#991B1B',
                                    }}
                                  >
                                    {m.tipo_movimiento}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.prodName}>
                                    {m.producto?.nombre || `Producto #${m.id_producto}`}
                                  </span>
                                  {m.producto?.codigo && (
                                    <span style={styles.prodCode}>{m.producto.codigo}</span>
                                  )}
                                </td>
                                <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: isEntrada ? '#059669' : '#DC2626' }}>
                                  {isEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                                </td>
                                <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                                  ${parseFloat(m.costo_unitario || 0).toFixed(2)}
                                </td>
                                <td style={{ ...styles.td, fontSize: '12px', color: '#64748B' }}>
                                  {m.referencia || 'Generado automáticamente por compra'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {compra.observaciones && (
                <div style={styles.obsBox}>
                  <div style={styles.obsHeader}>
                    <FileText size={16} color="#475569" />
                    <span style={styles.obsTitle}>Observaciones registradas</span>
                  </div>
                  <p style={styles.obsText}>{compra.observaciones}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.btnSecondary}>
            Cerrar
          </button>
        </div>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #BFDBFE',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  metaCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px',
  },
  metaIcon: {
    marginTop: '2px',
  },
  metaLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  metaValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: '2px',
  },
  metaSub: {
    display: 'block',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  metricsBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    backgroundColor: '#F1F5F9',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metricLabel: {
    fontSize: '13px',
    color: '#475569',
    fontWeight: '500',
  },
  metricVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0,
  },
  tableCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#F8FAFC',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '10px 12px',
    color: '#1E293B',
    verticalAlign: 'middle',
  },
  prodInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  prodName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  prodCode: {
    fontSize: '11px',
    color: '#64748B',
    fontFamily: 'monospace',
  },
  motivoTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  tfootRow: {
    backgroundColor: '#F8FAFC',
    borderTop: '2px solid #E2E8F0',
  },
  tdFootLabel: {
    padding: '12px',
    textAlign: 'right',
    fontWeight: '700',
    color: '#334155',
    fontSize: '13px',
  },
  tdFootVal: {
    padding: '12px',
    textAlign: 'right',
    fontWeight: '800',
    color: '#059669',
    fontSize: '15px',
    fontFamily: 'monospace',
  },
  obsBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  obsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  obsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  obsText: {
    fontSize: '13px',
    color: '#334155',
    margin: 0,
    lineHeight: 1.5,
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#1E4E79',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#64748B',
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748B',
    textAlign: 'center',
    padding: '24px 0',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '14px 24px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  btnSecondary: {
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

