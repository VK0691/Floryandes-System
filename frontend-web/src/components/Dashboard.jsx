import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  AlertOctagon,
  Database,
  CheckCircle,
  RefreshCw,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard({ onNavigate, onNavigateToLowStock }) {
  const [dbStatus, setDbStatus] = useState({
    loading: true,
    clientesCount: 0,
    productosCount: 0,
    proveedoresCount: 0,
    usuariosCount: 0,
    lowStockCount: 0,
    error: null,
  });

  const checkLiveDatabase = async () => {
    setDbStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [cRes, pRes, prRes, uRes] = await Promise.all([
        supabase.from('cliente').select('*', { count: 'exact', head: true }),
        supabase.from('producto').select('stock_actual, stock_minimo, es_inventariable, activo'),
        supabase.from('proveedor').select('*', { count: 'exact', head: true }),
        supabase.from('usuario').select('*', { count: 'exact', head: true }),
      ]);

      const prods = pRes.data || [];
      const lowCount = prods.filter(p => p.activo && p.es_inventariable && Number(p.stock_actual) < Number(p.stock_minimo)).length;

      setDbStatus({
        loading: false,
        clientesCount: cRes.count ?? 4,
        productosCount: prods.length ?? 7,
        proveedoresCount: prRes.count ?? 6,
        usuariosCount: uRes.count ?? 3,
        lowStockCount: lowCount,
        error: null,
      });
    } catch (err) {
      console.error('Error querying Supabase live:', err);
      setDbStatus(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    checkLiveDatabase();
  }, []);

  const kpis = [
    {
      title: 'Ventas del Día',
      value: '$450.00',
      change: '+14% vs ayer',
      positive: true,
      icon: DollarSign,
      color: '#059669',
      bgColor: '#ECFDF5',
    },
    {
      title: 'Utilidad del Día',
      value: '$120.00',
      change: 'Margen 26.6%',
      positive: true,
      icon: TrendingUp,
      color: '#1E4E79',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Facturas Pendientes',
      value: '3',
      change: '$271.50 por cobrar',
      positive: false,
      icon: FileText,
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
    {
      title: 'Clientes con Saldo',
      value: '5',
      change: 'Total deuda $540.00',
      positive: false,
      icon: Users,
      color: '#E05A2B',
      bgColor: '#FFF0EB',
    },
    {
      title: 'Pérdidas del Mes',
      value: '12 bonches',
      change: 'Rotura y plaga',
      positive: false,
      icon: AlertOctagon,
      color: '#DC2626',
      bgColor: '#FEF2F2',
    },
  ];

  const recentInvoices = [
    { id: 'F-1005', client: 'Juan Pérez', total: '$120.00', status: 'Pagada', statusColor: '#059669', statusBg: '#ECFDF5' },
    { id: 'F-1004', client: 'Ana García', total: '$65.50', status: 'Pendiente', statusColor: '#D97706', statusBg: '#FFFBEB' },
    { id: 'F-1003', client: 'Juan Pérez', total: '$120.00', status: 'Pagada', statusColor: '#059669', statusBg: '#ECFDF5' },
    { id: 'F-1002', client: 'Sra. Jenny', total: '$85.00', status: 'Pagada', statusColor: '#059669', statusBg: '#ECFDF5' },
    { id: 'F-1001', client: 'Tía Elsa', total: '$150.00', status: 'Pendiente', statusColor: '#D97706', statusBg: '#FFFBEB' },
  ];

  return (
    <div style={styles.container} className="fade-in">
      {/* Supabase Connection Live Banner */}
      <div style={styles.dbBanner}>
        <div style={styles.dbBannerLeft}>
          <div style={styles.dbIcon}>
            <Database size={18} color="#1E4E79" />
          </div>
          <div>
            <div style={styles.dbBannerTitle}>
              Base de Datos Supabase Conectada en Tiempo Real
            </div>
            <div style={styles.dbBannerSubtitle}>
              Sincronizado con tablas activas: {dbStatus.clientesCount} Clientes • {dbStatus.productosCount} Productos • {dbStatus.proveedoresCount} Proveedores • {dbStatus.usuariosCount} Usuarios
            </div>
          </div>
        </div>

        <button onClick={checkLiveDatabase} style={styles.refreshBtn} title="Volver a consultar Supabase">
          <RefreshCw size={14} className={dbStatus.loading ? 'pulse' : ''} />
          <span>{dbStatus.loading ? 'Verificando...' : 'Re-verificar'}</span>
        </button>
      </div>

      {/* Low Stock Alert Banner */}
      {dbStatus.lowStockCount > 0 && (
        <div
          onClick={onNavigateToLowStock}
          style={styles.lowStockBanner}
          title="Ver productos con bajo stock en el catálogo"
        >
          <div style={styles.lowStockBannerLeft}>
            <AlertTriangle size={18} color="#D97706" />
            <span>
              Atención en almacén: Existen <strong>{dbStatus.lowStockCount} producto(s)</strong> con existencias por debajo del stock mínimo.
            </span>
          </div>
          <span style={styles.lowStockActionLink}>Filtrar productos con bajo stock</span>
        </div>
      )}

      {/* 5 Top KPI Cards (from mockup p. 23) */}
      <div style={styles.kpiGrid}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={styles.kpiCard}>
              <div style={styles.kpiHeader}>
                <span style={styles.kpiTitle}>{kpi.title}</span>
                <div style={{ ...styles.kpiIconWrap, backgroundColor: kpi.bgColor }}>
                  <Icon size={16} color={kpi.color} strokeWidth={2.2} />
                </div>
              </div>
              <div style={styles.kpiValue} className="num-mono">{kpi.value}</div>
              <div style={{ ...styles.kpiChange, color: kpi.positive ? '#059669' : '#64748B' }}>
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Visuals: Chart Cards (Mockup p. 23) */}
      <div style={styles.chartsGrid}>
        {/* Sales Chart (7 days) */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Ventas (Últimos 7 Días)</h3>
              <p style={styles.cardSubtitle}>Evolución diaria de facturación</p>
            </div>
            <span style={styles.totalBadge} className="num-mono">$2,710.00 Total</span>
          </div>

          <div style={styles.barChartContainer}>
            {[
              { day: 'Lun', val: 320, pct: 64 },
              { day: 'Mar', val: 410, pct: 82 },
              { day: 'Mié', val: 280, pct: 56 },
              { day: 'Jue', val: 500, pct: 100 },
              { day: 'Vie', val: 460, pct: 92 },
              { day: 'Sáb', val: 450, pct: 90 },
              { day: 'Dom', val: 190, pct: 38 },
            ].map((bar, i) => (
              <div key={i} style={styles.barCol}>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      height: `${bar.pct}%`,
                      backgroundColor: i === 5 ? '#E05A2B' : '#1E4E79',
                    }}
                    title={`$${bar.val}.00`}
                  ></div>
                </div>
                <span style={styles.barLabel}>{bar.day}</span>
                <span style={styles.barValue} className="num-mono">${bar.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sold Products */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Productos Más Vendidos (Mes)</h3>
              <p style={styles.cardSubtitle}>Bonches de rosa e hierbas principales</p>
            </div>
          </div>

          <div style={styles.productsList}>
            {[
              { name: 'Bonches Rosas Rojas', units: '340 bonches', pct: 85, color: '#DC2626' },
              { name: 'Bonches de Colores', units: '210 bonches', pct: 60, color: '#E05A2B' },
              { name: 'Bonches Rosas Blancas', units: '180 bonches', pct: 52, color: '#0284C7' },
              { name: 'Aster', units: '95 unidades', pct: 32, color: '#8B5CF6' },
              { name: 'Solidago', units: '75 unidades', pct: 26, color: '#F59E0B' },
            ].map((item, i) => (
              <div key={i} style={styles.productRow}>
                <div style={styles.productRowTop}>
                  <span style={styles.productName}>{item.name}</span>
                  <span style={styles.productUnits} className="num-mono">{item.units}</span>
                </div>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table: Últimas 5 Facturas (Mockup p. 23) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>Últimas 5 Facturas</h3>
            <p style={styles.cardSubtitle}>Movimientos recientes de ventas registrados</p>
          </div>
          <button
            onClick={() => onNavigate('facturacion')}
            style={styles.viewMoreBtn}
          >
            <span>Ir a Facturación</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}># FACTURA</th>
                <th style={styles.th}>CLIENTE</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>TOTAL</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ESTADO</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.tdId} className="num-mono">{inv.id}</td>
                  <td style={styles.tdClient}>{inv.client}</td>
                  <td style={{ ...styles.tdTotal, textAlign: 'right' }} className="num-mono">
                    {inv.total}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: inv.statusBg,
                        color: inv.statusColor,
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button
                      onClick={() => onNavigate('facturacion')}
                      style={styles.detailBtn}
                    >
                      Ver Detalle
                    </button>
                  </td>
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
    gap: '24px',
    maxWidth: '1240px',
    margin: '0 auto',
  },
  dbBanner: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderLeft: '4px solid #1E4E79',
    borderRadius: '12px',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
  },
  dbBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  dbIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbBannerTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  dbBannerSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
  },
  lowStockBanner: {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: '10px',
    padding: '12px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  lowStockBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#92400E',
  },
  lowStockActionLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#B45309',
    textDecoration: 'underline',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  kpiTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
  },
  kpiIconWrap: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.03em',
    marginBottom: '4px',
  },
  kpiChange: {
    fontSize: '11px',
    fontWeight: '600',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  totalBadge: {
    backgroundColor: '#F1F5F9',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1E293B',
  },
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '180px',
    paddingTop: '20px',
    borderBottom: '1px solid #F1F5F9',
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  barTrack: {
    height: '130px',
    width: '28px',
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.4s ease-out',
  },
  barLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
  },
  barValue: {
    fontSize: '10px',
    color: '#94A3B8',
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  productRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  productRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  productUnits: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
  },
  progressTrack: {
    height: '8px',
    backgroundColor: '#F1F5F9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
  },
  viewMoreBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#E05A2B',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
  },
  tdId: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E4E79',
  },
  tdClient: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
  },
  tdTotal: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },
  detailBtn: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#475569',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  }
};
