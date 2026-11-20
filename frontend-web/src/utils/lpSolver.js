import solver from 'javascript-lp-solver';

export const DEFAULT_BUDGET = 1200;

const PRODUCT_VARIABLES = [
  { key: 'x1', code: 'BON-ROJ', profit: 1.15 },
  { key: 'x2', code: 'BON-COL', profit: 1.65 },
  { key: 'x3', code: 'BON-BLA', profit: 1.65 },
];

export function solveSimpleTestModel() {
  const result = solver.Solve({
    optimize: 'profit',
    opType: 'max',
    constraints: { capacity: { max: 10 } },
    variables: {
      product: { capacity: 1, profit: 2 },
    },
    ints: { product: 1 },
  });

  console.log('LP solver test:', result);
  return result;
}

export function solveCompraOptima({
  presupuesto = DEFAULT_BUDGET,
  demanda = {},
} = {}) {
  const normalizedBudget = Math.max(0, Number(presupuesto) || 0);
  const constraints = {
    presupuesto: { max: normalizedBudget },
    demanda_rojos: { max: Math.max(0, Number(demanda.rojos) || 0) },
    demanda_colores: { max: Math.max(0, Number(demanda.colores) || 0) },
    demanda_blancos: { max: Math.max(0, Number(demanda.blancos) || 0) },
  };

  const variables = Object.fromEntries(PRODUCT_VARIABLES.map(({ key, code, profit }) => [key, {
      utilidad: profit,
      presupuesto: 1.35,
      [`demanda_${code === 'BON-ROJ' ? 'rojos' : code === 'BON-COL' ? 'colores' : 'blancos'}`]: 1,
    }]));

  const result = solver.Solve({
    optimize: 'utilidad',
    opType: 'max',
    constraints,
    variables,
    ints: { x1: 1, x2: 1, x3: 1 },
  });

  if (!result.feasible) {
    throw new Error('No existe una compra factible con los recursos y la demanda disponibles.');
  }

  const cantidades = {
    rojos: Math.max(0, Math.round(Number(result.x1) || 0)),
    colores: Math.max(0, Math.round(Number(result.x2) || 0)),
    blancos: Math.max(0, Math.round(Number(result.x3) || 0)),
  };

  return {
    ...cantidades,
    utilidad: Number(
      (cantidades.rojos * 1.15 + cantidades.colores * 1.65 + cantidades.blancos * 1.65).toFixed(2),
    ),
    presupuestoUsado: Number(
      ((cantidades.rojos + cantidades.colores + cantidades.blancos) * 1.35).toFixed(2),
    ),
    totalBonches: cantidades.rojos + cantidades.colores + cantidades.blancos,
    limitadoPor: getLimitingResource({ cantidades, presupuesto: normalizedBudget, demanda }),
    raw: result,
  };
}

function getLimitingResource({ cantidades, presupuesto, demanda }) {
  const total = cantidades.rojos + cantidades.colores + cantidades.blancos;
  const limits = [
    { name: 'presupuesto', value: presupuesto / 1.35, used: total },
    { name: 'demanda_rojos', value: Number(demanda.rojos) || 0, used: cantidades.rojos },
    { name: 'demanda_colores', value: Number(demanda.colores) || 0, used: cantidades.colores },
    { name: 'demanda_blancos', value: Number(demanda.blancos) || 0, used: cantidades.blancos },
  ];

  return limits.find(limit => Number.isFinite(limit.value) && limit.value >= 0 && limit.used >= limit.value - 0.0001)?.name || null;
}
