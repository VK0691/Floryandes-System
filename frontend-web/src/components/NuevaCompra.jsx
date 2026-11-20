import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Calendar,
  Truck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  ArrowLeft,
  DollarSign,
  PackageCheck,
  TrendingDown,
  Info
} from 'lucide-react';
import { getProveedores, getProximoNumeroCompra, crearCompra } from '../services/comprasService';
import { getProductos } from '../services/productosService';
import { useAuth } from '../context/AuthContext';

const calculatePurchaseRow = (row) => {
  const recibida = Math.max(0, parseFloat(row.cantidad_recibida) || 0);
  const perdida = Math.min(recibida, Math.max(0, parseFloat(row.cantidad_perdida) || 0));
  const sana = Math.max(0, recibida - perdida);
  const costoUnit = Math.max(0, parseFloat(row.costo_unitario) || 0);
  const subtotal = sana * costoUnit;
  const costoTotalRecibido = recibida * costoUnit;
  const costoRealSano = sana > 0 ? costoTotalRecibido / sana : costoUnit;

  return {
    ...row,
    cantidad_sana: String(sana),
    subtotal: Math.round(subtotal * 100) / 100,
    costo_real_sano: Math.round(costoRealSano * 100) / 100,
  };
};

export default function NuevaCompra({ onVolver, onCompraGuardada, initialSuggestion = null }) {
  const { currentUser } = useAuth();

  // Header states
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const [numeroCompra, setNumeroCompra] = useState(2001);
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [estado] = useState('PENDIENTE');
  const [observaciones, setObservaciones] = useState('');

  // Products available
  const [productosCatalogo, setProductosCatalogo] = useState([]);

  // Items table
  const [items, setItems] = useState([
    {
      id: 1,
      id_producto: '',
      cantidad_recibida: '10',
      cantidad_perdida: '0',
      cantidad_sana: '10',
      motivo_perdida: 'Maltratados',
      costo_unitario: '1.50',
      subtotal: 15.00,
      costo_real_sano: 1.50,
    }
  ]);

  // Loading & status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial load
  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [provs, nextNum, prodsRes] = await Promise.all([
          getProveedores(),
          getProximoNumeroCompra(),
          getProductos({ pageSize: 100 }),
        ]);

        setProveedores(provs);
        if (provs.length > 0) {
          setSelectedProveedorId(String(provs[0].id_proveedor));
        }

        setNumeroCompra(nextNum);

        const prods = prodsRes?.productos || [];
        setProductosCatalogo(prods);

        if (initialSuggestion && prods.length > 0) {
          const suggestedItems = [
            ['BON-ROJ', initialSuggestion.resultado.rojos],
            ['BON-COL', initialSuggestion.resultado.colores],
            ['BON-BLA', initialSuggestion.resultado.blancos],
          ]
            .map(([code, quantity], index) => {
              const product = prods.find(item => item.codigo === code);
              if (!product || quantity <= 0) return null;
              return calculatePurchaseRow({
                id: Date.now() + index,
                id_producto: String(product.id_producto),
                cantidad_recibida: String(quantity),
                cantidad_perdida: '0',
                cantidad_sana: String(quantity),
                motivo_perdida: 'Maltratados',
                costo_unitario: '1.35',
              });
            })
            .filter(Boolean);

          if (suggestedItems.length > 0) {
            setItems(suggestedItems);
          }
        } else if (prods.length > 0) {
          setItems(prev => [
            {
              ...prev[0],
              id_producto: String(prods[0].id_producto),
              costo_unitario: prods[0].costo_promedio ? String(prods[0].costo_promedio) : '1.50',
              subtotal: 10 * (parseFloat(prods[0].costo_promedio) || 1.50),
              costo_real_sano: parseFloat(prods[0].costo_promedio) || 1.50,
            }
          ]);
        }
      } catch (err) {
        console.error('Error inicializando nueva compra:', err);
        setErrorMsg('Error al cargar proveedores o catálogo.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [initialSuggestion]);

  // Add product row
  const handleAddRow = () => {
    const firstProd = productosCatalogo[0];
    const newRow = calculatePurchaseRow({
      id: Date.now(),
      id_producto: firstProd ? String(firstProd.id_producto) : '',
      cantidad_recibida: '10',
      cantidad_perdida: '0',
      cantidad_sana: '10',
      motivo_perdida: 'Maltratados',
      costo_unitario: firstProd && firstProd.costo_promedio ? String(firstProd.costo_promedio) : '1.50',
    });
    setItems(prev => [...prev, newRow]);
  };

  // Remove product row
  const handleRemoveRow = (idx) => {
    if (items.length === 1) {
      setErrorMsg('La compra debe contener al menos un producto.');
      return;
    }
    setErrorMsg('');
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle row changes
  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const next = [...prev];
      const target = { ...next[idx], [field]: val };

      // Si cambió el producto, actualizar costo sugerido
      if (field === 'id_producto') {
        const pFound = productosCatalogo.find(p => String(p.id_producto) === String(val));
        if (pFound && pFound.costo_promedio) {
          target.costo_unitario = String(pFound.costo_promedio);
        }
      }

      next[idx] = calculatePurchaseRow(target);
      return next;
    });
  };

  // Totales de la compra
  const totalRecibido = items.reduce((acc, it) => acc + (parseFloat(it.cantidad_recibida) || 0), 0);
  const totalSano = items.reduce((acc, it) => acc + (parseFloat(it.cantidad_sana) || 0), 0);
  const totalPerdido = items.reduce((acc, it) => acc + (parseFloat(it.cantidad_perdida) || 0), 0);
  const totalCompra = items.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);

  // Guardar compra
  const handleGuardarCompra = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProveedorId) {
      setErrorMsg('Debe seleccionar un proveedor.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Debe ingresar al menos un producto.');
      return;
    }

    // Validar productos
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.id_producto) {
        setErrorMsg(`Fila ${i + 1}: Debe seleccionar un producto.`);
        return;
      }
      if (parseFloat(row.cantidad_recibida) <= 0) {
        setErrorMsg(`Fila ${i + 1}: La cantidad recibida debe ser mayor a 0.`);
        return;
      }
      if (parseFloat(row.costo_unitario) <= 0) {
        setErrorMsg(`Fila ${i + 1}: El costo unitario debe ser mayor a 0.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await crearCompra({
        numero_compra: numeroCompra,
        id_proveedor: selectedProveedorId,
        id_usuario: currentUser?.id || 1,
        fecha_compra: fechaCompra,
        total_compra: totalCompra,
        total_pagado: 0,
        estado: 'PENDIENTE',
        observaciones: observaciones,
        detalles: items.map(it => ({
          id_producto: it.id_producto,
          cantidad_recibida: parseFloat(it.cantidad_recibida) || 0,
          cantidad_sana: parseFloat(it.cantidad_sana) || 0,
          cantidad_perdida: parseFloat(it.cantidad_perdida) || 0,
          motivo_perdida: it.cantidad_perdida > 0 ? it.motivo_perdida : null,
          costo_unitario: parseFloat(it.costo_unitario) || 0,
          subtotal: parseFloat(it.subtotal) || 0,
        })),
      });

      if (res.success) {
        setSuccessMsg(`¡Compra #${numeroCompra} guardada con éxito! Se actualizó el stock y costo promedio.`);
        if (onCompraGuardada) {
          setTimeout(() => {
            onCompraGuardada(res.compra);
          }, 1200);
        }
      } else {
        setErrorMsg(res.error || 'Error al guardar la compra.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error inesperado al procesar la compra.');
    } finally {
      setSaving(false);
    }
  };

  const provSeleccionado = proveedores.find(p => String(p.id_proveedor) === String(selectedProveedorId));

  return (
    <div style={styles.container} className="fade-in">
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            type="button"
            onClick={onVolver}
            style={styles.backBtn}
            title="Regresar al listado de compras"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <div>
            <h2 style={styles.title}>Registrar Nueva Compra</h2>
            <p style={styles.subtitle}>
              Ingreso de mercadería de finca con control de bonches sanos, mermas y absorción de costos
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.secuenciaBadge}>
            <span style={styles.secuenciaLabel}>No. Secuencial:</span>
            <span style={styles.secuenciaNum} className="num-mono">#{numeroCompra}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={styles.successAlert}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleGuardarCompra} style={styles.form}>
        {/* Cabecera Card (Historia 6.1) */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Truck size={18} color="#1E4E79" />
            <h3 style={styles.cardTitle}>Cabecera de Compra</h3>
          </div>

          <div style={styles.cabeceraGrid} className="responsive-two-col">
            {/* Proveedor */}
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>
                  Proveedor / Finca <span style={styles.required}>*</span>
                </label>
                {provSeleccionado?.tipo && (
                  <span style={styles.provTypePill}>{provSeleccionado.tipo}</span>
                )}
              </div>
              <select
                value={selectedProveedorId}
                onChange={(e) => setSelectedProveedorId(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre} {p.tipo ? `(${p.tipo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de compra */}
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>
                  Fecha de Compra <span style={styles.required}>*</span>
                </label>
                <Calendar size={13} color="#64748B" />
              </div>
              <input
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            {/* Estado inicial */}
            <div style={styles.field}>
              <label style={styles.label}>Estado de la Compra</label>
              <div style={styles.estadoBox}>
                <span style={styles.estadoBadge}>{estado}</span>
                <span style={styles.estadoHint}>Se ingresa como pendiente de liquidación</span>
              </div>
            </div>

            {/* Observaciones */}
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Observaciones / Guía</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{observaciones.length}/500</span>
              </div>
              <input
                type="text"
                maxLength={500}
                placeholder="Ej: Guía de remisión #1204 - Entrega matutina"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value.slice(0, 500))}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Tabla de Productos y Mermas (Historias 6.2 y 6.3) */}
        <div style={styles.card}>
          <div style={styles.tableHeaderRow}>
            <div style={styles.cardHeader}>
              <PackageCheck size={18} color="#E05A2B" />
              <h3 style={styles.cardTitle}>Productos Comprados, Sanos y Mermas</h3>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              style={styles.btnAddRow}
              title="Añadir otra variedad o producto a la compra"
            >
              <Plus size={14} />
              <span>+ Agregar Producto</span>
            </button>
          </div>

          <div style={styles.tableWrapper} className="table-responsive">
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>PRODUCTO</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '110px' }}>CANT. RECIBIDA</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '100px' }}>PÉRDIDA</th>
                  <th style={{ ...styles.th, width: '140px' }}>MOTIVO PÉRDIDA</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '100px' }}>CANT. SANA</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '110px' }}>COSTO UNIT.</th>
                  <th style={{ ...styles.th, textAlign: 'right', width: '110px' }}>SUBTOTAL</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={row.id} style={styles.tr}>
                    {/* Selector de Producto */}
                    <td style={styles.td}>
                      <select
                        value={row.id_producto}
                        onChange={(e) => handleItemChange(idx, 'id_producto', e.target.value)}
                        style={styles.productSelect}
                      >
                        {productosCatalogo.map(p => (
                          <option key={p.id_producto} value={p.id_producto}>
                            [{p.codigo}] {p.nombre} ({p.unidad_medida})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Cantidad Recibida */}
                    <td style={styles.td}>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="99999"
                        value={row.cantidad_recibida}
                        onChange={(e) => handleItemChange(idx, 'cantidad_recibida', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={styles.numInput}
                        required
                      />
                    </td>

                    {/* Cantidad Perdida */}
                    <td style={styles.td}>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max={row.cantidad_recibida || 99999}
                        value={row.cantidad_perdida}
                        onChange={(e) => handleItemChange(idx, 'cantidad_perdida', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        style={{
                          ...styles.numInput,
                          color: parseFloat(row.cantidad_perdida) > 0 ? '#DC2626' : '#64748B',
                          fontWeight: parseFloat(row.cantidad_perdida) > 0 ? '700' : 'normal',
                        }}
                      />
                    </td>

                    {/* Motivo de Pérdida */}
                    <td style={styles.td}>
                      {parseFloat(row.cantidad_perdida) > 0 ? (
                        <select
                          value={row.motivo_perdida}
                          onChange={(e) => handleItemChange(idx, 'motivo_perdida', e.target.value)}
                          style={styles.motivoSelect}
                        >
                          <option value="Maltratados">Maltratados</option>
                          <option value="Rotos">Tallos Rotos</option>
                          <option value="Plaga">Plaga / Hongo</option>
                          <option value="Tallo corto">Tallo corto</option>
                          <option value="Deshidratado">Deshidratado</option>
                        </select>
                      ) : (
                        <span style={styles.noLossText}>Sin pérdidas</span>
                      )}
                    </td>

                    {/* Cantidad Sana (Ingreso a stock) */}
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={styles.cantSanaTag} className="num-mono">
                        {row.cantidad_sana}
                      </span>
                    </td>

                    {/* Costo Unitario */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.costoWrapper}>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="999999.99"
                          value={row.costo_unitario}
                          onChange={(e) => handleItemChange(idx, 'costo_unitario', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          style={styles.costoInput}
                          required
                        />
                        {parseFloat(row.cantidad_perdida) > 0 && parseFloat(row.cantidad_sana) > 0 && (
                          <span style={styles.realCostHint} title="Costo real por bonche sano absorbiendo mermas">
                            Real: ${row.costo_real_sano.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={styles.subtotalText} className="num-mono">
                        ${Number(row.subtotal).toFixed(2)}
                      </span>
                    </td>

                    {/* Eliminar fila */}
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        style={styles.btnDeleteRow}
                        title="Eliminar este producto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen Financiero y Guardado (Historia 6.4) */}
        <div style={styles.footerGrid} className="responsive-two-col">
          {/* Card explicativa de absorción y mermas */}
          <div style={styles.infoSummaryCard}>
            <div style={styles.infoSummaryHeader}>
              <Info size={16} color="#1E4E79" />
              <strong style={{ fontSize: '13px', color: '#1E4E79' }}>Control de Almacén y Stock</strong>
            </div>
            <ul style={styles.infoSummaryList}>
              <li>
                Solo los <strong>bonches sanos ({totalSano})</strong> ingresarán automáticamente al stock disponible.
              </li>
              <li>
                Las <strong>pérdidas registradas ({totalPerdido})</strong> se contabilizan como movimientos de <em>PERDIDA</em> para control de calidad.
              </li>
              <li>
                El costo promedio ponderado de cada producto se recalculará al confirmar la compra.
              </li>
            </ul>
          </div>

          {/* Liquidación de Compra */}
          <div style={styles.totalesCard}>
            <h4 style={styles.totalesTitle}>Resumen de la Compra</h4>

            <div style={styles.totalesRow}>
              <span style={styles.totalesLabel}>Total Recibido:</span>
              <strong className="num-mono" style={{ fontSize: '13px' }}>{totalRecibido} unidades</strong>
            </div>

            <div style={styles.totalesRow}>
              <span style={styles.totalesLabel}>Bonches Sanos (Entrada):</span>
              <span className="num-mono" style={{ color: '#059669', fontWeight: '700' }}>
                +{totalSano}
              </span>
            </div>

            {totalPerdido > 0 && (
              <div style={styles.totalesRow}>
                <span style={styles.totalesLabel}>Pérdidas / Mermas:</span>
                <span className="num-mono" style={{ color: '#DC2626', fontWeight: '700' }}>
                  -{totalPerdido}
                </span>
              </div>
            )}

            <div style={styles.totalesDivider}></div>

            <div style={styles.totalesRowTotal}>
              <span style={styles.totalGrandLabel}>Total de Compra:</span>
              <span style={styles.totalGrandVal} className="num-mono">
                ${totalCompra.toFixed(2)}
              </span>
            </div>

            <div style={styles.actionsRow}>
              <button
                type="button"
                onClick={onVolver}
                style={styles.btnCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={styles.btnSave}
                disabled={saving || items.length === 0}
              >
                <Save size={16} />
                <span>{saving ? 'Guardando Compra...' : 'Confirmar e Ingresar Compra'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#475569',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  secuenciaBadge: {
    backgroundColor: '#EEF2FF',
    border: '1px solid #C7D2FE',
    padding: '6px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  secuenciaLabel: {
    fontSize: '11px',
    color: '#4338CA',
    fontWeight: '600',
  },
  secuenciaNum: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#312E81',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #FECACA',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #A7F3D0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E293B',
  },
  cabeceraGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#E05A2B',
  },
  provTypePill: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  select: {
    padding: '8px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    padding: '8px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  estadoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
  },
  estadoBadge: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  estadoHint: {
    fontSize: '11px',
    color: '#64748B',
  },
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  btnAddRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  tableWrapper: {
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  trHead: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.02em',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '8px 12px',
    verticalAlign: 'middle',
  },
  productSelect: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  numInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    textAlign: 'center',
    outline: 'none',
  },
  motivoSelect: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '11px',
    borderRadius: '6px',
    border: '1px solid #FECACA',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    outline: 'none',
  },
  noLossText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cantSanaTag: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '4px 10px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  costoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  costoInput: {
    width: '90px',
    padding: '6px 8px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    textAlign: 'right',
    outline: 'none',
  },
  realCostHint: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#D97706',
  },
  subtotalText: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#1E293B',
  },
  btnDeleteRow: {
    background: 'none',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '16px',
  },
  infoSummaryCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoSummaryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoSummaryList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.6',
  },
  totalesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  totalesTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '4px',
  },
  totalesRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#475569',
  },
  totalesLabel: {
    color: '#64748B',
  },
  totalesDivider: {
    height: '1px',
    backgroundColor: '#E2E8F0',
    margin: '4px 0',
  },
  totalesRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  totalGrandLabel: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
  },
  totalGrandVal: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#E05A2B',
  },
  actionsRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '6px',
  },
  btnCancel: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSave: {
    flex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(224, 90, 43, 0.25)',
  },
};

