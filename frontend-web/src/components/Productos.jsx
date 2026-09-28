import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Package,
  Layers,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';
import {
  getProductos,
  getCategorias,
  createProducto,
  updateProducto,
  toggleActivoProducto,
} from '../services/productosService';
import ProductoModal from './ProductoModal';
import ProductoDetallePanel from './ProductoDetallePanel';
import CategoriasModal from './CategoriasModal';
import ImportarProductosModal from './ImportarProductosModal';

export default function Productos({ initialStockFilter = 'ALL' }) {
  const [productos, setProductos] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Categories list for filter dropdown
  const [categorias, setCategorias] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('ALL');
  const [filterStock, setFilterStock] = useState(initialStockFilter);
  const [showInactive, setShowInactive] = useState(false);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [selectedProductoId, setSelectedProductoId] = useState(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCategories = async () => {
    const cats = await getCategorias(false);
    setCategorias(cats);
  };

  const loadData = async (page = currentPage) => {
    setLoading(true);
    try {
      const res = await getProductos({
        search: searchTerm,
        categoriaId: filterCategoria,
        stockFilter: filterStock,
        includeInactive: showInactive,
        page,
        pageSize: 10,
      });

      setProductos(res.productos);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.currentPage);
    } catch (err) {
      console.error('Error loading productos:', err);
      showToast('Error al consultar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm, filterCategoria, filterStock, showInactive]);

  const handleOpenCreate = () => {
    setEditingProducto(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod, e) => {
    if (e) e.stopPropagation();
    setEditingProducto(prod);
    setModalOpen(true);
  };

  const handleSaveProducto = async (formData, id) => {
    if (id) {
      const res = await updateProducto(id, formData);
      if (res.success) {
        showToast(`Producto [${formData.codigo}] actualizado correctamente.`);
        loadData();
      } else {
        throw new Error(res.error);
      }
    } else {
      const res = await createProducto(formData);
      if (res.success) {
        showToast(`Producto [${formData.codigo}] creado con éxito.`);
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
      const res = await toggleActivoProducto(deleteTarget.id_producto, nuevoEstado);

      if (res.success) {
        showToast(
          nuevoEstado
            ? `Producto [${deleteTarget.codigo}] reactivado.`
            : `Producto [${deleteTarget.codigo}] desactivado.`
        );
        if (selectedProductoId === deleteTarget.id_producto) {
          setSelectedProductoId(null);
        }
        loadData();
      } else {
        showToast(res.error, 'error');
      }
    } catch (err) {
      showToast('Error al actualizar estado del producto', 'error');
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Toast Notification */}
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

      {/* Top Header */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Catálogo de Productos y Servicios</h2>
          <p style={styles.subtitle}>
            Control de bonches, hierbas, precios base, costo promedio y niveles de stock
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setCategoriesModalOpen(true)}
            style={styles.secondaryBtn}
            title="Administrar categorías"
          >
            <Layers size={15} />
            <span>Categorías</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            style={styles.secondaryBtn}
            title="Importar catálogo desde CSV"
          >
            <FileSpreadsheet size={15} />
            <span>Importar CSV</span>
          </button>

          <button onClick={handleOpenCreate} style={styles.newBtn}>
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Buscar por código o nombre del producto..."
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

        <div style={styles.filterControls}>
          {/* Categoría */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Categoría:</span>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Stock */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Nivel de Stock:</span>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">Todos los estados</option>
              <option value="BAJO">Alerta: Stock Bajo</option>
              <option value="NORMAL">Stock Normal</option>
              <option value="AGOTADO">Stock Agotado</option>
            </select>
          </div>

          {/* Inactivos */}
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

      {/* Main Grid: Products Table + Right Detail Panel */}
      <div style={{
        ...styles.mainGrid,
        gridTemplateColumns: selectedProductoId ? '1fr 380px' : '1fr',
      }}>
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <span>Consultando catálogo de productos...</span>
            </div>
          ) : productos.length === 0 ? (
            <div style={styles.emptyBox}>
              <Package size={36} color="#CBD5E1" />
              <p style={styles.emptyTitle}>No se encontraron productos</p>
              <p style={styles.emptySubtitle}>
                {searchTerm || filterCategoria !== 'ALL' || filterStock !== 'ALL'
                  ? 'Intenta restablecer los filtros de búsqueda o categoría.'
                  : 'Aún no hay productos registrados. Haz clic en "Nuevo Producto" para agregar uno.'}
              </p>
            </div>
          ) : (
            <>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={styles.th}>CÓDIGO</th>
                      <th style={styles.th}>NOMBRE DEL PRODUCTO</th>
                      <th style={styles.th}>CATEGORÍA</th>
                      <th style={styles.th}>UNIDAD</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO BASE</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>COSTO PROM.</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>STOCK ACTUAL</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>STOCK MÍN.</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p) => {
                      const isSelected = selectedProductoId === p.id_producto;
                      const isLowStock =
                        p.es_inventariable &&
                        Number(p.stock_actual) > 0 &&
                        Number(p.stock_actual) < Number(p.stock_minimo);
                      const isOutOfStock =
                        p.es_inventariable && Number(p.stock_actual) <= 0;

                      return (
                        <tr
                          key={p.id_producto}
                          onClick={() => setSelectedProductoId(p.id_producto)}
                          style={{
                            ...styles.tr,
                            ...(isSelected ? styles.trSelected : {}),
                            ...(!p.activo ? styles.trInactive : {}),
                          }}
                        >
                          <td style={styles.tdCode}>
                            <span style={styles.codeTag} className="num-mono">
                              {p.codigo}
                            </span>
                          </td>
                          <td style={styles.tdName}>
                            <div style={styles.nameBlock}>
                              <span style={styles.productTitleText}>{p.nombre}</span>
                              {!p.es_inventariable && (
                                <span style={styles.serviceTag}>Servicio</span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.catBadge}>
                              {p.categoria?.nombre || 'General'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.unitBadge}>{p.unidad_medida}</span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                            <strong style={styles.priceText}>
                              ${Number(p.precio_base || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                            ${Number(p.costo_promedio || 0).toFixed(2)}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            {p.es_inventariable ? (
                              <div style={styles.stockColWrap}>
                                <span
                                  className="num-mono"
                                  style={{
                                    ...styles.stockNumber,
                                    color: isOutOfStock
                                      ? '#DC2626'
                                      : isLowStock
                                      ? '#D97706'
                                      : '#0F172A',
                                  }}
                                >
                                  {p.stock_actual}
                                </span>
                                {isLowStock && (
                                  <AlertTriangle
                                    size={14}
                                    color="#D97706"
                                    title="Stock por debajo del mínimo"
                                  />
                                )}
                                {isOutOfStock && (
                                  <AlertTriangle
                                    size={14}
                                    color="#DC2626"
                                    title="Producto sin existencias"
                                  />
                                )}
                              </div>
                            ) : (
                              <span style={styles.noStockMeta}>—</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                            {p.es_inventariable ? p.stock_minimo : '—'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedProductoId(p.id_producto)}
                                style={styles.actionBtn}
                                title="Ver detalles y trazabilidad"
                              >
                                <Eye size={15} color="#1E4E79" />
                              </button>

                              <button
                                onClick={(e) => handleOpenEdit(p, e)}
                                style={styles.actionBtn}
                                title="Editar producto"
                              >
                                <Edit2 size={15} color="#475569" />
                              </button>

                              <button
                                onClick={() => setDeleteTarget(p)}
                                style={styles.actionBtn}
                                title={p.activo ? 'Desactivar producto' : 'Reactivar producto'}
                              >
                                {p.activo ? (
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
                  Mostrando {productos.length} de {totalCount} productos
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

        {/* Right Detail Panel */}
        {selectedProductoId && (
          <ProductoDetallePanel
            productoId={selectedProductoId}
            onClose={() => setSelectedProductoId(null)}
          />
        )}
      </div>

      {/* Modals */}
      <ProductoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProducto}
        producto={editingProducto}
      />

      <CategoriasModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        onCategoriesUpdated={() => {
          loadCategories();
          loadData();
        }}
      />

      <ImportarProductosModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportCompleted={() => {
          showToast('Catálogo importado exitosamente.');
          loadData(1);
        }}
      />

      {/* Confirm Deactivation / Reactivation Modal */}
      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>
              {deleteTarget.activo ? 'Desactivar Producto' : 'Reactivar Producto'}
            </h3>
            <p style={styles.confirmDesc}>
              {deleteTarget.activo ? (
                <>
                  ¿Está seguro de que desea desactivar <strong>[{deleteTarget.codigo}] {deleteTarget.nombre}</strong>?
                  El producto no aparecerá en nuevas ventas ni facturas, pero su historial de compras y reportes se conservará intacto.
                </>
              ) : (
                <>
                  ¿Desea reactivar <strong>[{deleteTarget.codigo}] {deleteTarget.nombre}</strong> para habilitarlo en facturación y compras?
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#334155',
    padding: '9px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
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
  trSelected: {
    backgroundColor: '#FFF7ED',
  },
  trInactive: {
    opacity: 0.55,
    backgroundColor: '#FAFAFA',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
  },
  tdCode: {
    padding: '12px 14px',
  },
  codeTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  tdName: {
    padding: '12px 14px',
  },
  nameBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  productTitleText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  serviceTag: {
    fontSize: '10px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '1px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  unitBadge: {
    color: '#64748B',
    fontSize: '11px',
    fontWeight: '600',
  },
  priceText: {
    color: '#059669',
  },
  stockColWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  stockNumber: {
    fontWeight: '700',
    fontSize: '13px',
  },
  noStockMeta: {
    color: '#94A3B8',
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
