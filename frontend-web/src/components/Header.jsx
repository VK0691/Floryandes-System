import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle, User, Menu } from 'lucide-react';

export default function Header({ onNavigateToLowStock, onToggleSidebar }) {
  const { currentUser, currentRole, roleInfo, logout } = useAuth();

  // Format date in Spanish like mockup: "sábado, 27 de septiembre de 2026"
  const todayFormatted = new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header style={styles.header}>
      {/* Left: Hamburger Menu (Mobile/Tablet) + Salutation */}
      <div style={styles.leftContainer}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="show-on-tablet"
            style={styles.hamburgerBtn}
            title="Abrir menú de navegación"
          >
            <Menu size={22} color="#1E4E79" />
          </button>
        )}

        <div style={styles.leftSection}>
          <div style={styles.greetingRow}>
            <h2 style={styles.greetingTitle}>
              Bienvenido, {currentUser?.nombre || 'Papá'}
            </h2>
          </div>
          <span style={styles.dateText} className="hide-on-mobile">{todayFormatted}</span>
        </div>
      </div>

      {/* Center: System Alerts (hidden on small mobile screens to prevent overflow) */}
      <button
        type="button"
        onClick={onNavigateToLowStock}
        className="hide-on-mobile"
        style={styles.alertPillBtn}
        title="Ver productos con stock por debajo del mínimo"
      >
        <AlertTriangle size={15} color="#D97706" />
        <span>Aster con stock bajo (5 unidades)</span>
      </button>

      {/* Right: User Profile & Logout */}
      <div style={styles.rightSection}>
        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.avatar}>
            <User size={18} color="#1E4E79" />
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName} className="hide-on-mobile">{currentUser?.nombre || 'Wilson'}</span>
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
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span style={styles.logoutText} className="hide-on-mobile">Salir</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    minHeight: '70px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    gap: '12px',
  },
  leftContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  hamburgerBtn: {
    background: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '7px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
