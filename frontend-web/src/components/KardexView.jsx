import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sliders,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { getKardexMovimientos, exportarKardexAExcel } from '../services/inventarioService';
import { useAuth, ROLES } from '../context/AuthContext';

export default function KardexView({
  productos = [],
  preselectedProductId = 'ALL',
  onOpenAjuste,
}) {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === ROLES.ADMIN;

  const [movimientos, setMovimientos] = useState([]);
  const [allFilteredMovimientos, setAllFilteredMovimientos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || 'ALL');
  const [filterTipo, setFilterTipo] = useState('ALL');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
    }
  }, [preselectedProductId]);

  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      const res = await getKardexMovimientos({
        id_producto: selectedProductId,
        tipo: filterTipo,
        fechaDesde,
        fechaHasta,
        search: searchTerm,
        page,
        pageSize: 15,
      });

      setMovimientos(res.movimientos || []);
      setAllFilteredMovimientos(res.allFilteredMovimientos || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage || 1);
    } catch (err) {
      console.error('Error cargando Kardex:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [selectedProductId, filterTipo, fechaDesde, fechaHasta, searchTerm]);

  const handleResetFilters = () => {
    setSelectedProductId('ALL');
    setFilterTipo('ALL');
    setFechaDesde('');
    setFechaHasta('');
    setSearchTerm('');
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const dataToExport = allFilteredMovimientos.length > 0 ? allFilteredMovimientos : movimientos;
      exportarKardexAExcel(dataToExport, 'Kardex_Inventario_Floryandes');
    } catch (err) {
      console.error('Error al exportar Kardex:', err);
      alert('Ocurrió un error al generar el archivo Excel.');
    } finally {
      setExporting(false);
    }
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'ENTRADA':
        return { bg: '#D1FAE5', color: '#065F46', text: 'ENTRADA' };
      case 'SALIDA':
        return { bg: '#DBEAFE', color: '#1E40AF', text: 'SALIDA' };
      case 'AJUSTE':
        return { bg: '#FEF3C7', color: '#92400E', text: 'AJUSTE' };
      case 'PERDIDA':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'PÉRDIDA' };
      default:
        return { bg: '#F1F5F9', color: '#475569', text: tipo || 'DESCONOCIDO' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Action Bar */}
      <div style={styles.topBar}>
        <div>
          <h3 style={styles.title}>Kardex de Movimientos de Inventario</h3>
          <p style={styles.subtitle}>
            Auditoría completa de todas las entradas por compras, salidas por facturación, pérdidas y ajustes
          </p>
        </div>

        <div style={styles.topActions}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading || totalCount === 0}
            style={{
              ...styles.btnExcel,
              ...(totalCount === 0 ? styles.btnDisabled : {}),
            }}
            title="Exportar movimientos filtrados a formato Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} />
            <span>{exporting ? 'Generando...' : 'Exportar a Excel'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAjuste}
              style={styles.btnAjuste}
            >
              <Sliders size={15} />
              <span>Nuevo Ajuste Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <div style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Buscar por referencia, código o producto..."
            value={searchTerm}
            maxLength={100}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersRow}>
          {/* Producto */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Producto:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre} {p.codigo ? `[${p.codigo}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Movimiento */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Tipo:</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">Todos los tipos</option>
              <option value="ENTRADA">ENTRADA (Compras / Ingresos)</option>
              <option value="SALIDA">SALIDA (Ventas / Facturas)</option>
              <option value="AJUSTE">AJUSTE (Conteo físico)</option>
              <option value="PERDIDA">PÉRDIDA (Mermas / Daños)</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={styles.dateInput}
            />
          </div>

          {/* Fecha Hasta */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={styles.dateInput}
            />
          </div>

          {/* Reset Filters */}
          {(selectedProductId !== 'ALL' || filterTipo !== 'ALL' || fechaDesde || fechaHasta || searchTerm) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={styles.btnReset}
              title="Limpiar filtros"
            >
              <RotateCcw size={14} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div style={styles.tableCard}>
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha y Hora</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Tipo</th>
                <th style={styles.th}>Producto</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Cantidad</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Costo Unit.</th>
                <th style={styles.th}>Referencia / Motivo</th>
                <th style={styles.th}>Usuario Responsable</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.tdLoading}>
                    <div style={styles.spinner} />
                    <span>Cargando movimientos de Kardex...</span>
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.tdEmpty}>
                    No se encontraron movimientos registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => {
                  const badge = getTipoBadge(m.tipo_movimiento);
                  const isEntrada = m.tipo_movimiento === 'ENTRADA';
                  const isSalida = m.tipo_movimiento === 'SALIDA';
                  const isPerdida = m.tipo_movimiento === 'PERDIDA';
                  const isAjuste = m.tipo_movimiento === 'AJUSTE';

                  const cantNum = parseFloat(m.cantidad) || 0;

                  return (
                    <tr key={m.id_movimiento} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.dateRow}>
                          <Calendar size={13} color="#64748B" />
                          <span>
                            {m.fecha
                              ? new Date(m.fecha).toLocaleString('es-EC', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </span>
                        </div>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.prodInfo}>
                          <span style={styles.prodName}>
                            {m.producto?.nombre || 'Producto Desconocido'}
                          </span>
                          {m.producto?.codigo && (
                            <span style={styles.prodCode}>{m.producto.codigo}</span>
                          )}
                        </div>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span
                          style={{
                            ...styles.cantBadge,
                            color: isEntrada
                              ? '#059669'
                              : isSalida || isPerdida
                              ? '#DC2626'
                              : '#D97706',
                          }}
                          className="num-mono"
                        >
                          {isEntrada ? `+${cantNum}` : isSalida || isPerdida ? `-${cantNum}` : `${cantNum}`}
                        </span>
                        <span style={styles.unitText}>
                          {m.producto?.unidad_medida || 'bonches'}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                        ${parseFloat(m.costo_unitario || 0).toFixed(2)}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.refText}>{m.referencia || 'Sin referencia'}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.userText}>{m.usuario?.nombre || 'Sistema'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={styles.pagination}>
          <span style={styles.pageInfo}>
            Mostrando <b>{movimientos.length}</b> de <b>{totalCount}</b> movimientos
          </span>

          <div style={styles.pageBtns}>
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => {
                const prev = currentPage - 1;
                setCurrentPage(prev);
                loadData(prev);
              }}
              style={{
                ...styles.pageBtn,
                ...(currentPage <= 1 ? styles.pageBtnDisabled : {}),
              }}
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <span style={styles.pageIndicator}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => {
                const next = currentPage + 1;
                setCurrentPage(next);
                loadData(next);
              }}
              style={{
                ...styles.pageBtn,
                ...(currentPage >= totalPages ? styles.pageBtnDisabled : {}),
              }}
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnExcel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  btnAjuste: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(30, 78, 121, 0.2)',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    color: '#0F172A',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
  },
  filterItem: {
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
  dateInput: {
    padding: '6px 10px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  btnReset: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#F8FAFC',
    padding: '12px 14px',
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
    padding: '12px 14px',
    color: '#1E293B',
    verticalAlign: 'middle',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  badge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 7px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
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
  cantBadge: {
    fontWeight: '800',
    fontSize: '14px',
    display: 'inline-block',
  },
  unitText: {
    fontSize: '11px',
    color: '#94A3B8',
    display: 'block',
  },
  refText: {
    fontSize: '12px',
    color: '#334155',
  },
  userText: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  tdLoading: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#1E4E79',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 8px auto',
  },
  tdEmpty: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    fontStyle: 'italic',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    flexWrap: 'wrap',
    gap: '10px',
  },
  pageInfo: {
    fontSize: '12px',
    color: '#64748B',
  },
  pageBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pageIndicator: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    padding: '0 4px',
  },
};

