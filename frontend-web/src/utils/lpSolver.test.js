import assert from 'node:assert/strict';
import test from 'node:test';
import { solveCompraOptima } from './lpSolver.js';

test('resuelve la compra óptima respetando presupuesto, insumos y demanda', () => {
  const result = solveCompraOptima({
    presupuesto: 67.5,
    demanda: { rojos: 100, colores: 100, blancos: 100 },
  });

  assert.equal(result.totalBonches, 50);
  assert.equal(result.utilidad, 82.5);
  assert.equal(result.rojos + result.colores + result.blancos, 50);
});

test('ignora completamente el stock de insumos', () => {
  const result = solveCompraOptima({
    presupuesto: 9.45,
    demanda: { rojos: 10, colores: 10, blancos: 10 },
  });

  assert.equal(result.totalBonches, 7);
  assert.equal(result.limitadoPor, 'presupuesto');
});
