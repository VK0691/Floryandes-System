import React, { useState } from 'react';
import { List, PlusCircle, Sparkles } from 'lucide-react';
import ComprasList from './ComprasList';
import NuevaCompra from './NuevaCompra';
import CompraOptimizer from './CompraOptimizer';

export default function ComprasModule() {
  const [activeSubTab, setActiveSubTab] = useState('lista');
  const [initialSuggestion, setInitialSuggestion] = useState(null);

  const handleApplySuggestion = suggestion => {
    setInitialSuggestion(suggestion);
    setActiveSubTab('nueva');
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Subtab Navigation Bar */}
      <div style={styles.subtabBar}>
        <button
          type="button"
          onClick={() => setActiveSubTab('lista')}
          style={{
            ...styles.subtabBtn,
            ...(activeSubTab === 'lista' ? styles.subtabBtnActive : {}),
          }}
        >
          <List size={15} />
          <span>Historial de Compras</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('nueva')}
          style={{
            ...styles.subtabBtn,
            ...(activeSubTab === 'nueva' ? styles.subtabBtnActive : {}),
          }}
        >
          <PlusCircle size={15} />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Render active subtab */}
      {activeSubTab === 'lista' ? (
        <>
          <div style={styles.optimizerRow}>
            <div style={styles.optimizerIntro}>
              <div style={styles.optimizerIcon}><Sparkles size={20} /></div>
              <div>
                <strong style={styles.optimizerTitle}>Optimiza tu próxima compra</strong>
                <span style={styles.optimizerHint}>Usa presupuesto y demanda histórica.</span>
              </div>
            </div>
            <CompraOptimizer onApply={handleApplySuggestion} showBudgetControl={false} />
          </div>
          <ComprasList onNuevaCompra={() => {
            setInitialSuggestion(null);
            setActiveSubTab('nueva');
          }} />
        </>
      ) : (
        <NuevaCompra
          onVolver={() => {
            setInitialSuggestion(null);
            setActiveSubTab('lista');
          }}
          onCompraGuardada={() => {
            setInitialSuggestion(null);
            setActiveSubTab('lista');
          }}
          initialSuggestion={initialSuggestion}
        />
      )}
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
  optimizerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px 18px',
    borderRadius: '12px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 6px rgba(15, 23, 42, .04)',
  },
  optimizerIntro: { display: 'flex', alignItems: 'center', gap: '12px' },
  optimizerIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '11px', background: '#4F46E5', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(79,70,229,.25)' },
  optimizerTitle: { display: 'block', color: '#1E293B', fontSize: '14px' },
  optimizerHint: { display: 'block', marginTop: '3px', color: '#64748B', fontSize: '12px' },
};

