import React, { useState } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Flower2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SUPABASE_URL } from '../lib/supabaseClient';

export default function Login() {
  const { login, loading, authError } = useAuth();
  const [email, setEmail] = useState('admin@floryandes.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Por favor ingresa tu usuario o correo electrónico.');
      return;
    }
    if (!password) {
      setLocalError('Por favor ingresa tu contraseña.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setLocalError(res.error || 'Credenciales incorrectas');
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError('');
  };

  return (
    <div style={styles.container}>
      {/* Background subtle decoration */}
      <div style={styles.bgBlobTop}></div>
      <div style={styles.bgBlobBottom}></div>

      <div style={styles.cardWrapper}>
        {/* Header / Brand */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Flower2 size={36} color="#E05A2B" strokeWidth={2.2} />
          </div>
          <h1 style={styles.title}>Sistema Floryandes</h1>
          <p style={styles.subtitle}>Gestión comercial, facturación e inventario</p>
        </div>

        {/* Database connectivity status pill */}
        <div style={styles.statusPill}>
          <span style={styles.onlineDot}></span>
          <span>Supabase Conectado</span>
          <span style={styles.statusUrl}>({SUPABASE_URL.replace('https://', '').split('.')[0]})</span>
        </div>

        {/* Error message */}
        {(localError || authError) && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario o Correo</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: admin@floryandes.com"
                style={styles.input}
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Contraseña</label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                style={styles.forgotBtn}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={styles.inputContainer}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Access Badges for Sprint 1 Testing */}
        <div style={styles.demoSection}>
          <div style={styles.demoTitle}>
            <ShieldCheck size={14} color="#64748B" />
            <span>Acceso Rápido por Rol (Sprint 1):</span>
          </div>
          <div style={styles.demoButtons}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@floryandes.com', 'admin123')}
              style={styles.demoTagAdmin}
              title="Acceso total a todo el sistema"
            >
              👑 Admin (Papá)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('vendedor@floryandes.com', 'vendedor123')}
              style={styles.demoTagVendedor}
              title="Solo Facturación y Clientes"
            >
              💼 Vendedor
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('bodeguero@floryandes.com', 'bodeguero123')}
              style={styles.demoTagBodeguero}
              title="Solo Inventario y Compras"
            >
              📦 Bodeguero
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <span>Floryandes System v3.1 • Sprint 1</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setForgotModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Recuperar Contraseña</h3>
            <p style={styles.modalText}>
              Ingresa el correo electrónico asociado a tu cuenta para restablecer la contraseña.
            </p>
            {forgotSent ? (
              <div style={styles.successBox}>
                <CheckCircle2 size={20} color="#10B981" />
                <span>Instrucciones enviadas al correo si está registrado en el sistema.</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tu-correo@floryandes.com"
                  style={styles.modalInput}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    style={styles.modalCancelBtn}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotEmail.trim()) setForgotSent(true);
                    }}
                    style={styles.modalSubmitBtn}
                  >
                    Enviar Enlace
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F9',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlobTop: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '450px',
    height: '450px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(224, 90, 43, 0.08) 0%, rgba(243, 246, 249, 0) 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: '-15%',
    left: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30, 78, 121, 0.08) 0%, rgba(243, 246, 249, 0) 70%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  cardWrapper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#FFF0EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.15)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: '400',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '4px 12px',
    borderRadius: '20px',
    alignSelf: 'center',
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 0 2px #A7F3D0',
  },
  statusUrl: {
    color: '#6B7280',
    fontWeight: '400',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#B91C1C',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#E05A2B',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: 0,
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94A3B8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '11px 40px 11px 38px',
    fontSize: '14px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.25)',
    transition: 'background-color 0.15s, transform 0.1s',
  },
  demoSection: {
    marginTop: '6px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  demoButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  demoTagAdmin: {
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#EEF2FF',
    color: '#3730A3',
    border: '1px solid #C7D2FE',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  demoTagVendedor: {
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  demoTagBodeguero: {
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#FFFBEB',
    color: '#92400E',
    border: '1px solid #FDE68A',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '16px',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '8px',
  },
  modalText: {
    fontSize: '13px',
    color: '#64748B',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    marginBottom: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  modalCancelBtn: {
    padding: '8px 14px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    padding: '8px 14px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
  }
};
