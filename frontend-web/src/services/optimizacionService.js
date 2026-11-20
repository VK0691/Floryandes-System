     import { supabase } from '../lib/supabaseClient';
import { DEFAULT_BUDGET } from '../utils/lpSolver';

const PRODUCT_CODES = ['BON-ROJ', 'BON-COL', 'BON-BLA'];
const PREVIOUS_MONTH = getPreviousMonthRange();

export async function getDatosOptimizacion(presupuestoIngresado = DEFAULT_BUDGET) {
  const [productsResult, purchasesResult, demandResult] = await Promise.all([
    supabase.from('producto').select('id_producto, codigo, nombre, costo_promedio').in('codigo', PRODUCT_CODES).eq('activo', true),
    supabase.from('compra').select('total_compra').gte('fecha_compra', getCurrentMonthStart()),
    supabase
      .from('detalle_factura')
      .select('cantidad, producto(codigo), factura!inner(fecha_emision)')
      .gte('factura.fecha_emision', PREVIOUS_MONTH.start)
      .lt('factura.fecha_emision', PREVIOUS_MONTH.end),
  ]);

  const firstError = [productsResult, purchasesResult, demandResult].find(result => result.error)?.error;
  if (firstError) throw firstError;

  const products = productsResult.data || [];
  const spent = (purchasesResult.data || []).reduce((sum, purchase) => sum + (Number(purchase.total_compra) || 0), 0);
  const demand = { rojos: 0, colores: 0, blancos: 0 };

  (demandResult.data || []).forEach(detail => {
    const code = detail.producto?.codigo;
    const key = code === 'BON-ROJ' ? 'rojos' : code === 'BON-COL' ? 'colores' : code === 'BON-BLA' ? 'blancos' : null;
    if (key) demand[key] += Number(detail.cantidad) || 0;
  });
  demand.rojos = Math.floor(demand.rojos);
  demand.colores = Math.floor(demand.colores);
  demand.blancos = Math.floor(demand.blancos);

  return {
    presupuesto: Math.max(0, Number(presupuestoIngresado) || 0),
    gastadoMes: spent,
    demanda: demand,
    productos: products,
  };
}

export async function registrarOptimizacion(datos, resultado, escenario = {}) {
  const { error } = await supabase.from('optimizacion_log').insert([{
    fecha: new Date().toISOString(),
    presupuesto_usado: resultado.presupuestoUsado,
    resultado_solver: resultado.raw,
    utilidad_estimada: resultado.utilidad,
    datos_entrada: {
      presupuesto: escenario.presupuesto ?? datos.presupuesto,
      demanda: escenario.demanda ?? datos.demanda,
      demandaHistorica: datos.demanda,
      gastadoMes: datos.gastadoMes,
    },
  }]);

  if (error) {
    console.warn('No se pudo registrar el historial de optimización:', error.message);
  }
}

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getPreviousMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
