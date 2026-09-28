import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Productos from './components/Productos';
import FacturacionPreview from './components/FacturacionPreview';
import ConfiguracionView from './components/ConfiguracionView';
import ComprasInventarioPreview from './components/ComprasInventarioPreview';
import ReportesPreview from './components/ReportesPreview';
import AccessDenied from './components/AccessDenied';

function MainApp() {
  const { isAuthenticated, loading, canAccessModule } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState(null);
  const [productStockFilter, setProductStockFilter] = useState('ALL');

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
  };

  const handleNavigateToLowStock = () => {
    setProductStockFilter('BAJO');
    setActiveTab('productos');
  };

  const handleSelectTab = (tab) => {
    if (tab === 'productos') {
      setProductStockFilter('ALL');
    }
    setActiveTab(tab);
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
        return <FacturacionPreview selectedClient={selectedClientForInvoice} />;
      case 'clientes':
        return <Clientes onFacturarCliente={handleFacturarCliente} />;
      case 'productos':
        return <Productos initialStockFilter={productStockFilter} />;
      case 'inventario':
        return <ComprasInventarioPreview type="inventario" />;
      case 'compras':
        return <ComprasInventarioPreview type="compras" />;
      case 'reportes':
        return <ReportesPreview />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div style={styles.layout}>
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={styles.mainWrapper}>
        <Header onNavigateToLowStock={handleNavigateToLowStock} />
        <main style={styles.contentArea}>
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
