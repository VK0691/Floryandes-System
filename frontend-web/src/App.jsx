import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import FacturacionModule from './components/FacturacionModule';
import ConfiguracionView from './components/ConfiguracionView';
import ComprasModule from './components/ComprasModule';
import InventarioModule from './components/InventarioModule';
import ComprasInventarioPreview from './components/ComprasInventarioPreview';
import ReportesPreview from './components/ReportesPreview';
import AccessDenied from './components/AccessDenied';

function MainApp() {
  const { isAuthenticated, loading, canAccessModule } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState(null);
  const [productStockFilter, setProductStockFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>Conectando con Floryandes System y Supabase...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleFacturarCliente = (cliente) => {
    setSelectedClientForInvoice(cliente);
    setActiveTab('facturacion');
    setMobileMenuOpen(false);
  };

  const handleNavigateToLowStock = () => {
    setProductStockFilter('BAJO');
    setActiveTab('productos');
    setMobileMenuOpen(false);
  };

  const handleSelectTab = (tab) => {
    if (tab === 'productos') {
      setProductStockFilter('ALL');
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderActiveModule = () => {
    // Control de acceso según rol de usuario
    if (!canAccessModule(activeTab)) {
      const moduleNames = {
        dashboard: 'Dashboard',
        facturacion: 'Facturación',
        clientes: 'Clientes (CRM)',
        productos: 'Productos y Servicios',
        inventario: 'Inventario',
        compras: 'Compras',
        reportes: 'Reportes',
        configuracion: 'Configuración de la Empresa'
      };
      return (
        <AccessDenied
          moduleName={moduleNames[activeTab] || activeTab}
          onBack={() => setActiveTab('dashboard')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab) => handleSelectTab(tab)}
            onNavigateToLowStock={handleNavigateToLowStock}
          />
        );
      case 'facturacion':
        return <FacturacionModule preselectedClient={selectedClientForInvoice} />;
      case 'clientes':
        return <Clientes onFacturarCliente={handleFacturarCliente} />;
      case 'productos':
        return <Productos initialStockFilter={productStockFilter} />;
      case 'inventario':
        return <InventarioModule />;
      case 'compras':
        return <ComprasModule />;
      case 'reportes':
        return <ReportesPreview />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return <Dashboard onNavigate={(tab) => handleSelectTab(tab)} />;
    }
  };

  return (
    <div className="app-layout" style={styles.layout}>
      {/* Responsive Sidebar with Mobile Drawer support */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main" style={styles.mainWrapper}>
        <Header
          onNavigateToLowStock={handleNavigateToLowStock}
          onToggleSidebar={() => setMobileMenuOpen(prev => !prev)}
        />
        <main className="app-content" style={styles.contentArea}>
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F9',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#E05A2B',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748B',
  },
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F3F6F9',
  },
  mainWrapper: {
    marginLeft: 'var(--sidebar-width, 250px)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  contentArea: {
    flex: 1,
    padding: '28px',
  }
};
