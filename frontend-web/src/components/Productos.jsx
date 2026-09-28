import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Flower2, Tag, RefreshCw, Layers } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('id_producto', { ascending: true });

      if (!error && data) {
        setProductos(data);
      }
    } catch (e) {
      console.error('Error fetching productos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Catálogo de Productos y Servicios</h2>
          <p style={styles.subtitle}>
            Bonches de Rosas (Rojas, Colores, Blancas) e Hierbas (Aster, Solidago) sincronizados con Supabase
          </p>
        </div>
        <button onClick={fetchProductos} style={styles.refreshBtn}>
          <RefreshCw size={14} className={loading ? 'pulse' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>Cargando productos de Supabase...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>CÓDIGO</th>
                <th style={styles.th}>NOMBRE DEL PRODUCTO</th>
                <th style={styles.th}>UNIDAD</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO BASE</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>COSTO PROMEDIO</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>INVENTARIABLE</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_producto} style={styles.tr}>
                  <td style={styles.tdCode} className="num-mono">
                    <span style={styles.codeTag}>{p.codigo}</span>
                  </td>
                  <td style={styles.tdName}>
                    <div style={styles.productNameGroup}>
                      <Flower2 size={16} color="#E05A2B" />
                      <span>{p.nombre}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.unitBadge}>{p.unidad_medida}</span>
                  </td>
                  <td style={{ ...styles.tdPrice, textAlign: 'right' }} className="num-mono">
                    ${Number(p.precio_base || 0).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                    ${Number(p.costo_promedio || 0).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={p.es_inventariable ? styles.badgeYes : styles.badgeNo}>
                      {p.es_inventariable ? 'Sí' : 'Servicio'}
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
  tdCode: {
    padding: '14px 18px',
  },
  codeTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  tdName: {
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
  },
  productNameGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  unitBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  tdPrice: {
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#059669',
  },
  badgeYes: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    color: '#059669',
  },
  badgeNo: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  }
};
