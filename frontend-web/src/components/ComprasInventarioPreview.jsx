import React from 'react';
import { Package, Truck, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function ComprasInventarioPreview({ type = 'inventario' }) {
  const isInventario = type === 'inventario';

  const stockItems = [
    { code: 'BON-ROJ', name: 'Bonches Rosas Rojas', stock: 120, unit: 'bonches', min: 20, status: 'Normal' },
    { code: 'BON-COL', name: 'Bonches de Colores', stock: 45, unit: 'bonches', min: 15, status: 'Normal' },
    { code: 'BON-BLA', name: 'Bonches Rosas Blancas', stock: 80, unit: 'bonches', min: 20, status: 'Normal' },
    { code: 'AST', name: 'Aster', stock: 5, unit: 'unidades', min: 10, status: 'Bajo Stock' },
    { code: 'SOL', name: 'Solidago', stock: 25, unit: 'unidades', min: 10, status: 'Normal' },
  ];

  const proveedores = [
    { name: 'TESSA', tipo: 'Corporativa', contact: '0991234567' },
    { name: 'ING. CAJAS', tipo: 'Finca', contact: '0987654321' },
    { name: 'DON ALBERTO', tipo: 'Finca', contact: '0978901234' },
    { name: 'EDU FLOR', tipo: 'Corporativa', contact: '0965432109' },
    { name: 'DENIS', tipo: 'Finca', contact: '0954321987' },
    { name: 'SRA. MIRIAM', tipo: 'Finca', contact: '0943219876' },
  ];

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            {isInventario ? 'Control de Inventario y Almacén' : 'Módulo de Compras y Proveedores'}
          </h2>
          <p style={styles.subtitle}>
            {isInventario
              ? 'Control de bonches, hierbas, stock mínimo y mermas'
              : 'Registro con múltiples productos, cantidades sanas y pérdidas por proveedor'}
          </p>
        </div>
      </div>

      {isInventario ? (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>CÓDIGO</th>
                <th style={styles.th}>PRODUCTO</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>STOCK ACTUAL</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>STOCK MÍNIMO</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((item) => (
                <tr key={item.code} style={styles.tr}>
                  <td style={styles.tdCode} className="num-mono">{item.code}</td>
                  <td style={styles.tdName}>{item.name}</td>
                  <td style={{ ...styles.tdStock, textAlign: 'right' }} className="num-mono">
                    {item.stock} {item.unit}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">
                    {item.min}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span
                      style={{
                        ...styles.statusTag,
                        backgroundColor: item.status === 'Bajo Stock' ? '#FEF2F2' : '#ECFDF5',
                        color: item.status === 'Bajo Stock' ? '#DC2626' : '#059669',
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>PROVEEDOR REGISTRADO</th>
                <th style={styles.th}>TIPO</th>
                <th style={styles.th}>TELÉFONO</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdName}>
                    <div style={styles.provRow}>
                      <Truck size={16} color="#1E4E79" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{p.tipo}</span>
                  </td>
                  <td style={styles.td} className="num-mono">{p.contact}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={styles.activeTag}>Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
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
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E4E79',
  },
  tdName: {
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
  },
  tdStock: {
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  statusTag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  provRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  activeTag: {
    color: '#059669',
    fontWeight: '600',
    fontSize: '12px',
  }
};
