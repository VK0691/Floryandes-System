import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied({ moduleName, onBack }) {
  const { currentRole, roleInfo } = useAuth();

  return (
    <div style={styles.card}>
      <div style={styles.iconCircle}>
        <ShieldAlert size={44} color="#EF4444" strokeWidth={1.8} />
      </div>
      <h2 style={styles.title}>Acceso Restringido</h2>
      <p style={styles.description}>
        Tu rol actual es <strong style={{ color: roleInfo?.badgeColor }}>{currentRole}</strong> ({roleInfo?.label}).
        No tienes permisos para acceder al módulo de <strong>{moduleName}</strong>.
      </p>

      <div style={styles.rulesBox}>
        <span style={styles.rulesTitle}>Políticas de Acceso y Seguridad:</span>
        <ul style={styles.rulesList}>
          <li><strong>ADMIN:</strong> Acceso total a todos los módulos y configuraciones.</li>
          <li><strong>VENDEDOR:</strong> Acceso a Facturación, Clientes, Productos. <span style={styles.deniedTag}>Sin acceso a Configuración</span></li>
          <li><strong>BODEGUERO:</strong> Acceso a Inventario, Compras, Productos. <span style={styles.deniedTag}>Sin acceso a Facturación</span></li>
        </ul>
      </div>

      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={16} />
        <span>Volver al Dashboard</span>
      </button>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '48px 32px',
    maxWidth: '560px',
    margin: '40px auto',
    textAlign: 'center',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '10px',
  },
  description: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  rulesBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px 20px',
    width: '100%',
    textAlign: 'left',
    marginBottom: '24px',
  },
  rulesTitle: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  rulesList: {
    fontSize: '13px',
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingLeft: '18px',
  },
  deniedTag: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: '4px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(30, 78, 121, 0.2)',
  }
};
