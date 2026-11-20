import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { registrarAjusteInventario } from '../services/inventarioService';
import { useAuth, ROLES } from '../context/AuthContext';

export default function AjusteInventarioModal({ isOpen, onClose, onAjusteCompletado, productos = [] }) {
  const { currentRole, currentUser } = useAuth();
  const isAdmin = currentRole === ROLES.ADMIN;

  const [selectedProductId, setSelectedProductId] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('DIRECTO'); // 'DIRECTO' o 'DELTA'
  const [nuevoStock, setNuevoStock] = useState('');
  const [cantidadDelta, setCantidadDelta] = useState('');
  const [motivo, setMotivo] = useState('Conteo físico de bodega');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected product object
  const selectedProduct = productos.find(
    p => String(p.id_producto) === String(selectedProductId)
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (productos.length > 0 && !selectedProductId) {
        setSelectedProductId(String(productos[0].id_producto));
        setNuevoStock(String(productos[0].stock_actual || 0));
      } else if (selectedProduct) {
        setNuevoStock(String(selectedProduct.stock_actual || 0));
      }
    }
  }, [isOpen, selectedProductId, productos]);

  if (!isOpen) return null;

  const stockActual = selectedProduct ? parseFloat(selectedProduct.stock_actual) || 0 : 0;
  
  let stockCalculado = stockActual;
  let cambioCalculado = 0;

  if (tipoAjuste === 'DIRECTO') {
    const val = parseFloat(nuevoStock);
    if (!isNaN(val)) {
      stockCalculado = val;
      cambioCalculado = val - stockActual;
    }
  } else {
    const delta = parseFloat(cantidadDelta);
    if (!isNaN(delta)) {
      stockCalculado = stockActual + delta;
      cambioCalculado = delta;
    }
  }

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const p = productos.find(prod => String(prod.id_producto) === String(prodId));
    if (p) {
      setNuevoStock(String(p.stock_actual || 0));
      setCantidadDelta('0');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAdmin) {
      setErrorMsg('Acceso denegado: Solo el Administrador puede realizar ajustes manuales de inventario.');
      return;
    }

    if (!selectedProductId) {
      setErrorMsg('Debe seleccionar un producto.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Debe especificar el motivo del ajuste.');
      return;
    }

    if (stockCalculado < 0) {
      setErrorMsg('El stock resultante no puede ser negativo.');
      return;
    }

    if (cambioCalculado === 0) {
      setErrorMsg('El stock resultante es idéntico al actual; no hay variación que registrar.');
      return;
    }

    setLoading(true);
    try {
      await registrarAjusteInventario({
        id_producto: selectedProductId,
        tipoAjuste,
        cantidad: cantidadDelta,
        nuevoStock: nuevoStock,
        motivo: motivo.trim(),
        usuarioId: currentUser?.id || 1,
      });

      setSuccessMsg(`Ajuste registrado exitosamente para ${selectedProduct?.nombre}.`);
      setTimeout(() => {
        if (onAjusteCompletado) onAjusteCompletado();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error registrando ajuste:', err);
      setErrorMsg(err.message || 'Error al procesar el ajuste de inventario.');
    } finally {
      setLoading(false);
    }
  };

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
              <Sliders size={22} color="#1E4E79" />
            </div>
            <div>
              <h3 style={styles.title}>Ajuste Manual de Inventario</h3>
              <p style={styles.subtitle}>
                Corrección de existencias físicas tras auditoría o conteo en bodega
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={styles.body}>
          {!isAdmin ? (
            <div style={styles.deniedBanner}>
              <ShieldAlert size={20} color="#DC2626" />
              <div>
                <strong>Acceso Restringido:</strong> Solo los usuarios con rol de <b>Administrador</b> tienen autorización para realizar ajustes directos de stock.
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div style={styles.errorBanner}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={styles.successBanner}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Product selector */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Producto a Ajustar:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  style={styles.select}
                  disabled={loading}
                >
                  {productos.map((prod) => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.codigo ? `[${prod.codigo}] ` : ''}{prod.nombre} - Stock actual: {prod.stock_actual} {prod.unidad_medida || 'bonches'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Mode Toggle */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Modalidad de Ajuste:</label>
                <div style={styles.toggleRow}>
                  <button
                    type="button"
                    onClick={() => setTipoAjuste('DIRECTO')}
                    style={{
                      ...styles.toggleBtn,
                      ...(tipoAjuste === 'DIRECTO' ? styles.toggleBtnActive : {}),
                    }}
                  >
                    Establecer Stock Físico Conteo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAjuste('DELTA')}
                    style={{
                      ...styles.toggleBtn,
                      ...(tipoAjuste === 'DELTA' ? styles.toggleBtnActive : {}),
                    }}
                  >
                    Sumar o Restar Unidades (+/-)
                  </button>
                </div>
              </div>

              {/* Adjustment Input */}
              {tipoAjuste === 'DIRECTO' ? (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nuevo Stock Físico Contado:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={nuevoStock}
                    onChange={(e) => setNuevoStock(e.target.value)}
                    style={styles.input}
                    placeholder="Ej. 50"
                    disabled={loading}
                    required
                  />
                  <span style={styles.hint}>
                    Ingrese la cantidad física real constatada en el almacén.
                  </span>
                </div>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Variación de Unidades (+ para ingreso, - para retiro):</label>
                  <input
                    type="number"
                    step="1"
                    value={cantidadDelta}
                    onChange={(e) => setCantidadDelta(e.target.value)}
                    style={styles.input}
                    placeholder="Ej. +5 o -3"
                    disabled={loading}
                    required
                  />
                  <span style={styles.hint}>
                    Utilice signo negativo (-) para mermas o descuadres encontrados.
                  </span>
                </div>
              )}

              {/* Impact Preview Card */}
              <div style={styles.previewCard}>
                <div style={styles.previewCol}>
                  <span style={styles.previewLabel}>Stock Actual en Sistema</span>
                  <span style={styles.previewNum}>{stockActual}</span>
                </div>
                <ArrowRight size={20} color="#94A3B8" />
                <div style={styles.previewCol}>
                  <span style={styles.previewLabel}>Variación</span>
                  <span
                    style={{
                      ...styles.previewNum,
                      color: cambioCalculado > 0 ? '#059669' : cambioCalculado < 0 ? '#DC2626' : '#64748B',
                    }}
                  >
                    {cambioCalculado > 0 ? `+${cambioCalculado}` : cambioCalculado}
                  </span>
                </div>
                <ArrowRight size={20} color="#94A3B8" />
                <div style={styles.previewCol}>
                  <span style={styles.previewLabel}>Stock Final Resultante</span>
                  <span style={{ ...styles.previewNum, color: '#1E4E79' }}>
                    {stockCalculado}
                  </span>
                </div>
              </div>

              {/* Motivo Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Motivo o Justificación del Ajuste:</label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  style={styles.textarea}
                  placeholder="Ej. Conteo físico fin de mes, bonches rotos detectados sin registro previo..."
                  disabled={loading}
                  required
                />
                <span style={styles.charCount}>{motivo.length}/200 caracteres</span>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>
            {isAdmin && (
              <button
                type="submit"
                style={styles.btnPrimary}
                disabled={loading}
              >
                {loading ? 'Guardando Ajuste...' : 'Confirmar y Actualizar Stock'}
              </button>
            )}
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
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    gap: '12px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #BFDBFE',
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
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  select: {
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  input: {
    padding: '9px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  textarea: {
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleBtn: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  toggleBtnActive: {
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    borderColor: '#1E4E79',
  },
  previewCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px',
  },
  previewCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  previewNum: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: '11px',
    color: '#64748B',
  },
  charCount: {
    fontSize: '11px',
    color: '#94A3B8',
    textAlign: 'right',
  },
  deniedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #6EE7B7',
    color: '#065F46',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0',
    marginTop: '6px',
  },
  btnSecondary: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#1E4E79',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(30, 78, 121, 0.2)',
  },
};

