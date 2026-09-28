import React from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import { LogOut, Bell, AlertTriangle, Shield, User, ChevronDown } from 'lucide-react';

export default function Header({ onNavigateToLowStock }) {
  const { currentUser, currentRole, roleInfo, logout, switchRole } = useAuth();

  // Format date in Spanish like mockup: "sábado, 27 de septiembre de 2026"
  const todayFormatted = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header style={styles.header}>
      {/* Left: Salutation & Date */}
      <div style={styles.leftSection}>
        <div style={styles.greetingRow}>
          <h2 style={styles.greetingTitle}>
            Bienvenido, {currentUser?.nombre || 'Papá'}
          </h2>
        </div>
        <span style={styles.dateText}>{todayFormatted}</span>
      </div>

      {/* Center: System Alerts */}
      <button
        type="button"
        onClick={onNavigateToLowStock}
        style={styles.alertPillBtn}
        title="Ver productos con stock por debajo del mínimo"
      >
        <AlertTriangle size={15} color="#D97706" />
        <span>Aster con stock bajo (5 unidades)</span>
      </button>

      {/* Right: Notifications, Role Switcher, User Profile & Logout */}
      <div style={styles.rightSection}>
        {/* Role Switcher */}
        <div style={styles.roleSwitcherBox}>
          <Shield size={14} color="#64748B" />
          <span style={styles.roleSwitcherLabel}>Rol:</span>
          <select
            value={currentRole || ROLES.ADMIN}
            onChange={(e) => switchRole(e.target.value)}
            style={styles.roleSelect}
            title="Cambiar rol activo"
          >
            <option value={ROLES.ADMIN}>ADMIN (Acceso Total)</option>
            <option value={ROLES.VENDEDOR}>VENDEDOR (Facturación)</option>
            <option value={ROLES.BODEGUERO}>BODEGUERO (Inventario)</option>
          </select>
        </div>

        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.avatar}>
            <User size={18} color="#1E4E79" />
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{currentUser?.nombre || 'Wilson'}</span>
            <span
              style={{
                ...styles.roleBadge,
                backgroundColor: roleInfo?.badgeBg || '#E0E7FF',
                color: roleInfo?.badgeColor || '#1E4E79',
              }}
            >
              {currentRole}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={styles.logoutBtn}
          title="Cerrar sesión (Historia 1.6)"
        >
          <LogOut size={16} />
          <span style={styles.logoutText}>Salir</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '70px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  greetingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  greetingTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  dateText: {
    fontSize: '12px',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  alertPillBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  alertPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 14px',
    borderRadius: '20px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roleSwitcherBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '5px 10px',
    borderRadius: '8px',
  },
  roleSwitcherLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
  },
  roleSelect: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1E293B',
    cursor: 'pointer',
    outline: 'none',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '6px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: '1.2',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '2px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#64748B',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  logoutText: {
    fontWeight: '600',
  }
};
