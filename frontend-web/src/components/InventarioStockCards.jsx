import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  BarChart2,
  Sliders,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';

export default function InventarioStockCards({
  productos = [],
  metricas = {},
  loading = false,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  onOpenAjuste,
  onVerKardexProducto,
}) {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === ROLES.ADMIN;
  const [showChart, setShowChart] = useState(true);

  // Sorting for chart: sort products by lowest ratio of stock to minimum
  const chartProducts = [...productos]
    .sort((a, b) => (a.stock_actual_num / (a.stock_minimo_num || 1)) - (b.stock_actual_num / (b.stock_minimo_num || 1)))
    .slice(0, 12); // Top 12 products for chart readability

  const maxStockForChart = Math.max(
    ...chartProducts.map(p => Math.max(p.stock_actual_num, p.stock_minimo_num)),
    20
  );

  return (
    <div style={styles.container}>
      {/* 4 Summary KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiTitle}>Total Existencias</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: '#EFF6FF' }}>
              <Package size={18} color="#1E4E79" />
            </div>
          </div>
          <span style={styles.kpiVal} className="num-mono">
            {metricas.totalUnidades || 0}
          </span>
          <span style={styles.kpiSub}>
            En {metricas.totalProductos || 0} productos activos
          </span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiTitle}>Valorización Total</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: '#ECFDF5' }}>
              <DollarSign size={18} color="#059669" />
            </div>
          </div>
          <span style={{ ...styles.kpiVal, color: '#059669' }} className="num-mono">
            ${(metricas.valorTotal || 0).toFixed(2)}
          </span>
          <span style={styles.kpiSub}>
            A costo promedio ponderado
          </span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiTitle}>Productos en Stock Normal</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: '#F0FDF4' }}>
              <CheckCircle size={18} color="#16A34A" />
            </div>
          </div>
          <span style={{ ...styles.kpiVal, color: '#16A34A' }} className="num-mono">
            {metricas.normalCount || 0}
          </span>
          <span style={styles.kpiSub}>
            Superan el stock mínimo de seguridad
          </span>
        </div>

        <div
          style={{
            ...styles.kpiCard,
            borderColor: (metricas.bajoStockCount || 0) + (metricas.agotadosCount || 0) > 0 ? '#FCA5A5' : '#E2E8F0',
            backgroundColor: (metricas.bajoStockCount || 0) + (metricas.agotadosCount || 0) > 0 ? '#FFF5F5' : '#FFFFFF',
          }}
        >
          <div style={styles.kpiHeader}>
            <span style={{ ...styles.kpiTitle, color: '#DC2626' }}>Alertas de Reabastecimiento</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: '#FEF2F2' }}>
              <AlertTriangle size={18} color="#DC2626" />
            </div>
          </div>
          <span style={{ ...styles.kpiVal, color: '#DC2626' }} className="num-mono">
            {(metricas.bajoStockCount || 0) + (metricas.agotadosCount || 0)}
          </span>
          <span style={{ ...styles.kpiSub, color: '#991B1B' }}>
            {metricas.bajoStockCount || 0} bajo mínimo | {metricas.agotadosCount || 0} agotados
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Comparativo (Historia 7.1) */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <div style={styles.chartHeaderLeft}>
            <BarChart2 size={18} color="#1E4E79" />
            <div>
              <h3 style={styles.chartTitle}>Gráfico Comparativo: Stock Actual vs. Stock Mínimo</h3>
              <p style={styles.chartSubtitle}>
                Monitoreo visual del margen de seguridad de los productos en almacén
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChart(prev => !prev)}
            style={styles.btnToggleChart}
          >
            {showChart ? 'Ocultar Gráfica' : 'Mostrar Gráfica'}
          </button>
        </div>

        {showChart && (
          <div style={styles.chartBody}>
            {/* Legend */}
            <div style={styles.legendRow}>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: '#059669' }} />
                <span>Stock Actual Saludable</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: '#DC2626' }} />
                <span>Stock Bajo Mínimo (Alerta)</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: '#94A3B8', border: '1px dashed #475569' }} />
                <span>Nivel de Stock Mínimo Requerido</span>
              </div>
            </div>

            {/* Bars container */}
            <div style={styles.barsContainer}>
              {chartProducts.map((p) => {
                const actual = p.stock_actual_num;
                const minimo = p.stock_minimo_num;
                const isLow = actual < minimo;
                const actualHeightPct = Math.max(6, Math.min(100, Math.round((actual / maxStockForChart) * 100)));
                const minHeightPct = Math.max(6, Math.min(100, Math.round((minimo / maxStockForChart) * 100)));

                return (
                  <div key={p.id_producto} style={styles.barColumn}>
                    {/* Value tags on top */}
                    <span style={{ ...styles.barTopLabel, color: isLow ? '#DC2626' : '#059669' }}>
                      {actual}
                    </span>

                    {/* Visual Bars Container */}
                    <div style={styles.barsTrack}>
                      {/* Bar 1: Stock Actual */}
                      <div
                        style={{
                          ...styles.barActual,
                          height: `${actualHeightPct}%`,
                          backgroundColor: isLow ? '#DC2626' : '#059669',
                        }}
                        title={`Stock Actual: ${actual} | Mínimo: ${minimo}`}
                      />
                      {/* Bar 2: Stock Mínimo Marker */}
                      <div
                        style={{
                          ...styles.barMinimo,
                          height: `${minHeightPct}%`,
                        }}
                        title={`Stock Mínimo Requerido: ${minimo}`}
                      />
                    </div>

                    {/* Product Name below bar */}
                    <span style={styles.barProductName} title={p.nombre}>
                      {p.nombre.length > 14 ? `${p.nombre.slice(0, 12)}...` : p.nombre}
                    </span>
                    <span style={styles.barMinLabel}>
                      Mín: {minimo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o variedad..."
            value={searchTerm}
            maxLength={100}
            onChange={(e) => onSearchChange(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Estado de Stock:</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">Todos los estados</option>
              <option value="NORMAL">Normal (Saludable)</option>
              <option value="BAJO">Bajo Stock (Alerta)</option>
              <option value="AGOTADO">Agotados (Stock 0)</option>
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAjuste}
              style={styles.btnAjuste}
            >
              <Sliders size={15} />
              <span>Ajustar Stock Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Cards Grid (Historia 7.1) */}
      {loading ? (
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Cargando estado del inventario...</p>
        </div>
      ) : productos.length === 0 ? (
        <div style={styles.emptyCard}>
          <Package size={36} color="#94A3B8" />
          <p style={styles.emptyText}>No se encontraron productos con el filtro aplicado.</p>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {productos.map((p) => {
            const actual = p.stock_actual_num;
            const minimo = p.stock_minimo_num;
            const isLow = p.estado_stock === 'BAJO';
            const isAgotado = p.estado_stock === 'AGOTADO';

            const cardBorderColor = isAgotado
              ? '#EF4444'
              : isLow
              ? '#F87171'
              : '#E2E8F0';

            const cardBgColor = isAgotado
              ? '#FEF2F2'
              : isLow
              ? '#FFFBFB'
              : '#FFFFFF';

            const pctRatio = minimo > 0 ? Math.min(100, Math.round((actual / minimo) * 100)) : 100;

            return (
              <div
                key={p.id_producto}
                style={{
                  ...styles.productCard,
                  borderColor: cardBorderColor,
                  backgroundColor: cardBgColor,
                }}
              >
                {/* Card Top: Name and Badges */}
                <div style={styles.cardTop}>
                  <div>
                    {p.codigo && <span style={styles.prodCode}>{p.codigo}</span>}
                    <h4 style={styles.prodName}>{p.nombre}</h4>
                    {p.variedad && (
                      <span style={styles.prodVar}>Variedad: {p.variedad}</span>
                    )}
                  </div>

                  <div>
                    {isAgotado ? (
                      <span style={{ ...styles.badge, backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        AGOTADO
                      </span>
                    ) : isLow ? (
                      <span style={{ ...styles.badge, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        BAJO STOCK
                      </span>
                    ) : (
                      <span style={{ ...styles.badge, backgroundColor: '#DCFCE7', color: '#166534' }}>
                        NORMAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Numbers */}
                <div style={styles.stockMainRow}>
                  <div>
                    <span style={styles.stockLabel}>Stock Actual</span>
                    <div style={styles.stockNumRow}>
                      <span
                        style={{
                          ...styles.stockBigNum,
                          color: isAgotado ? '#991B1B' : isLow ? '#DC2626' : '#0F172A',
                        }}
                        className="num-mono"
                      >
                        {actual}
                      </span>
                      <span style={styles.unitText}>{p.unidad_medida || 'bonches'}</span>
                    </div>
                  </div>

                  <div style={styles.minStockBox}>
                    <span style={styles.minStockLabel}>Stock Mínimo</span>
                    <span style={styles.minStockVal} className="num-mono">
                      {minimo} {p.unidad_medida || 'bonches'}
                    </span>
                  </div>
                </div>

                {/* Visual Ratio Progress Bar */}
                <div style={styles.progressSection}>
                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${pctRatio}%`,
                        backgroundColor: isAgotado ? '#DC2626' : isLow ? '#EF4444' : '#059669',
                      }}
                    />
                  </div>
                  <div style={styles.progressLabels}>
                    <span style={styles.progressLabelLeft}>
                      {isAgotado
                        ? 'Sin existencias disponibles'
                        : isLow
                        ? `Déficit de ${minimo - actual} ${p.unidad_medida || 'bonches'}`
                        : `${pctRatio}% del nivel mínimo`}
                    </span>
                    <span style={styles.progressLabelRight}>
                      Valor: ${(p.valor_inventario || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => onVerKardexProducto && onVerKardexProducto(p.id_producto)}
                    style={styles.btnCardKardex}
                  >
                    <span>Ver Kardex</span>
                    <ArrowUpRight size={14} />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenAjuste && onOpenAjuste(p)}
                      style={styles.btnCardAjuste}
                    >
                      <span>Ajustar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  kpiIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '4px 0 2px 0',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  chartHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  chartSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  btnToggleChart: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1E4E79',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  chartBody: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    fontSize: '12px',
    color: '#475569',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  barsContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '14px',
    overflowX: 'auto',
    padding: '16px 8px 8px 8px',
    minHeight: '220px',
    borderBottom: '1px solid #E2E8F0',
  },
  barColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '1 0 70px',
    maxWidth: '85px',
    height: '190px',
    justifyContent: 'flex-end',
  },
  barTopLabel: {
    fontSize: '11px',
    fontWeight: '700',
    marginBottom: '4px',
    fontFamily: 'monospace',
  },
  barsTrack: {
    width: '36px',
    height: '140px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '3px',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px 6px 0 0',
    padding: '0 2px',
  },
  barActual: {
    width: '16px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  barMinimo: {
    width: '12px',
    backgroundColor: '#CBD5E1',
    borderTop: '2px solid #64748B',
    borderRadius: '3px 3px 0 0',
    transition: 'height 0.3s ease',
  },
  barProductName: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#334155',
    marginTop: '8px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  barMinLabel: {
    fontSize: '9px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: '1 1 260px',
    maxWidth: '400px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    color: '#0F172A',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  selectInput: {
    padding: '6px 10px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  btnAjuste: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(30, 78, 121, 0.2)',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  productCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  prodCode: {
    fontSize: '11px',
    color: '#64748B',
    fontFamily: 'monospace',
    fontWeight: '600',
    display: 'block',
  },
  prodName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '2px 0 0 0',
  },
  prodVar: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
    marginTop: '2px',
  },
  badge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 7px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
  },
  stockMainRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
  },
  stockLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  stockNumRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginTop: '2px',
  },
  stockBigNum: {
    fontSize: '26px',
    fontWeight: '800',
  },
  unitText: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  minStockBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  minStockLabel: {
    fontSize: '10px',
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  minStockVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressTrack: {
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
  },
  progressLabelLeft: {
    color: '#64748B',
    fontWeight: '500',
  },
  progressLabelRight: {
    color: '#059669',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '10px',
    marginTop: '4px',
  },
  btnCardKardex: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1E4E79',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnCardAjuste: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    gap: '10px',
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
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '48px 16px',
    gap: '10px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
};

