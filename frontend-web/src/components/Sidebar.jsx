import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Flower2,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Lock,
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentRole, canAccessModule } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'facturacion', label: 'Facturación', icon: Receipt },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Flower2 },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoIcon}>
          <Flower2 size={24} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div style={styles.brandInfo}>
          <span style={styles.brandTitle}>Floryandes</span>
          <span style={styles.brandSubtitle}>System v3.1</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAllowed = canAccessModule(item.id);
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
              }}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
                ...(isAllowed ? {} : styles.navItemDisabled),
              }}
              title={
                !isAllowed
                  ? `Módulo no disponible para el rol ${currentRole}`
                  : item.label
              }
            >
              <div style={styles.navItemLeft}>
                <Icon
                  size={19}
                  color={isActive ? '#FFFFFF' : '#CBD5E1'}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                <span style={isActive ? styles.navTextActive : styles.navText}>
                  {item.label}
                </span>
              </div>
              {!isAllowed && (
                <Lock size={14} color="#64748B" title="Acceso restringido por rol" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Database & Cloud Footprint */}
      <div style={styles.footer}>
        <div style={styles.dbInfoBox}>
          <div style={styles.dbHeader}>
            <Database size={13} color="#10B981" />
            <span style={styles.dbTitle}>PostgreSQL / Supabase</span>
          </div>
          <span style={styles.dbStatus}>Online • Realtime Sincronizado</span>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width, 250px)',
    backgroundColor: '#1E4E79', // Azul Pizarra Principal (#1E4E79)
    color: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandContainer: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#E05A2B', // Acento terracota
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(224, 90, 43, 0.3)',
  },
  brandInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: '0.04em',
  },
  nav: {
    flex: 1,
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#CBD5E1',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease-in-out',
  },
  navItemActive: {
    backgroundColor: '#E05A2B', // Naranja terracota (#E05A2B)
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.35)',
    fontWeight: '600',
  },
  navItemDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  navItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#CBD5E1',
  },
  navTextActive: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  dbInfoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '10px 12px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  dbHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dbTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#F1F5F9',
  },
  dbStatus: {
    fontSize: '10px',
    color: '#94A3B8',
  }
};
