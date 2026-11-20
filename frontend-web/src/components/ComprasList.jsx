import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Truck,
  RotateCcw,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';
import { getCompras, getProveedores } from '../services/comprasService';
import CompraDetalleModal from './CompraDetalleModal';

export default function ComprasList({ onNuevaCompra }) {
  const [compras, setCompras] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [proveedores, setProveedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('ALL');
  const [filterEstado, setFilterEstado] = useState('ALL');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Selected purchase for modal
  const [selectedCompraId, setSelectedCompraId] = useState(null);

  // Load providers on mount
  useEffect(() => {
    async function loadProvs() {
      try {
        const provs = await getProveedores();
        setProveedores(provs || []);
      } catch (err) {
        console.error('Error cargando proveedores para filtro:', err);
      }
    }
    loadProvs();
  }, []);

  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      const res = await getCompras({
        search: searchTerm,
        id_proveedor: filterProveedor,
        estado: filterEstado,
        fechaDesde,
        fechaHasta,
        page,
        pageSize: 10,
      });

      setCompras(res.compras || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage || 1);
    } catch (err) {
      console.error('Error loading compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm, filterProveedor, filterEstado, fechaDesde, fechaHasta]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProveedor('ALL');
    setFilterEstado('ALL');
    setFechaDesde('');
    setFechaHasta('');
  };

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

  return (
    <div style={styles.container} className="fade-in">
      {/* Top Header */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Módulo de Compras & Proveedores</h2>
          <p style={styles.subtitle}>
            Historial de compras a fincas y distribuidoras, control de recepción, sanos y pérdidas
          </p>
        </div>

        <button
          type="button"
          onClick={onNuevaCompra}
          style={styles.btnPrimary}
        >
          <Plus size={16} />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Buscar por # compra, proveedor u observaciones..."
            value={searchTerm}
            maxLength={100}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterRow}>
          {/* Proveedor Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Proveedor:</label>
            <select
              value={filterProveedor}
              onChange={(e) => setFilterProveedor(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">Todos los proveedores</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre} {p.tipo ? `(${p.tipo})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Estado:</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PAGADA">PAGADA</option>
              <option value="ANULADA">ANULADA</option>
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

          {/* Reset button */}
          {(searchTerm || filterProveedor !== 'ALL' || filterEstado !== 'ALL' || fechaDesde || fechaHasta) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={styles.btnReset}
              title="Restablecer filtros"
            >
              <RotateCcw size={14} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Compras Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}># Compra</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Saldo Pend.</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Estado</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.tdLoading}>
                    <div style={styles.spinner} />
                    <span>Cargando historial de compras...</span>
                  </td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.tdEmpty}>
                    No se encontraron compras con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                compras.map((compra) => {
                  const badge = getStatusBadge(compra.estado);
                  return (
                    <tr
                      key={compra.id_compra}
                      style={styles.tr}
                      onClick={() => setSelectedCompraId(compra.id_compra)}
                    >
                      <td style={styles.td}>
                        <span style={styles.compraNum}>
                          #COMP-{compra.numero_compra}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dateCell}>
                          <Calendar size={13} color="#64748B" />
                          <span>
                            {compra.fecha_compra
                              ? new Date(compra.fecha_compra).toLocaleDateString('es-EC')
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.provInfo}>
                          <span style={styles.provName}>
                            {compra.proveedor?.nombre || 'Proveedor Desconocido'}
                          </span>
                          {compra.proveedor?.tipo && (
                            <span style={styles.provType}>{compra.proveedor.tipo}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#0F172A' }}>
                        ${parseFloat(compra.total_compra || 0).toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: parseFloat(compra.saldo_pendiente) > 0 ? '#DC2626' : '#64748B' }}>
                        ${parseFloat(compra.saldo_pendiente || 0).toFixed(2)}
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
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompraId(compra.id_compra);
                          }}
                          style={styles.actionBtn}
                          title="Ver detalle completo"
                        >
                          <Eye size={15} />
                          <span>Ver Detalle</span>
                        </button>
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
            Mostrando <b>{compras.length}</b> de <b>{totalCount}</b> compras registradas
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

      {/* Modal Detalle de Compra */}
      {selectedCompraId && (
        <CompraDetalleModal
          compraId={selectedCompraId}
          isOpen={Boolean(selectedCompraId)}
          onClose={() => setSelectedCompraId(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(224, 90, 43, 0.25)',
    transition: 'background-color 0.15s ease',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
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
  filterRow: {
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
    cursor: 'pointer',
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
    padding: '12px 16px',
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
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '12px 16px',
    color: '#1E293B',
    verticalAlign: 'middle',
  },
  compraNum: {
    fontWeight: '700',
    color: '#1E4E79',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#475569',
    fontSize: '12px',
  },
  provInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  provName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  provType: {
    fontSize: '11px',
    color: '#64748B',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
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

