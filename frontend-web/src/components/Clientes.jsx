import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import {
  getClientes,
  createCliente,
  updateCliente,
  toggleActivoCliente,
} from '../services/clientesService';
import ClienteModal from './ClienteModal';
import ClienteDetallePanel from './ClienteDetallePanel';

export default function Clientes({ onFacturarCliente }) {
  const [clientes, setClientes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('ALL');
  const [filterSaldo, setFilterSaldo] = useState('ALL');
  const [showInactive, setShowInactive] = useState(false);

  // Modals & Panels state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedClienteId, setSelectedClienteId] = useState(null);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      const res = await getClientes({
        search: searchTerm,
        tipo: filterTipo,
        saldoFilter: filterSaldo,
        includeInactive: showInactive,
        page,
        pageSize: 10,
      });

      setClientes(res.clientes);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage);

      // Si el cliente seleccionado fue eliminado o no existe, resetear panel
      if (selectedClienteId && !res.clientes.some(c => c.id_cliente === selectedClienteId)) {
        // Mantener si fue por paginación o filtro
      }
    } catch (err) {
      console.error('Error loading clientes:', err);
      showToast('Error al conectar con la base de datos de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search / trigger on filter change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm, filterTipo, filterSaldo, showInactive]);

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cliente, e) => {
    if (e) e.stopPropagation();
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleSaveCliente = async (formData, id) => {
    if (id) {
      // Editar
      const res = await updateCliente(id, formData);
      if (res.success) {
        showToast(`Cliente "${formData.nombre}" actualizado correctamente.`);
        loadData();
      } else {
        throw new Error(res.error);
      }
    } else {
      // Crear
      const res = await createCliente(formData);
      if (res.success) {
        showToast(`Cliente "${formData.nombre}" registrado con éxito.`);
        loadData(1);
      } else {
        throw new Error(res.error);
      }
    }
  };

  const handleConfirmToggleActivo = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const nuevoEstado = !deleteTarget.activo;
      const res = await toggleActivoCliente(deleteTarget.id_cliente, nuevoEstado);

      if (res.success) {
        showToast(
          nuevoEstado
            ? `Cliente "${deleteTarget.nombre}" reactivado correctamente.`
            : `Cliente "${deleteTarget.nombre}" desactivado.`
        );
        if (selectedClienteId === deleteTarget.id_cliente) {
          setSelectedClienteId(null);
        }
        loadData();
      } else {
        showToast(res.error, 'error');
      }
    } catch (err) {
      showToast('Error al actualizar el estado del cliente', 'error');
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            borderColor: toast.type === 'error' ? '#FECACA' : '#A7F3D0',
            color: toast.type === 'error' ? '#991B1B' : '#065F46',
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Clientes</h2>
          <p style={styles.subtitle}>
            Directorio comercial, cuentas corrientes e historial de compras
          </p>
        </div>

        <button onClick={handleOpenCreate} style={styles.newBtn}>
          <UserPlus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.filterCard}>
        {/* Search */}
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>
              ×
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div style={styles.filterControls}>
          {/* Tipo de cliente */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Tipo:</span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Todos los tipos</option>
              <option value="MINORISTA">Minorista</option>
              <option value="MAYORISTA">Mayorista</option>
              <option value="CORPORATIVO">Corporativo</option>
            </select>
          </div>

          {/* Saldo filter */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Saldo:</span>
            <select
              value={filterSaldo}
              onChange={(e) => setFilterSaldo(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Todos los saldos</option>
              <option value="DEUDA">Con deuda pendiente</option>
              <option value="SIN_DEUDA">Al día (Sin deuda)</option>
            </select>
          </div>

          {/* Inactives toggle */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Mostrar inactivos</span>
          </label>
        </div>
      </div>

      {/* Main Content Layout: Table on Left + Detail Panel on Right (Mockup p. 24) */}
      <div style={{
        ...styles.mainGrid,
        gridTemplateColumns: selectedClienteId ? '1fr 380px' : '1fr',
      }}>
        {/* Table Container */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <span>Consultando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <div style={styles.emptyBox}>
              <Users size={36} color="#CBD5E1" />
              <p style={styles.emptyTitle}>No se encontraron clientes</p>
              <p style={styles.emptySubtitle}>
                {searchTerm || filterTipo !== 'ALL' || filterSaldo !== 'ALL'
                  ? 'Intenta ajustar los criterios de búsqueda o filtros.'
                  : 'Aún no hay clientes registrados. Haz clic en "Nuevo Cliente" para agregar uno.'}
              </p>
            </div>
          ) : (
            <>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={styles.th}>NOMBRE / RAZÓN SOCIAL</th>
                      <th style={styles.th}>RUC / CÉDULA</th>
                      <th style={styles.th}>TELÉFONO</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>SALDO ACTUAL</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c) => {
                      const isSelected = selectedClienteId === c.id_cliente;
                      return (
                        <tr
                          key={c.id_cliente}
                          onClick={() => setSelectedClienteId(c.id_cliente)}
                          style={{
                            ...styles.tr,
                            ...(isSelected ? styles.trSelected : {}),
                            ...(!c.activo ? styles.trInactive : {}),
                          }}
                        >
                          <td style={styles.tdName}>
                            <div style={styles.nameBlock}>
                              <span style={styles.clientTitle}>{c.nombre}</span>
                              <span style={styles.clientTypeTag}>{c.tipo_cliente}</span>
                            </div>
                          </td>
                          <td style={styles.td} className="num-mono">
                            {c.ruc || '—'}
                          </td>
                          <td style={styles.td}>
                            {c.telefono ? (
                              <span style={styles.phoneTag}>
                                <Phone size={12} color="#64748B" />
                                <span className="num-mono">{c.telefono}</span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                            <span
                              style={
                                Number(c.saldo_actual) > 0
                                  ? styles.saldoDeuda
                                  : styles.saldoLimpio
                              }
                            >
                              ${Number(c.saldo_actual || 0).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span
                              style={{
                                ...styles.activeStatusTag,
                                backgroundColor: c.activo ? '#ECFDF5' : '#FEF2F2',
                                color: c.activo ? '#059669' : '#DC2626',
                              }}
                            >
                              {c.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                              {/* Ver detalle */}
                              <button
                                onClick={() => setSelectedClienteId(c.id_cliente)}
                                style={styles.actionBtn}
                                title="Ver historial y estado de cuenta"
                              >
                                <Eye size={15} color="#1E4E79" />
                              </button>

                              {/* Editar */}
                              <button
                                onClick={(e) => handleOpenEdit(c, e)}
                                style={styles.actionBtn}
                                title="Editar datos del cliente"
                              >
                                <Edit2 size={15} color="#475569" />
                              </button>

                              {/* Facturar */}
                              <button
                                onClick={() => {
                                  if (onFacturarCliente) onFacturarCliente(c);
                                }}
                                style={styles.actionBtn}
                                title="Facturar a este cliente"
                              >
                                <Receipt size={15} color="#E05A2B" />
                              </button>

                              {/* Eliminar (desactivar) / Reactivar */}
                              <button
                                onClick={() => setDeleteTarget(c)}
                                style={styles.actionBtn}
                                title={c.activo ? 'Desactivar cliente' : 'Reactivar cliente'}
                              >
                                {c.activo ? (
                                  <Trash2 size={15} color="#DC2626" />
                                ) : (
                                  <RotateCcw size={15} color="#059669" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div style={styles.paginationBar}>
                <span style={styles.paginationInfo}>
                  Mostrando {clientes.length} de {totalCount} clientes
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

        {/* Right Detail Panel (Mockup p. 24) */}
        {selectedClienteId && (
          <ClienteDetallePanel
            clienteId={selectedClienteId}
            onClose={() => setSelectedClienteId(null)}
            onFacturar={(c) => {
              if (onFacturarCliente) onFacturarCliente(c);
            }}
            onClienteUpdated={() => loadData()}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <ClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={editingCliente}
      />

      {/* Confirm Deactivation / Reactivation Modal */}
      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>
              {deleteTarget.activo ? 'Desactivar Cliente' : 'Reactivar Cliente'}
            </h3>
            <p style={styles.confirmDesc}>
              {deleteTarget.activo ? (
                <>
                  ¿Está seguro de que desea desactivar a <strong>{deleteTarget.nombre}</strong>?
                  El cliente ya no aparecerá en las búsquedas cotidianas de facturación, pero su historial y saldo se conservarán intactos.
                </>
              ) : (
                <>
                  ¿Desea reactivar a <strong>{deleteTarget.nombre}</strong> para habilitarlo en la facturación?
                </>
              )}
            </p>

            <div style={styles.confirmActions}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteTarget(null)}
                style={styles.cancelConfirmBtn}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmToggleActivo}
                style={{
                  ...styles.submitConfirmBtn,
                  backgroundColor: deleteTarget.activo ? '#DC2626' : '#059669',
                }}
              >
                {actionLoading
                  ? 'Procesando...'
                  : deleteTarget.activo
                  ? 'Sí, Desactivar'
                  : 'Sí, Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
    animation: 'fadeIn 0.2s ease-out',
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
    gap: '8px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.25)',
    transition: 'all 0.15s ease',
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
    minWidth: '260px',
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
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  mainGrid: {
    display: 'grid',
    gap: '20px',
    alignItems: 'start',
    transition: 'grid-template-columns 0.25s ease',
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
    padding: '12px 16px',
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
  trSelected: {
    backgroundColor: '#FFF7ED',
  },
  trInactive: {
    opacity: 0.55,
    backgroundColor: '#FAFAFA',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  tdName: {
    padding: '12px 16px',
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  clientTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  clientTypeTag: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  phoneTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#475569',
  },
  saldoDeuda: {
    color: '#DC2626',
    fontWeight: '800',
  },
  saldoLimpio: {
    color: '#059669',
    fontWeight: '600',
  },
  activeStatusTag: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  actionButtons: {
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
  },
  modalOverlay: {
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
    zIndex: 110,
    padding: '16px',
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '24px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  confirmTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '8px',
  },
  confirmDesc: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelConfirmBtn: {
    padding: '8px 14px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitConfirmBtn: {
    padding: '8px 16px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  }
};
