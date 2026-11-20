import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { getCategorias } from '../services/productosService';

export default function ProductoModal({ isOpen, onClose, onSave, producto = null }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    id_categoria: 1,
    unidad_medida: 'BONCHE',
    precio_base: '',
    costo_promedio: '0.00',
    stock_actual: '0',
    stock_minimo: '10',
    es_inventariable: true,
  });

  const [categorias, setCategorias] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCats() {
      const cats = await getCategorias(true);
      setCategorias(cats);
      if (cats.length > 0 && !producto) {
        setFormData(prev => ({ ...prev, id_categoria: cats[0].id_categoria }));
      }
    }
    if (isOpen) {
      loadCats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        id_categoria: producto.id_categoria || 1,
        unidad_medida: producto.unidad_medida || 'BONCHE',
        precio_base: producto.precio_base ? String(producto.precio_base) : '',
        costo_promedio: producto.costo_promedio ? String(producto.costo_promedio) : '0.00',
        stock_actual: producto.stock_actual !== undefined ? String(producto.stock_actual) : '0',
        stock_minimo: producto.stock_minimo !== undefined ? String(producto.stock_minimo) : '10',
        es_inventariable: producto.es_inventariable !== undefined ? producto.es_inventariable : true,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        id_categoria: categorias[0]?.id_categoria || 1,
        unidad_medida: 'BONCHE',
        precio_base: '',
        costo_promedio: '0.00',
        stock_actual: '0',
        stock_minimo: '10',
        es_inventariable: true,
      });
    }
    setErrors({});
  }, [producto, isOpen]);

  const cleanNumberInput = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    let str = String(val);
    if (str.length > 1 && str.startsWith('0') && str[1] !== '.') {
      str = str.replace(/^0+/, '') || '0';
    }
    return str;
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const cod = formData.codigo.trim();
    if (!cod) {
      errs.codigo = 'El código del producto es obligatorio.';
    } else if (cod.length > 20) {
      errs.codigo = 'El código no puede tener más de 20 caracteres.';
    }

    const nom = formData.nombre.trim();
    if (!nom) {
      errs.nombre = 'El nombre del producto es obligatorio.';
    } else if (nom.length > 100) {
      errs.nombre = 'El nombre no puede exceder los 100 caracteres.';
    }

    const price = parseFloat(formData.precio_base);
    if (isNaN(price) || price <= 0) {
      errs.precio_base = 'El precio base debe ser un valor numérico mayor a 0.';
    } else if (price > 999999.99) {
      errs.precio_base = 'El precio base no puede exceder $999,999.99.';
    }

    const currentStock = parseFloat(formData.stock_actual);
    if (!isNaN(currentStock) && currentStock > 999999) {
      errs.stock_actual = 'El stock actual no puede exceder 999,999 unidades.';
    }

    const minStock = parseFloat(formData.stock_minimo);
    if (isNaN(minStock) || minStock < 0) {
      errs.stock_minimo = 'El stock mínimo no puede ser negativo.';
    } else if (minStock > 999999) {
      errs.stock_minimo = 'El stock mínimo no puede exceder 999,999 unidades.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        codigo: formData.codigo.trim().toUpperCase(),
        nombre: formData.nombre.trim(),
        precio_base: parseFloat(formData.precio_base) || 0,
        costo_promedio: parseFloat(formData.costo_promedio) || 0,
        stock_actual: parseInt(formData.stock_actual, 10) || 0,
        stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
      };
      await onSave(payload, producto?.id_producto);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Error al guardar el producto' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <p style={styles.subtitle}>
              {producto ? 'Actualizar información y parámetros de catálogo' : 'Ingresar nuevo ítem al catálogo y almacén'}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Cerrar ventana">
            <X size={20} />
          </button>
        </div>

        {errors.form && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>
                  Código del Producto <span style={styles.required}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formData.codigo?.length || 0}/20</span>
              </div>
              <input
                type="text"
                maxLength={20}
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 20) })}
                placeholder="Ej: BON-ROJ, AST, GUI"
                style={{
                  ...styles.input,
                  borderColor: errors.codigo ? '#EF4444' : '#CBD5E1',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                }}
                autoFocus
              />
              {errors.codigo && <span style={styles.errorText}>{errors.codigo}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Categoría</label>
              <select
                value={formData.id_categoria}
                onChange={(e) => setFormData({ ...formData, id_categoria: e.target.value })}
                style={styles.select}
              >
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre} ({cat.tipo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>
                Nombre del Producto / Servicio <span style={styles.required}>*</span>
              </label>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formData.nombre?.length || 0}/100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 100) })}
              placeholder="Ej: Bonche de Rosas Rojas, Aster, Cajas de empaque"
              style={{
                ...styles.input,
                borderColor: errors.nombre ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.nombre && <span style={styles.errorText}>{errors.nombre}</span>}
          </div>

          <div style={styles.row} className="modal-form-row">
            <div style={styles.field}>
              <label style={styles.label}>Unidad de Medida</label>
              <select
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                style={styles.select}
              >
                <option value="BONCHE">BONCHE</option>
                <option value="UNIDAD">UNIDAD</option>
                <option value="DOCENA">DOCENA</option>
              </select>
            </div>

            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>
                  Precio Base de Venta ($) <span style={styles.required}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Máx: $999,999.99</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="999999.99"
                value={formData.precio_base}
                onChange={(e) => {
                  let val = cleanNumberInput(e.target.value);
                  if (parseFloat(val) > 999999.99) val = '999999.99';
                  setFormData({ ...formData, precio_base: val });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                style={{
                  ...styles.input,
                  borderColor: errors.precio_base ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.precio_base && <span style={styles.errorText}>{errors.precio_base}</span>}
            </div>
          </div>

          <div style={styles.row} className="modal-form-row">
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Stock Actual</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Máx: 999,999</span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="999999"
                value={formData.stock_actual}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  let val = cleanNumberInput(e.target.value);
                  if (parseInt(val, 10) > 999999) val = '999999';
                  setFormData({ ...formData, stock_actual: val });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                style={styles.input}
              />
              {errors.stock_actual && <span style={styles.errorText}>{errors.stock_actual}</span>}
            </div>

            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Stock Mínimo (Alerta)</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Máx: 999,999</span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="999999"
                value={formData.stock_minimo}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  let val = cleanNumberInput(e.target.value);
                  if (parseInt(val, 10) > 999999) val = '999999';
                  setFormData({ ...formData, stock_minimo: val });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="10"
                style={{
                  ...styles.input,
                  borderColor: errors.stock_minimo ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.stock_minimo && <span style={styles.errorText}>{errors.stock_minimo}</span>}
            </div>
          </div>

          <div style={styles.checkboxRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.es_inventariable}
                onChange={(e) => setFormData({ ...formData, es_inventariable: e.target.checked })}
                style={styles.checkbox}
              />
              <div>
                <span style={styles.checkboxTitle}>Es Producto Inventariable</span>
                <p style={styles.checkboxSub}>
                  Desactivar si es un servicio o cargo como Guía de Envío que no controla stock físico.
                </p>
              </div>
            </label>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.saveBtn,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              <span>{submitting ? 'Guardando...' : producto ? 'Guardar Cambios' : 'Registrar Producto'}</span>
            </button>
          </div>
        </form>
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
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '540px',
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
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: '-0.02em',
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
    justifyContent: 'center',
  },
  errorBox: {
    margin: '16px 24px 0',
    padding: '10px 14px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    color: '#B91C1C',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#E05A2B',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  errorText: {
    fontSize: '11px',
    color: '#EF4444',
    marginTop: '2px',
  },
  checkboxRow: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px 14px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: '3px',
    cursor: 'pointer',
  },
  checkboxTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    display: 'block',
  },
  checkboxSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
  },
  cancelBtn: {
    padding: '9px 16px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(224, 90, 43, 0.25)',
  }
};
