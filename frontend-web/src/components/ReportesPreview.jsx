import React from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart, FileSpreadsheet } from 'lucide-react';

export default function ReportesPreview() {
  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Reportes & Business Intelligence</h2>
          <p style={styles.subtitle}>
            Análisis de utilidad por bonche, comparativa de precios y rentabilidad histórica (Sprint 8 & 9)
          </p>
        </div>
      </div>

      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Ventas del Periodo</span>
          <span style={styles.kpiVal} className="num-mono">$2,710.00</span>
          <span style={styles.kpiSub}>Crecimiento +18.4%</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Utilidad Neta</span>
          <span style={styles.kpiVal} className="num-mono">$1,250.00</span>
          <span style={{ ...styles.kpiSub, color: '#059669' }}>Margen 46.1%</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Pérdidas Reportadas</span>
          <span style={styles.kpiVal} className="num-mono">12 bonches</span>
          <span style={{ ...styles.kpiSub, color: '#DC2626' }}>Roturas de transporte</span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Rentabilidad por Tipo de Producto</h3>
        <p style={styles.cardSub}>Utilidad bruta por cada bonche vendido</p>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>PRODUCTO</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO VENTA</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>COSTO PROMEDIO</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>UTILIDAD / BONCHE</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>MARGEN</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Bonche de Rosas Rojas', sale: 2.50, cost: 2.10, profit: 0.40, margin: '16.0%' },
                { name: 'Bonche de Colores', sale: 2.75, cost: 2.30, profit: 0.45, margin: '16.3%' },
                { name: 'Bonche de Rosas Blancas', sale: 2.50, cost: 2.10, profit: 0.40, margin: '16.0%' },
                { name: 'Aster', sale: 1.50, cost: 1.20, profit: 0.30, margin: '20.0%' },
                { name: 'Solidago', sale: 1.50, cost: 1.20, profit: 0.30, margin: '20.0%' },
              ].map((row, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdName}><strong>{row.name}</strong></td>
                  <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">${row.sale.toFixed(2)}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }} className="num-mono">${row.cost.toFixed(2)}</td>
                  <td style={{ ...styles.tdProfit, textAlign: 'right' }} className="num-mono">${row.profit.toFixed(2)}</td>
                  <td style={{ ...styles.tdMargin, textAlign: 'right' }} className="num-mono">{row.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
    marginBottom: '6px',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '4px',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '16px',
  },
  tableWrapper: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
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
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  tdName: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#0F172A',
  },
  tdProfit: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#059669',
  },
  tdMargin: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E4E79',
  }
};
