import React, { useState, useEffect } from 'react';
import { Layers, FileSpreadsheet, Sliders, RefreshCw, BarChart2 } from 'lucide-react';
import InventarioStockCards from './InventarioStockCards';
import KardexView from './KardexView';
import AjusteInventarioModal from './AjusteInventarioModal';
import { getStockInventario } from '../services/inventarioService';
import { useAuth, ROLES } from '../context/AuthContext';

export default function InventarioModule() {
  const { currentRole } = useAuth();
  const isAdmin = currentRole === ROLES.ADMIN;

  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'kardex'
  const [productos, setProductos] = useState([]);
  const [metricas, setMetricas] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters for stock cards
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Ajuste Modal
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [selectedProductForAjuste, setSelectedProductForAjuste] = useState(null);

  // Preselected product for Kardex
  const [kardexSelectedProductId, setKardexSelectedProductId] = useState('ALL');

  const loadStockData = async () => {
    setLoading(true);
    try {
      const res = await getStockInventario({
        search: searchTerm,
        stockStatus: statusFilter,
      });
      setProductos(res.productos || []);
      setMetricas(res.metricas || {});
    } catch (err) {
      console.error('Error cargando stock de inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadStockData();
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter]);

  const handleOpenAjusteModal = (producto = null) => {
    setSelectedProductForAjuste(producto);
    setIsAjusteModalOpen(true);
  };

  const handleVerKardexProducto = (id_producto) => {
    setKardexSelectedProductId(String(id_producto));
    setActiveSubTab('kardex');
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Subtab Navigation and Header */}
      <div style={styles.topRow}>
        <div style={styles.subtabBar}>
          <button
            type="button"
            onClick={() => setActiveSubTab('stock')}
            style={{
              ...styles.subtabBtn,
              ...(activeSubTab === 'stock' ? styles.subtabBtnActive : {}),
            }}
          >
            <Layers size={15} />
            <span>Control de Stock & Gráfica</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setKardexSelectedProductId('ALL');
              setActiveSubTab('kardex');
            }}
            style={{
              ...styles.subtabBtn,
              ...(activeSubTab === 'kardex' ? styles.subtabBtnActive : {}),
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Kardex de Movimientos</span>
          </button>
        </div>

        <div style={styles.rightActions}>
          <button
            type="button"
            onClick={loadStockData}
            style={styles.btnReload}
            title="Actualizar datos de inventario"
          >
            <RefreshCw size={14} />
            <span>Actualizar</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleOpenAjusteModal()}
              style={styles.btnPrimaryAjuste}
            >
              <Sliders size={15} />
              <span>Ajuste Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Active View */}
      {activeSubTab === 'stock' ? (
        <InventarioStockCards
          productos={productos}
          metricas={metricas}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenAjuste={handleOpenAjusteModal}
          onVerKardexProducto={handleVerKardexProducto}
        />
      ) : (
        <KardexView
          productos={productos}
          preselectedProductId={kardexSelectedProductId}
          onOpenAjuste={() => handleOpenAjusteModal()}
        />
      )}

      {/* Modal Ajuste Manual de Inventario */}
      <AjusteInventarioModal
        isOpen={isAjusteModalOpen}
        onClose={() => {
          setIsAjusteModalOpen(false);
          setSelectedProductForAjuste(null);
        }}
        productos={productos}
        onAjusteCompletado={() => {
          loadStockData();
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  subtabBar: {
    display: 'inline-flex',
    backgroundColor: '#FFFFFF',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    width: 'fit-content',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  subtabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  subtabBtnActive: {
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnReload: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  btnPrimaryAjuste: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(224, 90, 43, 0.25)',
  },
};

