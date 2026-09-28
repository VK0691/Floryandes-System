import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, UserPlus, Phone, MapPin, CreditCard, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Clientes({ onSelectClientForInvoice }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('id_cliente', { ascending: true });

      if (!error && data) {
        setClientes(data);
      }
    } catch (e) {
      console.error('Error fetching clientes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c => {
    const matchesSearch =
      c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ruc?.includes(searchTerm) ||
      c.telefono?.includes(searchTerm);
    const matchesFilter = filterType === 'ALL' || c.tipo_cliente === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Módulo de Clientes (CRM)</h2>
          <p style={styles.subtitle}>
            Datos cargados directamente desde la base de datos Supabase
          </p>
        </div>
        <button onClick={fetchClientes} style={styles.refreshBtn}>
          <RefreshCw size={14} className={loading ? 'pulse' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.typeFilterGroup}>
          {['ALL', 'MINORISTA', 'MAYORISTA', 'CORPORATIVO'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                ...styles.typeFilterBtn,
                ...(filterType === type ? styles.typeFilterBtnActive : {}),
              }}
            >
              {type === 'ALL' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>Cargando clientes de Supabase...</div>
        ) : filteredClientes.length === 0 ? (
          <div style={styles.emptyBox}>No se encontraron clientes con esos filtros.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>CLIENTE / RAZÓN SOCIAL</th>
                <th style={styles.th}>RUC / CÉDULA</th>
                <th style={styles.th}>TELÉFONO</th>
                <th style={styles.th}>TIPO</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>SALDO ACTUAL</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((c) => (
                <tr key={c.id_cliente} style={styles.tr}>
                  <td style={styles.tdId} className="num-mono">#{c.id_cliente}</td>
                  <td style={styles.tdName}>
                    <strong>{c.nombre}</strong>
                  </td>
                  <td style={styles.td} className="num-mono">{c.ruc || '—'}</td>
                  <td style={styles.td}>
                    {c.telefono ? (
                      <span style={styles.phoneTag}>
                        <Phone size={12} /> {c.telefono}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{c.tipo_cliente || 'MINORISTA'}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                    <span style={c.saldo_actual > 0 ? styles.debt : styles.clean}>
                      ${Number(c.saldo_actual || 0).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={styles.activePill}>
                      <CheckCircle2 size={12} color="#10B981" /> Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1240px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '0 14px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#0F172A',
  },
  typeFilterGroup: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
  },
  typeFilterBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748B',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  typeFilterBtnActive: {
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  loadingBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
  },
  emptyBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 18px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 18px',
    fontSize: '13px',
    color: '#334155',
  },
  tdId: {
    padding: '14px 18px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#94A3B8',
  },
  tdName: {
    padding: '14px 18px',
    fontSize: '14px',
    color: '#0F172A',
  },
  phoneTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#475569',
    fontSize: '12px',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  debt: {
    color: '#DC2626',
    fontWeight: '700',
  },
  clean: {
    color: '#059669',
    fontWeight: '600',
  },
  activePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#059669',
    fontWeight: '600',
  }
};
