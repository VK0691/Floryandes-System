import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Loader2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { getDatosOptimizacion, registrarOptimizacion } from '../services/optimizacionService';
import { DEFAULT_BUDGET, solveCompraOptima } from '../utils/lpSolver';

const EMPTY_DEMAND = { rojos: 0, colores: 0, blancos: 0 };
const BONCHE_COST = 1.35;

export default function CompraOptimizer({ onApply, showBudgetControl = true }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [datos, setDatos] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [scenarioDemand, setScenarioDemand] = useState(EMPTY_DEMAND);
  const [showLogic, setShowLogic] = useState(false);

  const recalculate = (nextBudget, nextDemand, sourceData = datos) => {
    setBudget(nextBudget);
    setScenarioDemand(nextDemand);
    if (!sourceData) return;
    setResultado(solveCompraOptima({
      ...sourceData,
      presupuesto: nextBudget,
      demanda: nextDemand,
    }));
  };

  const calculate = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const currentData = await getDatosOptimizacion(budget);
      const currentDemand = currentData.demanda || EMPTY_DEMAND;
      const currentResult = solveCompraOptima({
        ...currentData,
        presupuesto: budget,
        demanda: currentDemand,
      });
      setDatos(currentData);
      setScenarioDemand(currentDemand);
      setResultado(currentResult);
      setShowLogic(false);
    } catch (error) {
      console.error('Error calculando compra óptima:', error);
      setErrorMsg(error.message || 'No se pudo calcular la compra óptima.');
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = event => {
    const nextBudget = Number(event.target.value);
    recalculate(nextBudget, scenarioDemand);
  };

  const handleDemandChange = (color, value) => {
    const nextDemand = {
      ...scenarioDemand,
      [color]: Math.max(0, Number(value) || 0),
    };
    recalculate(budget, nextDemand);
  };

  const applyScenario = scenario => {
    const nextDemand = scenario === 'base'
      ? datos.demanda
      : scenario === 'rojos'
        ? { rojos: Math.min(1000, Math.max(datos.demanda.rojos * 2, datos.demanda.rojos + 100)), colores: datos.demanda.colores, blancos: datos.demanda.blancos }
        : { rojos: 0, colores: datos.demanda.colores, blancos: datos.demanda.blancos };
    recalculate(budget, nextDemand);
  };

  const handleApply = async () => {
    if (!resultado || !datos) return;
    await registrarOptimizacion(datos, resultado, {
      presupuesto: budget,
      demanda: scenarioDemand,
    });
    onApply({ resultado, datos: { ...datos, presupuesto: budget, demanda: scenarioDemand } });
  };

  const close = () => {
    setResultado(null);
    setDatos(null);
    setErrorMsg('');
    setShowLogic(false);
  };

  const requestedCost = useMemo(
    () => Object.values(scenarioDemand).reduce((sum, value) => sum + value, 0) * BONCHE_COST,
    [scenarioDemand],
  );
  const budgetShortfall = Math.max(0, requestedCost - budget);
  const totalDemand = Object.values(scenarioDemand).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <div style={{ ...styles.optimizerControls, ...(showBudgetControl ? {} : styles.optimizerControlsCompact) }}>
        {showBudgetControl && (
          <label style={styles.budgetField}>
            <div style={styles.budgetLabelText}>
              <span>Presupuesto disponible</span>
              <small style={styles.budgetLabelTextSmall}>Arrastra para simular otro escenario</small>
            </div>
            <div style={styles.rangeGroup}>
              <span style={styles.currency}>${budget}</span>
              <input type="range" min="0" max="2500" step="50" value={budget} onChange={handleBudgetChange} style={styles.range} disabled={loading} />
            </div>
          </label>
        )}
        <button type="button" onClick={calculate} style={styles.actionButton} disabled={loading}>
          {loading ? <Loader2 size={17} className="spin" /> : <Calculator size={17} />}
          <span>{loading ? 'Calculando...' : 'Calcular Compra Óptima'}</span>
        </button>
      </div>

      {errorMsg && <div style={styles.error}><AlertTriangle size={16} />{errorMsg}</div>}

      {resultado && datos && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="optimizer-title">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <div style={styles.modalIcon}><Sparkles size={19} /></div>
                <div>
                  <div style={styles.titleLine}>
                    <h2 id="optimizer-title" style={styles.title}>Optimización de Compra</h2>
                    <span style={styles.methodBadge}>Método Símplex</span>
                  </div>
                  <p style={styles.subtitle}>Simulador de utilidad sujeto a presupuesto y demanda personalizada</p>
                </div>
              </div>
              <button type="button" onClick={close} style={styles.close} aria-label="Cerrar"><X size={19} /></button>
            </div>

            <div style={styles.modalBudget}>
              <div style={styles.modalBudgetLabel}>
                <strong>Presupuesto de simulación</strong>
                <span style={styles.modalBudgetHint}>Desde $0 hasta $2.500, en pasos de $50</span>
              </div>
              <strong style={styles.modalBudgetValue}>${budget}</strong>
              <input type="range" min="0" max="2500" step="50" value={budget} onChange={handleBudgetChange} style={styles.modalRange} />
            </div>

            <div style={styles.investmentCard}>
              <div style={styles.utilityBlock}>
                <div style={styles.eyebrow}><TrendingUp size={15} /> Utilidad neta estimada</div>
                <strong style={styles.utilityValue}>${resultado.utilidad.toFixed(2)}</strong>
                <span style={styles.optimalLabel}><CircleCheck size={15} /> Solución óptima encontrada</span>
              </div>
              <div style={styles.capitalBlock}>
                <div style={styles.capitalHeader}>
                  <span>Capital invertido</span>
                  <strong>${resultado.presupuestoUsado.toFixed(2)} <em>/ ${budget.toFixed(2)}</em></strong>
                </div>
                <div style={styles.progressTrack}><span style={{ ...styles.progressBar, width: `${budget ? Math.min(100, (resultado.presupuestoUsado / budget) * 100) : 0}%` }} /></div>
                <span style={styles.capitalFooter}>Saldo libre: ${(budget - resultado.presupuestoUsado).toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.distributionHeader}>
              <strong>Distribución sugerida ({resultado.totalBonches} bonches totales)</strong>
              <span>Demanda simulada: <b>{totalDemand}</b></span>
            </div>
            <div style={styles.metrics}>
              <Metric label="Bonches Rojos" value={resultado.rojos} total={resultado.totalBonches} color="#F43F5E" />
              <Metric label="Bonches de Colores" value={resultado.colores} total={resultado.totalBonches} color="#8B5CF6" />
              <Metric label="Bonches Blancos" value={resultado.blancos} total={resultado.totalBonches} color="#F59E0B" />
            </div>

            <div style={styles.scenarioPanel}>
              <div style={styles.scenarioHeader}>
                <div>
                  <strong style={styles.scenarioTitle}>Simulador de escenarios</strong>
                  <span style={styles.scenarioHint}>Ajusta la demanda y observa el nuevo resultado.</span>
                </div>
                <div style={styles.scenarioButtons}>
                  <button type="button" style={styles.scenarioButton} onClick={() => applyScenario('base')}>Escenario Base</button>
                  <button type="button" style={styles.scenarioButton} onClick={() => applyScenario('rojos')}>Muchos Rojos</button>
                  <button type="button" style={styles.scenarioButton} onClick={() => applyScenario('colores')}>Solo Colores y Blancos</button>
                </div>
              </div>
              <div style={styles.demandControls}>
                <DemandControl label="Rojos" value={scenarioDemand.rojos} onChange={value => handleDemandChange('rojos', value)} />
                <DemandControl label="Colores" value={scenarioDemand.colores} onChange={value => handleDemandChange('colores', value)} />
                <DemandControl label="Blancos" value={scenarioDemand.blancos} onChange={value => handleDemandChange('blancos', value)} />
              </div>
            </div>

            {budgetShortfall > 0 && (
              <div style={styles.warning}>
                <AlertTriangle size={18} />
                <span>Con este presupuesto no puedes cubrir toda la demanda solicitada. Faltan ${budgetShortfall.toFixed(2)}.</span>
              </div>
            )}

            <button type="button" onClick={() => setShowLogic(value => !value)} style={styles.logicToggle}>
              <span>¿Cómo se calculó esta sugerencia? Ver lógica Símplex</span>
              {showLogic ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {showLogic && <LogicPanel resultado={resultado} demanda={scenarioDemand} budget={budget} />}

            <div style={styles.actions}>
              <span style={styles.footerHint}>Los valores se cargarán en la orden de compra</span>
              <button type="button" onClick={close} style={styles.secondary}>Cerrar</button>
              <button type="button" onClick={handleApply} style={styles.primary}>
                Aplicar Sugerencia <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DemandControl({ label, value, onChange }) {
  return (
    <label style={styles.demandControl}>
      <span>{label}</span>
      <input type="number" min="0" step="1" value={value} onChange={event => onChange(event.target.value)} style={styles.demandInput} />
    </label>
  );
}

function Metric({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <div style={styles.metricValueRow}>
        <strong style={styles.metricValue}>{value}</strong>
        <span style={styles.metricPercent}>{percentage}%</span>
      </div>
      <div style={styles.metricTrack}><span style={{ ...styles.metricBar, width: `${percentage}%`, background: color }} /></div>
    </div>
  );
}

function LogicPanel({ resultado, demanda, budget }) {
  const activeRestriction = resultado.limitadoPor
    ? getRestrictionLabel(resultado.limitadoPor)
    : 'No hay una restricción completamente saturada.';
  const remaining = Math.max(0, budget - resultado.presupuestoUsado);

  return (
    <div style={styles.logicPanel}>
      <strong>Lógica del algoritmo</strong>
      <ol>
        <li>Colores y Blancos generan una utilidad de $1.65 por bonche; Rojos generan $1.15.</li>
        <li>El solver asigna primero los productos de mayor utilidad hasta alcanzar su demanda simulada.</li>
        <li>Con el presupuesto restante de ${remaining.toFixed(2)}, completa la mejor combinación posible.</li>
      </ol>
      <div style={styles.activeRestriction}>
        <AlertTriangle size={16} />
        <span>Restricción activa: {activeRestriction}. Demanda evaluada: {demanda.rojos} rojos, {demanda.colores} colores y {demanda.blancos} blancos.</span>
      </div>
    </div>
  );
}

function getRestrictionLabel(resource) {
  if (resource === 'presupuesto') return 'límite de presupuesto';
  if (resource === 'demanda_rojos') return 'límite de demanda de Rojos';
  if (resource === 'demanda_colores') return 'límite de demanda de Colores';
  return 'límite de demanda de Blancos';
}

const styles = {
  optimizerControls: { display: 'flex', alignItems: 'center', gap: '16px' },
  actionButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '205px', padding: '11px 15px', border: 'none', borderRadius: '9px', background: 'linear-gradient(135deg, #5B4AEF, #4F46E5)', color: '#fff', fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 8px rgba(79,70,229,.25)' },
  budgetField: { display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '12px', fontWeight: '700' },
  budgetLabelText: { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '145px' },
  budgetLabelTextSmall: { color: '#94A3B8' },
  rangeGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  currency: { minWidth: '54px', color: '#1E293B', fontSize: '15px', fontWeight: '800' },
  range: { width: '130px', accentColor: '#4F46E5', cursor: 'pointer' },
  error: { position: 'absolute', right: '18px', bottom: '-38px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 12px', borderRadius: '8px', background: '#FEF2F2', color: '#B91C1C', fontSize: '13px' },
  optimizerControlsCompact: { justifyContent: 'flex-end' },
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 20px', background: 'rgba(15,23,42,.48)', overflowY: 'auto' },
  modal: { width: 'min(820px, 100%)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: '#fff', borderRadius: '14px', padding: '24px 28px 20px', boxShadow: '0 20px 50px rgba(15,23,42,.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
  modalTitleGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  modalIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#4F46E5', color: '#fff' },
  titleLine: { display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' },
  title: { margin: 0, color: '#1E293B', fontSize: '20px' },
  methodBadge: { padding: '4px 9px', borderRadius: '999px', background: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: '700' },
  subtitle: { margin: '5px 0 0', color: '#64748B', fontSize: '13px' },
  close: { border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' },
  modalBudget: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 16px', alignItems: 'center', marginBottom: '18px', padding: '12px 15px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC' },
  modalBudgetLabel: { display: 'flex', flexDirection: 'column', gap: '3px' },
  modalBudgetHint: { color: '#94A3B8', fontSize: '11px' },
  modalBudgetValue: { color: '#1E293B', fontSize: '18px' },
  modalRange: { gridColumn: '1 / -1', width: '100%', accentColor: '#4F46E5' },
  investmentCard: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px', border: '1px solid #A7F3D0', borderRadius: '14px', background: '#F0FDF8' },
  utilityBlock: { display: 'flex', flexDirection: 'column', gap: '5px', borderRight: '1px solid #BBF7D0' },
  eyebrow: { display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' },
  utilityValue: { color: '#0F172A', fontSize: '35px', lineHeight: 1.1 },
  optimalLabel: { display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '12px', fontWeight: '600' },
  capitalBlock: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' },
  capitalHeader: { display: 'flex', justifyContent: 'space-between', gap: '8px', color: '#64748B', fontSize: '12px' },
  capitalFooter: { color: '#64748B', fontSize: '11px', textAlign: 'right' },
  progressTrack: { height: '8px', overflow: 'hidden', borderRadius: '999px', background: '#D1FAE5' },
  progressBar: { display: 'block', height: '100%', borderRadius: 'inherit', background: '#059669' },
  distributionHeader: { display: 'flex', justifyContent: 'space-between', gap: '12px', margin: '20px 0 10px', color: '#64748B', fontSize: '12px' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '0 0 16px' },
  metric: { display: 'flex', flexDirection: 'column', gap: '9px', padding: '15px', border: '1px solid #E2E8F0', borderRadius: '11px' },
  metricLabel: { color: '#64748B', fontSize: '12px' },
  metricValueRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  metricValue: { color: '#1E293B', fontSize: '27px' },
  metricPercent: { color: '#94A3B8', fontSize: '12px', fontWeight: '700' },
  metricTrack: { height: '4px', overflow: 'hidden', borderRadius: '999px', background: '#E2E8F0' },
  metricBar: { display: 'block', height: '100%', borderRadius: 'inherit' },
  scenarioPanel: { padding: '15px', border: '1px solid #E2E8F0', borderRadius: '11px', background: '#FFFFFF' },
  scenarioHeader: { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' },
  scenarioTitle: { display: 'block', color: '#1E293B', fontSize: '13px' },
  scenarioHint: { display: 'block', marginTop: '3px', color: '#64748B', fontSize: '11px' },
  scenarioButtons: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '5px' },
  scenarioButton: { padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '10px', cursor: 'pointer' },
  demandControls: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' },
  demandControl: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: '#64748B', fontSize: '12px', fontWeight: '700' },
  demandInput: { width: '75px', padding: '7px 8px', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#1E293B', fontWeight: '700' },
  warning: { display: 'flex', gap: '9px', alignItems: 'flex-start', marginTop: '12px', padding: '12px', borderRadius: '8px', color: '#92400E', background: '#FFFBEB', fontSize: '13px', lineHeight: 1.4 },
  logicToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '14px', padding: '11px 0', border: 'none', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', background: 'transparent', color: '#475569', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textAlign: 'left' },
  logicPanel: { padding: '13px 15px', color: '#475569', background: '#F8FAFC', fontSize: '12px', lineHeight: 1.5 },
  activeRestriction: { display: 'flex', gap: '7px', marginTop: '9px', padding: '8px', borderRadius: '6px', color: '#92400E', background: '#FFFBEB' },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '9px', marginTop: '18px' },
  footerHint: { marginRight: 'auto', color: '#94A3B8', fontSize: '11px' },
  secondary: { padding: '9px 14px', border: '1px solid #CBD5E1', borderRadius: '7px', background: '#fff', color: '#475569', cursor: 'pointer' },
  primary: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 15px', border: 'none', borderRadius: '9px', background: '#0F172A', color: '#fff', fontWeight: '700', cursor: 'pointer' },
};
