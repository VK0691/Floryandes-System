import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Printer,
  Download,
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { getFacturas, getFacturaDetalle } from '../services/facturasService';
import { useAuth, ROLES } from '../context/AuthContext';
import FacturaDetalleModal from './FacturaDetalleModal';
import { descargarFacturaPDF, imprimirFacturaPDF } from '../utils/facturaPdfGenerator';

export default function FacturasList({ onNuevaFactura }) {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === ROLES.ADMIN;

  const [facturas, setFacturas] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('ALL');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Selected for detail modal
  const [selectedFacturaId, setSelectedFacturaId] = useState(null);

  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      const res = await getFacturas({
        search: searchTerm,
        estado: filterEstado,
        fechaDesde,
        fechaHasta,
        page,
        pageSize: 10,
      });

      setFacturas(res.facturas);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage);
    } catch (err) {
      console.error('Error loading facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm, filterEstado, fechaDesde, fechaHasta]);

  const handleQuickPrint = async (fId, e) => {
    if (e) e.stopPropagation();
    try {
      const fullFactura = await getFacturaDetalle(fId);
      imprimirFacturaPDF(fullFactura);
    } catch (err) {
      console.error('Error printing factura PDF:', err);
    }
  };

  const handleQuickPdf = async (fId, e) => {
    if (e) e.stopPropagation();
    try {
      const fullFactura = await getFacturaDetalle(fId);
      descargarFacturaPDF(fullFactura);
    } catch (err) {
      console.error('Error downloading factura PDF:', err);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Top Header */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Facturación & Ventas</h2>
          <p style={styles.subtitle}>
            Historial de facturas emitidas, control de pagos, abonos y saldos pendientes
          </p>
        </div>

        <button onClick={onNuevaFactura} style={styles.newBtn}>
          <Plus size={16} />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            maxLength={100}
            placeholder="Buscar por # factura o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>
              ×
            </button>
          )}
        </div>

        <div style={styles.filterControls}>
          {/* Estado filter */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Todos los estados</option>
              <option value="PAGADA">Pagada</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          {/* Fecha Desde - Hasta */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={styles.dateFilterInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={styles.dateFilterInput}
            />
          </div>

          {(searchTerm || filterEstado !== 'ALL' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterEstado('ALL');
                setFechaDesde('');
                setFechaHasta('');
              }}
              style={styles.resetFilterBtn}
              title="Restablecer filtros"
            >
              <RotateCcw size={13} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>
            <span>Cargando facturas registradas...</span>
          </div>
        ) : facturas.length === 0 ? (
          <div style={styles.emptyBox}>
            <Receipt size={36} color="#CBD5E1" />
            <p style={styles.emptyTitle}>No se encontraron facturas</p>
            <p style={styles.emptySubtitle}>
              {searchTerm || filterEstado !== 'ALL' || fechaDesde || fechaHasta
                ? 'Intenta ajustar los filtros de búsqueda o rango de fechas.'
                : 'Aún no hay facturas emitidas. Haz clic en "Nueva Factura" para registrar una venta.'}
            </p>
          </div>
        ) : (
          <>
            <div style={styles.tableWrapper} className="table-responsive">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}># FACTURA</th>
                    <th style={styles.th}>FECHA</th>
                    <th style={styles.th}>CLIENTE / RAZÓN SOCIAL</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>TOTAL FACTURA</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>ABONO</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>SALDO PENDIENTE</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => {
                    const isAnulada = f.estado === 'ANULADA';
                    const isPagada = f.estado === 'PAGADA';
                    const isPendiente = f.estado === 'PENDIENTE';

                    return (
                      <tr
                        key={f.id_factura}
                        onClick={() => setSelectedFacturaId(f.id_factura)}
                        style={{
                          ...styles.tr,
                          opacity: isAnulada ? 0.6 : 1,
                          backgroundColor: isAnulada ? '#FEF2F2' : '#FFFFFF',
                        }}
                      >
                        <td style={styles.tdId} className="num-mono">
                          <span style={isAnulada ? styles.idAnulado : styles.idTag}>
                            #{f.numero_factura}
                          </span>
                        </td>
                        <td style={styles.td} className="num-mono">
                          {f.fecha_emision}
                        </td>
                        <td style={styles.tdName}>
                          <div style={styles.clientGroup}>
                            <span style={styles.clientTitle}>{f.cliente?.nombre || 'Cliente General'}</span>
                            {f.cliente?.ruc && (
                              <span style={styles.clientRuc} className="num-mono">
                                {f.cliente.ruc}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                          <strong>${Number(f.total_factura).toFixed(2)}</strong>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                          <span style={{ color: '#059669' }}>
                            ${Number(f.total_abonado || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                          <span
                            style={{
                              fontWeight: '700',
                              color: isAnulada
                                ? '#94A3B8'
                                : Number(f.saldo_pendiente) > 0
                                ? '#DC2626'
                                : '#059669',
                            }}
                          >
                            ${Number(f.saldo_pendiente || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: isAnulada
                                ? '#FEE2E2'
                                : isPagada
                                ? '#DCFCE7'
                                : '#FEF3C7',
                              color: isAnulada
                                ? '#DC2626'
                                : isPagada
                                ? '#15803D'
                                : '#B45309',
                            }}
                          >
                            {f.estado}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionsGroup} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedFacturaId(f.id_factura)}
                              style={styles.actionBtn}
                              title="Ver detalle completo de factura"
                            >
                              <Eye size={15} color="#1E4E79" />
                            </button>

                            <button
                              onClick={(e) => handleQuickPdf(f.id_factura, e)}
                              style={styles.actionBtn}
                              title="Descargar Factura en PDF"
                            >
                              <Download size={15} color="#1E4E79" />
                            </button>

                            <button
                              onClick={(e) => handleQuickPrint(f.id_factura, e)}
                              style={styles.actionBtn}
                              title="Imprimir Factura en PDF"
                            >
                              <Printer size={15} color="#475569" />
                            </button>

                            {isAdmin && !isAnulada && (
                              <button
                                onClick={() => setSelectedFacturaId(f.id_factura)}
                                style={styles.actionBtn}
                                title="Anular factura"
                              >
                                <Ban size={15} color="#DC2626" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={styles.paginationBar}>
              <span style={styles.paginationInfo}>
                Mostrando {facturas.length} de {totalCount} facturas
              </span>

              <div style={styles.paginationControls}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => loadData(currentPage - 1)}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage <= 1 ? 0.4 : 1,
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <span style={styles.pageNumber}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => loadData(currentPage + 1)}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage >= totalPages ? 0.4 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <FacturaDetalleModal
        facturaId={selectedFacturaId}
        isOpen={!!selectedFacturaId}
        onClose={() => setSelectedFacturaId(null)}
        onFacturaActualizada={() => loadData()}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.25)',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  searchBox: {
    flex: 1,
    minWidth: '240px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '0 12px',
  },
  searchInput: {
    width: '100%',
    padding: '9px 0',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  filterControls: {
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
    color: '#64748B',
  },
  filterSelect: {
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    color: '#1E293B',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  dateFilterInput: {
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    color: '#1E293B',
  },
  resetFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    padding: '7px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
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
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
  },
  tdId: {
    padding: '12px 14px',
  },
  idTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  idAnulado: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    textDecoration: 'line-through',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  tdName: {
    padding: '12px 14px',
  },
  clientGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  clientTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  clientRuc: {
    fontSize: '11px',
    color: '#64748B',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  actionsGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '4px',
  },
  actionBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  paginationBar: {
    padding: '12px 18px',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  paginationInfo: {
    fontSize: '12px',
    color: '#64748B',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '12px',
    fontWeight: '600',
  },
  pageNumber: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingBox: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748B',
    fontSize: '14px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#E05A2B',
    animation: 'spin 0.8s linear infinite',
  },
  emptyBox: {
    padding: '50px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
    marginTop: '6px',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#64748B',
    maxWidth: '380px',
  }
};
