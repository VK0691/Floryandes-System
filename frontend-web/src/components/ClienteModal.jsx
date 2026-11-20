import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export default function ClienteModal({ isOpen, onClose, onSave, cliente = null }) {
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: '',
    correo: '',
    tipo_cliente: 'MINORISTA',
    saldo_actual: 0,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        ruc: cliente.ruc || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        correo: cliente.correo || '',
        tipo_cliente: cliente.tipo_cliente || 'MINORISTA',
        saldo_actual: cliente.saldo_actual || 0,
      });
    } else {
      setFormData({
        nombre: '',
        ruc: '',
        telefono: '',
        direccion: '',
        correo: '',
        tipo_cliente: 'MINORISTA',
        saldo_actual: 0,
      });
    }
    setErrors({});
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const nombreClean = formData.nombre?.trim() || '';
    if (!nombreClean) {
      errs.nombre = 'El nombre o razón social es obligatorio.';
    } else if (nombreClean.length < 3) {
      errs.nombre = 'El nombre debe tener al menos 3 caracteres.';
    } else if (nombreClean.length > 100) {
      errs.nombre = 'El nombre no puede exceder los 100 caracteres.';
    }

    if (formData.ruc?.trim()) {
      const cleanRuc = formData.ruc.trim();
      if (!/^\d+$/.test(cleanRuc)) {
        errs.ruc = 'El RUC o Cédula debe contener solo números.';
      } else if (cleanRuc.length !== 10 && cleanRuc.length !== 13) {
        errs.ruc = 'Debe tener exactamente 10 dígitos (Cédula) o 13 dígitos (RUC).';
      }
    }

    if (formData.telefono?.trim()) {
      const cleanTel = formData.telefono.trim();
      if (!/^\+?\d{7,13}$/.test(cleanTel)) {
        errs.telefono = 'El teléfono debe contener entre 7 y 13 dígitos numéricos.';
      }
    }

    if (formData.correo?.trim()) {
      const cleanCorreo = formData.correo.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (cleanCorreo.length > 100) {
        errs.correo = 'El correo electrónico no puede superar los 100 caracteres.';
      } else if (!emailRegex.test(cleanCorreo)) {
        errs.correo = 'Ingrese un correo electrónico válido (ej: cliente@ejemplo.com).';
      }
    }

    if (formData.direccion?.trim() && formData.direccion.trim().length > 200) {
      errs.direccion = 'La dirección no puede exceder los 200 caracteres.';
    }

    if (formData.saldo_actual !== undefined && formData.saldo_actual !== '' && formData.saldo_actual !== null) {
      const saldo = parseFloat(formData.saldo_actual);
      if (isNaN(saldo) || saldo < 0) {
        errs.saldo_actual = 'El saldo inicial no puede ser negativo.';
      } else if (saldo > 999999.99) {
        errs.saldo_actual = 'El saldo inicial no puede superar $999,999.99.';
      }
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
        nombre: formData.nombre.trim(),
        ruc: formData.ruc ? formData.ruc.trim() : null,
        telefono: formData.telefono ? formData.telefono.trim() : null,
        direccion: formData.direccion ? formData.direccion.trim() : null,
        correo: formData.correo ? formData.correo.trim().toLowerCase() : null,
        saldo_actual: parseFloat(formData.saldo_actual) || 0,
      };
      await onSave(payload, cliente?.id_cliente);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Error al guardar los datos del cliente' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>
              {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <p style={styles.subtitle}>
              {cliente ? 'Actualizar información en el sistema' : 'Registrar nuevo cliente en la base de datos'}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Cerrar ventana">
            <X size={20} />
          </button>
        </div>

        {/* Global Error Banner */}
        {errors.form && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>
                Nombre o Razón Social <span style={styles.required}>*</span>
              </label>
              <span style={{ fontSize: '11px', color: formData.nombre.length >= 100 ? '#EF4444' : '#94A3B8' }}>
                {formData.nombre.length}/100
              </span>
            </div>
            <input
              type="text"
              value={formData.nombre}
              maxLength={100}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 100) })}
              placeholder="Ej: SRA. JENNY o DISTRIBUIDORA FLORES S.A."
              style={{
                ...styles.input,
                borderColor: errors.nombre ? '#EF4444' : '#CBD5E1',
              }}
              autoFocus
            />
            {errors.nombre && <span style={styles.errorText}>{errors.nombre}</span>}
          </div>

          <div style={styles.row} className="modal-form-row">
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>RUC / Cédula</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {formData.ruc?.length || 0}/13
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={13}
                value={formData.ruc}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                  setFormData({ ...formData, ruc: val });
                }}
                placeholder="10 dígitos (Cédula) o 13 (RUC)"
                style={{
                  ...styles.input,
                  borderColor: errors.ruc ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.ruc ? (
                <span style={styles.errorText}>{errors.ruc}</span>
              ) : (
                <span style={styles.hintText}>Solo números (10 o 13 dígitos)</span>
              )}
            </div>

            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Teléfono</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {formData.telefono?.length || 0}/13
                </span>
              </div>
              <input
                type="text"
                inputMode="tel"
                maxLength={13}
                value={formData.telefono}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d+]/g, '');
                  if (val.startsWith('+')) {
                    val = '+' + val.slice(1).replace(/\+/g, '').slice(0, 12);
                  } else {
                    val = val.replace(/\+/g, '').slice(0, 10);
                  }
                  setFormData({ ...formData, telefono: val });
                }}
                placeholder="Ej: 0994616783 o +593..."
                style={{
                  ...styles.input,
                  borderColor: errors.telefono ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.telefono ? (
                <span style={styles.errorText}>{errors.telefono}</span>
              ) : (
                <span style={styles.hintText}>Máximo 10 a 13 dígitos</span>
              )}
            </div>
          </div>

          <div style={styles.row} className="modal-form-row">
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Correo Electrónico</label>
                <span style={{ fontSize: '11px', color: formData.correo?.length >= 100 ? '#EF4444' : '#94A3B8' }}>
                  {formData.correo?.length || 0}/100
                </span>
              </div>
              <input
                type="email"
                maxLength={100}
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value.slice(0, 100) })}
                placeholder="cliente@ejemplo.com"
                style={{
                  ...styles.input,
                  borderColor: errors.correo ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.correo && <span style={styles.errorText}>{errors.correo}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tipo de Cliente</label>
              <select
                value={formData.tipo_cliente}
                onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
                style={styles.select}
              >
                <option value="MINORISTA">Minorista</option>
                <option value="MAYORISTA">Mayorista</option>
                <option value="CORPORATIVO">Corporativo</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Dirección</label>
              <span style={{ fontSize: '11px', color: formData.direccion?.length >= 200 ? '#EF4444' : '#94A3B8' }}>
                {formData.direccion?.length || 0}/200
              </span>
            </div>
            <input
              type="text"
              maxLength={200}
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value.slice(0, 200) })}
              placeholder="Ej: Mercado Central, Puesto 14, Ambato"
              style={{
                ...styles.input,
                borderColor: errors.direccion ? '#EF4444' : '#CBD5E1',
              }}
            />
            {errors.direccion && <span style={styles.errorText}>{errors.direccion}</span>}
          </div>

          {!cliente && (
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Saldo Inicial Deuda ($)</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Máx: $999,999.99</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                value={formData.saldo_actual}
                onKeyDown={(e) => {
                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === '') {
                    setFormData({ ...formData, saldo_actual: '' });
                    return;
                  }
                  if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                    val = val.replace(/^0+/, '') || '0';
                  }
                  const num = parseFloat(val);
                  if (!isNaN(num)) {
                    if (num > 999999.99) {
                      val = '999999.99';
                    }
                    setFormData({ ...formData, saldo_actual: val });
                  }
                }}
                onBlur={() => {
                  if (formData.saldo_actual === '' || isNaN(parseFloat(formData.saldo_actual))) {
                    setFormData({ ...formData, saldo_actual: 0 });
                  }
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                style={{
                  ...styles.input,
                  borderColor: errors.saldo_actual ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.saldo_actual ? (
                <span style={styles.errorText}>{errors.saldo_actual}</span>
              ) : (
                <span style={styles.hintText}>
                  Opcional. Ingrese solo si el cliente arrastra saldo pendiente de planillas anteriores (máx $999,999.99).
                </span>
              )}
            </div>
          )}

          {/* Actions */}
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
              <span>{submitting ? 'Guardando...' : cliente ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
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
    transition: 'border-color 0.15s',
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
  hintText: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
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
