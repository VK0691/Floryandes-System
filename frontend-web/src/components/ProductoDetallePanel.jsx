import React, { useState, useEffect } from 'react';
import {
  X,
  Flower2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  User,
  Truck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { getProductoDetalle } from '../services/productosService';

export default function ProductoDetallePanel({ productoId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' | 'compras'

  useEffect(() => {
    async function load() {
      if (!productoId) return;
      setLoading(true);
      try {
        const res = await getProductoDetalle(productoId);
        setData(res);
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productoId]);

  if (!productoId) return null;

  const prod = data?.producto;
  const isLowStock = prod?.es_inventariable && Number(prod?.stock_actual) > 0 && Number(prod?.stock_actual) < Number(prod?.stock_minimo);
  const isOutOfStock = prod?.es_inventariable && Number(prod?.stock_actual) <= 0;

  const profitPerUnit = prod ? Math.max(0, Number(prod.precio_base) - Number(prod.costo_promedio)) : 0;
  const marginPct = prod && Number(prod.precio_base) > 0
    ? ((profitPerUnit / Number(prod.precio_base)) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={styles.panel} className="fade-in">
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.codeTag} className="num-mono">{prod?.codigo || 'PROD'}</span>
          <div>
            <h3 style={styles.productTitle}>
              {loading ? 'Cargando producto...' : prod?.nombre}
            </h3>
            <span style={styles.catSubtitle}>{prod?.categoria?.nombre || 'Catálogo'}</span>
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn} title="Cerrar panel">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <span>Consultando información y trazabilidad...</span>
        </div>
      ) : prod ? (
        <div style={styles.body}>
          {/* Key Metrics Grid */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Precio Base</span>
              <span style={styles.metricValGreen} className="num-mono">
                ${Number(prod.precio_base || 0).toFixed(2)}
              </span>
              <span style={styles.metricSub}>Por {prod.unidad_medida}</span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Costo Promedio</span>
              <span style={styles.metricValNavy} className="num-mono">
                ${Number(prod.costo_promedio || 0).toFixed(2)}
              </span>
              <span style={styles.metricSub}>Calculado de compras</span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Utilidad / Unidad</span>
              <span style={styles.metricValOrange} className="num-mono">
                +${profitPerUnit.toFixed(2)}
              </span>
              <span style={styles.metricSub}>Margen {marginPct}%</span>
            </div>
          </div>

          {/* Stock Health Banner */}
          {prod.es_inventariable && (
            <div
              style={{
                ...styles.stockBanner,
                backgroundColor: isOutOfStock
                  ? '#FEF2F2'
                  : isLowStock
                  ? '#FFFBEB'
                  : '#ECFDF5',
                borderColor: isOutOfStock
                  ? '#FECACA'
                  : isLowStock
                  ? '#FDE68A'
                  : '#A7F3D0',
              }}
            >
              <div style={styles.stockBannerLeft}>
                {isLowStock || isOutOfStock ? (
                  <AlertTriangle
                    size={20}
                    color={isOutOfStock ? '#DC2626' : '#D97706'}
                  />
                ) : (
                  <Package size={20} color="#059669" />
                )}
                <div>
                  <div style={styles.stockTitle}>
                    {isOutOfStock
                      ? 'Stock Agotado'
                      : isLowStock
                      ? 'Alerta: Stock Bajo'
                      : 'Stock Óptimo'}
                  </div>
                  <div style={styles.stockSubtitle}>
                    Existencia actual: <strong className="num-mono">{prod.stock_actual} {prod.unidad_medida}</strong> (Mínimo sugerido: {prod.stock_minimo})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs: Ventas vs Compras */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab('ventas')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'ventas' ? styles.tabBtnActive : {}),
              }}
            >
              Historial de Ventas ({data.ventas.length})
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'compras' ? styles.tabBtnActive : {}),
              }}
            >
              Historial de Compras ({data.compras.length})
            </button>
          </div>

          {/* Ventas List */}
          {activeTab === 'ventas' && (
            <div style={styles.historyList}>
              {data.ventas.length === 0 ? (
                <div style={styles.emptyHistory}>
                  No se registran ventas para este producto todavía.
                </div>
              ) : (
                data.ventas.map((v) => (
                  <div key={v.id_detalle_factura} style={styles.historyItem}>
                    <div style={styles.historyItemTop}>
                      <div>
                        <span style={styles.historyItemTitle}>
                          Factura #{v.factura?.numero_factura || v.id_factura}
                        </span>
                        <div style={styles.historySubRow}>
                          <User size={12} color="#64748B" />
                          <span>{v.factura?.cliente?.nombre || 'Cliente general'}</span>
                        </div>
                      </div>
                      <span style={styles.historySubTotal} className="num-mono">
                        ${Number(v.subtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={styles.historyItemBottom}>
                      <span style={styles.historyMeta}>
                        Cantidad: <strong className="num-mono">{v.cantidad}</strong> a <strong className="num-mono">${Number(v.precio_unitario).toFixed(2)}</strong>
                      </span>
                      <span style={styles.historyDate}>
                        {v.factura?.fecha_emision || 'Reciente'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Compras List */}
          {activeTab === 'compras' && (
            <div style={styles.historyList}>
              {data.compras.length === 0 ? (
                <div style={styles.emptyHistory}>
                  No se registran órdenes de compra para este producto todavía.
                </div>
              ) : (
                data.compras.map((c) => (
                  <div key={c.id_detalle_compra} style={styles.historyItem}>
                    <div style={styles.historyItemTop}>
                      <div>
                        <span style={styles.historyItemTitle}>
                          Compra #{c.compra?.numero_compra || c.id_compra}
                        </span>
                        <div style={styles.historySubRow}>
                          <Truck size={12} color="#64748B" />
                          <span>{c.compra?.proveedor?.nombre || 'Proveedor'}</span>
                        </div>
                      </div>
                      <span style={styles.historySubTotal} className="num-mono">
                        ${Number(c.subtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={styles.historyItemBottom}>
                      <span style={styles.historyMeta}>
                        Sano: <strong className="num-mono">{c.cantidad_sana}</strong> (Costo u: ${Number(c.costo_unitario).toFixed(2)})
                      </span>
                      <span style={styles.historyDate}>
                        {c.compra?.fecha_compra || 'Reciente'}
                      </span>
                    </div>
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
    gap: '12px',
  },
  codeTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  productTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  catSubtitle: {
    fontSize: '11px',
    color: '#64748B',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  metricCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '2px',
  },
  metricValGreen: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#059669',
  },
  metricValNavy: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#1E4E79',
  },
  metricValOrange: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#E05A2B',
  },
  metricSub: {
    fontSize: '10px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  stockBanner: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stockTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  stockSubtitle: {
    fontSize: '11px',
    color: '#475569',
    marginTop: '1px',
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
  historyItemTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E4E79',
  },
  historySubRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  historySubTotal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  historyItemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#64748B',
  },
  historyMeta: {
    color: '#334155',
  },
  historyDate: {
    color: '#94A3B8',
  }
};
