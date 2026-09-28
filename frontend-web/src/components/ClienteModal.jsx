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
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre o razón social es obligatorio.';
    } else if (formData.nombre.trim().length < 3) {
      errs.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (formData.ruc?.trim()) {
      const cleanRuc = formData.ruc.trim();
      if (!/^\d+$/.test(cleanRuc)) {
        errs.ruc = 'El RUC o Cédula debe contener solo números.';
      } else if (cleanRuc.length !== 10 && cleanRuc.length !== 13) {
        errs.ruc = 'Debe tener 10 dígitos (Cédula) o 13 dígitos (RUC).';
      }
    }

    if (formData.correo?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo.trim())) {
        errs.correo = 'El correo electrónico no tiene un formato válido.';
      }
    }

    if (formData.telefono?.trim()) {
      const cleanTel = formData.telefono.trim().replace(/[\s-]/g, '');
      if (!/^\+?\d{7,15}$/.test(cleanTel)) {
        errs.telefono = 'El teléfono debe contener entre 7 y 15 dígitos numéricos.';
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
      await onSave(formData, cliente?.id_cliente);
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
            <label style={styles.label}>
              Nombre o Razón Social <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: SRA. JENNY o DISTRIBUIDORA FLORES S.A."
              style={{
                ...styles.input,
                borderColor: errors.nombre ? '#EF4444' : '#CBD5E1',
              }}
              autoFocus
            />
            {errors.nombre && <span style={styles.errorText}>{errors.nombre}</span>}
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>RUC / Cédula</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                placeholder="10 o 13 dígitos"
                maxLength={13}
                style={{
                  ...styles.input,
                  borderColor: errors.ruc ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.ruc && <span style={styles.errorText}>{errors.ruc}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Ej: 0994616783"
                style={{
                  ...styles.input,
                  borderColor: errors.telefono ? '#EF4444' : '#CBD5E1',
                }}
              />
              {errors.telefono && <span style={styles.errorText}>{errors.telefono}</span>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
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
            <label style={styles.label}>Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Ej: Mercado Central, Puesto 14, Ambato"
              style={styles.input}
            />
          </div>

          {!cliente && (
            <div style={styles.field}>
              <label style={styles.label}>Saldo Inicial Deuda ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.saldo_actual}
                onChange={(e) => setFormData({ ...formData, saldo_actual: e.target.value })}
                placeholder="0.00"
                style={styles.input}
              />
              <span style={styles.hintText}>
                Opcional. Ingrese solo si el cliente arrastra saldo pendiente de planillas anteriores.
              </span>
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
