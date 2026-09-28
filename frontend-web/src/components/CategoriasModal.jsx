import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, RotateCcw, Trash2, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { getCategorias, createCategoria, updateCategoria, toggleActivoCategoria } from '../services/productosService';

export default function CategoriasModal({ isOpen, onClose, onCategoriesUpdated }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('PRODUCTO_VENTA');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await getCategorias(false); // include inactive
      setCategorias(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setTipo('PRODUCTO_VENTA');
    setError('');
  };

  const handleEditClick = (cat) => {
    setEditingId(cat.id_categoria);
    setNombre(cat.nombre);
    setTipo(cat.tipo);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    try {
      if (editingId) {
        const res = await updateCategoria(editingId, { nombre, tipo });
        if (res.success) {
          setSuccess('Categoría actualizada correctamente.');
          resetForm();
          await loadCategories();
          if (onCategoriesUpdated) onCategoriesUpdated();
        } else {
          setError(res.error);
        }
      } else {
        const res = await createCategoria({ nombre, tipo });
        if (res.success) {
          setSuccess('Categoría creada exitosamente.');
          resetForm();
          await loadCategories();
          if (onCategoriesUpdated) onCategoriesUpdated();
        } else {
          setError(res.error);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al procesar categoría.');
    }
  };

  const handleToggleActivo = async (cat) => {
    try {
      const nuevoEstado = !cat.activo;
      const res = await toggleActivoCategoria(cat.id_categoria, nuevoEstado);
      if (res.success) {
        setSuccess(`Categoría "${cat.nombre}" marcada como ${nuevoEstado ? 'activa' : 'inactiva'}.`);
        await loadCategories();
        if (onCategoriesUpdated) onCategoriesUpdated();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Error al actualizar estado.');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <Layers size={20} color="#1E4E79" />
            <div>
              <h3 style={styles.title}>Gestión de Categorías</h3>
              <p style={styles.subtitle}>Organizar los productos, hierbas, servicios e insumos</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          {success && (
            <div style={styles.successBox}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.fieldFlex}>
                <label style={styles.label}>Nombre de la Categoría</label>
                <input
                  type="text"
                  placeholder="Ej: Bonches, Hierbas, Ramos, Insumos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.fieldFixed}>
                <label style={styles.label}>Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  style={styles.select}
                >
                  <option value="PRODUCTO_VENTA">Producto Venta</option>
                  <option value="INSUMO">Insumo</option>
                  <option value="SERVICIO">Servicio</option>
                </select>
              </div>

              <div style={styles.actionBtnsCol}>
                <label style={{ ...styles.label, visibility: 'hidden' }}>Acción</label>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.saveBtn}>
                    {editingId ? 'Actualizar' : 'Agregar'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Categories List Table */}
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>NOMBRE</th>
                  <th style={styles.th}>TIPO</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr
                    key={cat.id_categoria}
                    style={{
                      ...styles.tr,
                      opacity: cat.activo ? 1 : 0.55,
                    }}
                  >
                    <td style={styles.tdId} className="num-mono">#{cat.id_categoria}</td>
                    <td style={styles.tdName}>
                      <strong>{cat.nombre}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.tipoBadge}>{cat.tipo}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span
                        style={{
                          ...styles.stateBadge,
                          backgroundColor: cat.activo ? '#ECFDF5' : '#FEF2F2',
                          color: cat.activo ? '#059669' : '#DC2626',
                        }}
                      >
                        {cat.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.actionsGroup}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(cat)}
                          style={styles.iconBtn}
                          title="Editar categoría"
                        >
                          <Edit2 size={14} color="#475569" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(cat)}
                          style={styles.iconBtn}
                          title={cat.activo ? 'Desactivar categoría' : 'Reactivar categoría'}
                        >
                          {cat.activo ? (
                            <Trash2 size={14} color="#DC2626" />
                          ) : (
                            <RotateCcw size={14} color="#059669" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '620px',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
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
    gap: '16px',
    maxHeight: '75vh',
    overflowY: 'auto',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
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
    fontSize: '13px',
  },
  form: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  fieldFlex: {
    flex: 2,
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldFixed: {
    flex: 1.5,
    minWidth: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionBtnsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  btnRow: {
    display: 'flex',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    padding: '8px 10px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  select: {
    padding: '8px 10px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    padding: '8px 14px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 10px',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden',
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
    fontSize: '13px',
    color: '#334155',
  },
  tdId: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#94A3B8',
  },
  tdName: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#0F172A',
  },
  tipoBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  stateBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  actionsGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  iconBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
};
