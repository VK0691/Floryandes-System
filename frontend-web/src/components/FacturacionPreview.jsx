import React, { useState } from 'react';
import { Receipt, Plus, Trash2, Printer, Save, CheckCircle } from 'lucide-react';

export default function FacturacionPreview() {
  const [items, setItems] = useState([
    { id: 1, cantidad: 34, descripcion: 'Bonches de Rosas Rojas', precio: 2.50, costo: 2.10 },
    { id: 2, cantidad: 8, descripcion: 'Bonches de Colores', precio: 1.50, costo: 2.30 },
    { id: 3, cantidad: 2, descripcion: 'Aster', precio: 1.50, costo: 1.20 },
    { id: 4, cantidad: 1, descripcion: 'Guía de Envío', precio: 6.00, costo: 0.00 },
  ]);

  const [cliente, setCliente] = useState('SRA. JENNY');
  const [saldoAnterior, setSaldoAnterior] = useState(0.00);
  const [abono, setAbono] = useState(50.00);
  const [savedNotification, setSavedNotification] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + item.cantidad * item.precio, 0);
  const totalFactura = subtotal;
  const saldoPendiente = Math.max(0, totalFactura + saldoAnterior - abono);

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Nueva Factura</h2>
          <p style={styles.subtitle}>Módulo de facturación rápida (Sprint 4 & 5 Preview)</p>
        </div>
        <div style={styles.headerPills}>
          <span style={styles.facturaPill} className="num-mono"># FACT. 5</span>
          <span style={styles.datePill}>jueves, 24 de septiembre de 2026</span>
        </div>
      </div>

      {savedNotification && (
        <div style={styles.saveSuccess}>
          <CheckCircle size={18} color="#059669" />
          <span>¡Factura guardada con éxito en la base de datos!</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Main Invoice Card */}
        <div style={styles.mainCard}>
          <div style={styles.clientSelectorRow}>
            <label style={styles.fieldLabel}>Cliente Seleccionado:</label>
            <select
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              style={styles.selectInput}
            >
              <option value="SRA. JENNY">SRA. JENNY (0201617784)</option>
              <option value="TÍA ELSA">TÍA ELSA (0925229916001)</option>
              <option value="SRA. MARY">SRA. MARY</option>
              <option value="SRA. PATRICIA">SRA. PATRICIA</option>
            </select>
          </div>

          {/* Table of items */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>CANTIDAD</th>
                  <th style={styles.th}>DESCRIPCIÓN</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>PRECIO UNIT.</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.tdQty} className="num-mono">{row.cantidad}</td>
                    <td style={styles.tdDesc}>{row.descripcion}</td>
                    <td style={{ ...styles.tdPrice, textAlign: 'right' }} className="num-mono">
                      ${row.precio.toFixed(2)}
                    </td>
                    <td style={{ ...styles.tdSubtotal, textAlign: 'right' }} className="num-mono">
                      ${(row.cantidad * row.precio).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Balance Rows */}
          <div style={styles.bottomBar}>
            <div style={styles.balanceFields}>
              <div style={styles.balanceItem}>
                <span style={styles.balanceLabel}>Saldo Anterior:</span>
                <span style={styles.balanceVal} className="num-mono">${saldoAnterior.toFixed(2)}</span>
              </div>
              <div style={styles.balanceItem}>
                <span style={styles.balanceLabel}>Abono:</span>
                <span style={styles.balanceVal} className="num-mono">${abono.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.balanceItem, borderTop: '2px solid #E2E8F0', paddingTop: '4px' }}>
                <span style={styles.balanceLabelBold}>Saldo Pendiente:</span>
                <span style={styles.balanceValBold} className="num-mono">${saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={() => {
                  setSavedNotification(true);
                  setTimeout(() => setSavedNotification(false), 3500);
                }}
                style={styles.saveBtn}
              >
                <Save size={16} />
                <span>Guardar Factura</span>
              </button>
              <button type="button" style={styles.printBtn}>
                <Printer size={16} />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Summary Sidebar (Mockup p. 23/25) */}
        <div style={styles.sideCard}>
          <h3 style={styles.sideTitle}>Resumen Rápido del Cliente</h3>
          <div style={styles.clientDetailBox}>
            <div style={styles.clientBoxRow}>
              <span style={styles.clientBoxLabel}>Saldo actual:</span>
              <span style={styles.clientBoxVal} className="num-mono">$56.00</span>
            </div>
            <div style={styles.clientBoxRow}>
              <span style={styles.clientBoxLabel}>Última compra:</span>
              <span style={styles.clientBoxSub}>2026-09-15</span>
            </div>
            <div style={styles.clientBoxRow}>
              <span style={styles.clientBoxLabel}>Teléfono:</span>
              <span style={styles.clientBoxSub}>+593 9 123 4567</span>
            </div>
          </div>

          <div style={styles.divider}></div>

          <h3 style={styles.sideTitle}>Resumen de Factura</h3>
          <div style={styles.invoiceSummary}>
            <div style={styles.summaryRow}>
              <span>Subtotal:</span>
              <span className="num-mono" style={styles.summaryNum}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Utilidad Estimada:</span>
              <span className="num-mono" style={{ ...styles.summaryNum, color: '#059669' }}>$15.50</span>
            </div>
          </div>
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
  headerPills: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  facturaPill: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
  datePill: {
    fontSize: '13px',
    color: '#64748B',
  },
  saveSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  clientSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  selectInput: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
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
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  tdQty: {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  tdDesc: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  tdPrice: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#475569',
  },
  tdSubtotal: {
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '10px',
    borderTop: '1px solid #F1F5F9',
  },
  balanceFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '240px',
  },
  balanceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
  },
  balanceLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  balanceVal: {
    fontWeight: '600',
    color: '#0F172A',
  },
  balanceLabelBold: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#E05A2B',
  },
  balanceValBold: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#E05A2B',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.25)',
  },
  printBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    padding: '11px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    height: 'fit-content',
  },
  sideTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  clientDetailBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  clientBoxRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  clientBoxLabel: {
    color: '#64748B',
  },
  clientBoxVal: {
    fontWeight: '700',
    color: '#DC2626',
  },
  clientBoxSub: {
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '4px 0',
  },
  invoiceSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
  },
  summaryNum: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#0F172A',
  }
};
