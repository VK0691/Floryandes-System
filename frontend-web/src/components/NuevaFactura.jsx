import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getProximoNumeroFactura, crearFactura } from '../services/facturasService';
import { useAuth } from '../context/AuthContext';

export default function NuevaFactura({ preselectedClient = null, onFacturaCreada, onCancel }) {
  const { currentUser } = useAuth();

  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  // Clients & Products data from Supabase
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Helper to remove awkward leading zeros (e.g. '055' -> '55') and allow clean backspace to empty
  const sanitizeNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    let str = String(value);
    if (str.length > 1 && str.startsWith('0') && str[1] !== '.') {
      str = str.replace(/^0+/, '') || '0';
    }
    return str;
  };

  // Line items
  const [items, setItems] = useState([
    {
      id: 1,
      id_producto: '',
      nombre: '',
      codigo: '',
      cantidad: 1,
      precio_unitario: '',
      costo_unitario: 0,
      es_inventariable: true,
      subtotal: 0,
    }
  ]);

  // Financial arithmetic
  const [abono, setAbono] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  // UI status
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Load correlative, active clients and active products
  useEffect(() => {
    async function init() {
      setLoadingInit(true);
      try {
        const nextNum = await getProximoNumeroFactura();
        setNumeroFactura(nextNum);

        const [cRes, pRes] = await Promise.all([
          supabase.from('cliente').select('*').eq('activo', true).order('nombre', { ascending: true }),
          supabase.from('producto').select('*').eq('activo', true).order('nombre', { ascending: true }),
        ]);

        const clientList = cRes.data || [];
        const prodList = pRes.data || [];

        setClientes(clientList);
        setProductos(prodList);

        // Preselect client if passed
        if (preselectedClient) {
          const match = clientList.find(c => c.id_cliente === preselectedClient.id_cliente);
          if (match) setSelectedClient(match);
        } else if (clientList.length > 0) {
          setSelectedClient(clientList[0]);
        }

        // Initialize first row with first product if available
        if (prodList.length > 0) {
          const firstP = prodList[0];
          setItems([
            {
              id: Date.now(),
              id_producto: firstP.id_producto,
              nombre: firstP.nombre,
              codigo: firstP.codigo,
              cantidad: 10,
              precio_unitario: Number(firstP.precio_base) || 0,
              costo_unitario: Number(firstP.costo_promedio) || 0,
              es_inventariable: firstP.es_inventariable,
              subtotal: 10 * (Number(firstP.precio_base) || 0),
            }
          ]);
        }
      } catch (err) {
        console.error('Error initializing NuevaFactura:', err);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, [preselectedClient]);

  // Update selected client
  const handleClientChange = (clientId) => {
    const found = clientes.find(c => c.id_cliente === parseInt(clientId, 10));
    setSelectedClient(found || null);
  };

  // Add line item
  const handleAddItem = () => {
    if (productos.length === 0) return;
    const defaultProd = productos[0];
    setItems([
      ...items,
      {
        id: Date.now() + Math.random(),
        id_producto: defaultProd.id_producto,
        nombre: defaultProd.nombre,
        codigo: defaultProd.codigo,
        cantidad: 1,
        precio_unitario: defaultProd.precio_base !== undefined ? String(defaultProd.precio_base) : '0',
        costo_unitario: Number(defaultProd.costo_promedio) || 0,
        es_inventariable: defaultProd.es_inventariable,
        subtotal: Number(defaultProd.precio_base) || 0,
      }
    ]);
  };

  // Remove line item
  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      alert('La factura debe tener al menos un producto.');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  // Update line item product
  const handleProductSelect = (index, prodId) => {
    const prod = productos.find(p => p.id_producto === parseInt(prodId, 10));
    if (!prod) return;

    const newItems = [...items];
    const item = newItems[index];
    item.id_producto = prod.id_producto;
    item.nombre = prod.nombre;
    item.codigo = prod.codigo;
    item.precio_unitario = prod.precio_base !== undefined ? String(prod.precio_base) : '0';
    item.costo_unitario = Number(prod.costo_promedio) || 0;
    item.es_inventariable = prod.es_inventariable;
    const q = parseFloat(item.cantidad) || 0;
    const p = parseFloat(item.precio_unitario) || 0;
    item.subtotal = q * p;

    setItems(newItems);
  };

  // Update line item quantity or price
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];

    const cleanVal = sanitizeNumberInput(value);

    if (field === 'cantidad') {
      // Quantities must be whole integers only
      const integerClean = cleanVal === '' ? '' : cleanVal.replace(/[^0-9]/g, '');
      item.cantidad = integerClean;
      const q = parseInt(integerClean, 10) || 0;
      const p = parseFloat(item.precio_unitario) || 0;
      item.subtotal = q * p;
    } else if (field === 'precio_unitario') {
      item.precio_unitario = cleanVal;
      const q = parseInt(item.cantidad, 10) || 0;
      const p = parseFloat(cleanVal) || 0;
      item.subtotal = q * p;
    }

    setItems(newItems);
  };

  // Arithmetic calculations
  const subtotalFactura = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const saldoAnterior = selectedClient ? Number(selectedClient.saldo_actual || 0) : 0;
  const totalAPagar = subtotalFactura + saldoAnterior;

  const abonoNum = parseFloat(abono) || 0;
  const saldoPendiente = Math.max(0, totalAPagar - abonoNum);

  const utilidadEstimada = items.reduce(
    (acc, it) => acc + ((parseInt(it.cantidad, 10) || 0) * ((parseFloat(it.precio_unitario) || 0) - (Number(it.costo_unitario) || 0))),
    0
  );

  // Validate before submit
  const validate = () => {
    const errs = {};
    if (!selectedClient) {
      errs.cliente = 'Debe seleccionar un cliente.';
    }
    if (items.length === 0) {
      errs.items = 'Debe incluir al menos un producto.';
    }
    const hasInvalidQty = items.some(it => {
      if (!it.cantidad) return true;
      const q = Number(it.cantidad);
      return isNaN(q) || !Number.isInteger(q) || q <= 0;
    });
    if (hasInvalidQty) {
      errs.items = 'Las cantidades deben ser números enteros mayores a cero.';
    }
    const hasInvalidPrice = items.some(it => it.precio_unitario === '' || parseFloat(it.precio_unitario) < 0);
    if (hasInvalidPrice) {
      errs.items = 'Los precios unitarios no pueden ser negativos.';
    }
    if (abonoNum < 0) {
      errs.abono = 'El abono no puede ser negativo.';
    }
    if (abonoNum > totalAPagar && totalAPagar > 0) {
      errs.abono = 'El abono no puede ser superior al total a pagar.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Save
  const handleGuardarFactura = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await crearFactura({
        numero_factura: numeroFactura,
        id_cliente: selectedClient.id_cliente,
        id_usuario: currentUser?.id ? 1 : 1,
        fecha_emision: fechaEmision,
        saldo_anterior: saldoAnterior,
        total_factura: subtotalFactura,
        total_abonado: abonoNum,
        saldo_pendiente: saldoPendiente,
        estado: saldoPendiente <= 0 ? 'PAGADA' : 'PENDIENTE',
        observaciones: observaciones,
        detalles: items.map(it => ({
          ...it,
          cantidad: parseInt(it.cantidad, 10) || 0,
          precio_unitario: parseFloat(it.precio_unitario) || 0,
          subtotal: (parseInt(it.cantidad, 10) || 0) * (parseFloat(it.precio_unitario) || 0),
        })),
        metodo_pago: metodoPago,
      });

      if (res.success) {
        setSuccessMsg(`Factura #${numeroFactura} registrada exitosamente.`);
        if (onFacturaCreada) {
          setTimeout(() => {
            onFacturaCreada(res.factura);
          }, 1200);
        }
      } else {
        setValidationErrors({ form: res.error || 'Error al guardar factura' });
      }
    } catch (err) {
      setValidationErrors({ form: err.message || 'Error inesperado al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <span>Cargando formulario de facturación...</span>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.title}>Nueva Factura</h2>
          <p style={styles.subtitle}>
            Emisión de venta con cálculo automático de saldos y descuento de almacén
          </p>
        </div>
        <div style={styles.headerPills}>
          <span style={styles.facturaTag} className="num-mono">
            # FACT. {numeroFactura}
          </span>
          <div style={styles.datePickerWrap}>
            <Calendar size={14} color="#64748B" />
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              style={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div style={styles.successBanner}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Global Form Errors */}
      {validationErrors.form && (
        <div style={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{validationErrors.form}</span>
        </div>
      )}

      <form onSubmit={handleGuardarFactura}>
        <div style={styles.mainGrid} className="responsive-two-col">
          {/* Left Column: Form & Table */}
          <div style={styles.leftCard}>
            {/* Client Selection Row */}
            <div style={styles.clientSelectRow}>
              <div style={styles.clientSelectField}>
                <label style={styles.fieldLabel}>Cliente</label>
                <select
                  value={selectedClient?.id_cliente || ''}
                  onChange={(e) => handleClientChange(e.target.value)}
                  style={styles.clientSelect}
                >
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} {c.ruc ? `(${c.ruc})` : ''}
                    </option>
                  ))}
                </select>
                {validationErrors.cliente && (
                  <span style={styles.errorText}>{validationErrors.cliente}</span>
                )}
              </div>

              {/* Client Balance Badge */}
              <div style={styles.clientMetaBadge}>
                <div style={styles.clientMetaRow}>
                  <span style={styles.clientMetaLabel}>Saldo Anterior:</span>
                  <span
                    className="num-mono"
                    style={{
                      ...styles.clientMetaVal,
                      color: saldoAnterior > 0 ? '#DC2626' : '#059669',
                    }}
                  >
                    ${saldoAnterior.toFixed(2)}
                  </span>
                </div>
                <div style={styles.clientMetaRow}>
                  <span style={styles.clientMetaLabel}>Tipo:</span>
                  <span style={styles.clientMetaSub}>
                    {selectedClient?.tipo_cliente || 'Minorista'}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div style={styles.tableCard}>
              <div style={styles.tableHeaderBar}>
                <span style={styles.tableHeaderTitle}>Detalle de Productos</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={styles.addItemBtn}
                >
                  <Plus size={14} />
                  <span>Agregar Producto</span>
                </button>
              </div>

              <div style={styles.tableWrapper} className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={{ ...styles.th, width: '90px' }}>CANTIDAD</th>
                      <th style={styles.th}>PRODUCTO</th>
                      <th style={{ ...styles.th, width: '110px', textAlign: 'right' }}>PRECIO U.</th>
                      <th style={{ ...styles.th, width: '90px', textAlign: 'right' }}>COSTO U.</th>
                      <th style={{ ...styles.th, width: '110px', textAlign: 'right' }}>SUBTOTAL</th>
                      <th style={{ ...styles.th, width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={row.id} style={styles.tr}>
                        <td style={styles.td}>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="99999"
                            value={row.cantidad}
                            placeholder="1"
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (parseInt(val, 10) > 99999) val = '99999';
                              handleItemChange(idx, 'cantidad', val);
                            }}
                            onFocus={(e) => e.target.select()}
                            style={styles.qtyInput}
                          />
                        </td>
                        <td style={styles.td}>
                          <select
                            value={row.id_producto}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            style={styles.productSelect}
                          >
                            {productos.map(p => (
                              <option key={p.id_producto} value={p.id_producto}>
                                [{p.codigo}] {p.nombre} {p.es_inventariable ? `(Stock: ${p.stock_actual})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="999999.99"
                            value={row.precio_unitario}
                            placeholder="0.00"
                            onChange={(e) => {
                              let val = e.target.value;
                              if (parseFloat(val) > 999999.99) val = '999999.99';
                              handleItemChange(idx, 'precio_unitario', val);
                            }}
                            onFocus={(e) => e.target.select()}
                            style={styles.priceInput}
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <span style={styles.costText} className="num-mono">
                            ${Number(row.costo_unitario || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <span style={styles.subtotalText} className="num-mono">
                            ${(row.subtotal || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(row.id)}
                            style={styles.deleteRowBtn}
                            title="Eliminar fila"
                          >
                            <Trash2 size={15} color="#DC2626" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validationErrors.items && (
                <div style={styles.errorTextRow}>
                  <AlertCircle size={14} />
                  <span>{validationErrors.items}</span>
                </div>
              )}
            </div>

            {/* Observations */}
            <div style={styles.obsField}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.fieldLabel}>Observaciones (opcional)</label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{observaciones.length}/300</span>
              </div>
              <input
                type="text"
                maxLength={300}
                placeholder="Ej: Entrega en finca, bonches para boda, pago diferido"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value.slice(0, 300))}
                style={styles.obsInput}
              />
            </div>
          </div>

          {/* Right Column: Financial Summary & Payment Box */}
          <div style={styles.rightCard}>
            <h3 style={styles.summaryTitle}>Liquidación de Factura</h3>

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Subtotal Venta:</span>
                <span style={styles.summaryVal} className="num-mono">
                  ${subtotalFactura.toFixed(2)}
                </span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Saldo Anterior:</span>
                <span
                  className="num-mono"
                  style={{
                    ...styles.summaryVal,
                    color: saldoAnterior > 0 ? '#DC2626' : '#0F172A',
                  }}
                >
                  ${saldoAnterior.toFixed(2)}
                </span>
              </div>

              <div style={styles.summaryDivider}></div>

              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total a Pagar:</span>
                <span style={styles.totalVal} className="num-mono">
                  ${totalAPagar.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Abono / Payment Section */}
            <div style={styles.paymentBox}>
              <div style={styles.paymentField}>
                <label style={styles.fieldLabel}>Abono en este momento ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAPagar}
                  value={abono}
                  placeholder="0.00"
                  onChange={(e) => setAbono(sanitizeNumberInput(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  style={{
                    ...styles.abonoInput,
                    borderColor: validationErrors.abono ? '#EF4444' : '#CBD5E1',
                  }}
                />
                {validationErrors.abono && (
                  <span style={styles.errorText}>{validationErrors.abono}</span>
                )}
              </div>

              <div style={styles.paymentField}>
                <label style={styles.fieldLabel}>Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  style={styles.paymentSelect}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div style={styles.pendingCard}>
                <span style={styles.pendingLabel}>Saldo Pendiente:</span>
                <span
                  className="num-mono"
                  style={{
                    ...styles.pendingVal,
                    color: saldoPendiente > 0 ? '#E05A2B' : '#059669',
                  }}
                >
                  ${saldoPendiente.toFixed(2)}
                </span>
                <span style={styles.pendingStateSub}>
                  {saldoPendiente <= 0 ? 'Estado: PAGADA' : 'Estado: PENDIENTE'}
                </span>
              </div>
            </div>

            {/* Estimated Profit Indicator */}
            <div style={styles.profitCard}>
              <div style={styles.profitHeader}>
                <TrendingUp size={15} color="#059669" />
                <span style={styles.profitTitle}>Utilidad Estimada de la Venta</span>
              </div>
              <span style={styles.profitVal} className="num-mono">
                +${Math.max(0, utilidadEstimada).toFixed(2)}
              </span>
            </div>

            {/* Form Actions */}
            <div style={styles.actionBtns}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <Save size={16} />
                <span>{saving ? 'Guardando Venta...' : 'Guardar Factura'}</span>
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  style={styles.cancelBtn}
                >
                  Volver al Listado
                </button>
              )}
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
    gap: '20px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
  },
  headerPills: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  facturaTag: {
    backgroundColor: '#EFF6FF',
    color: '#1E4E79',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '800',
  },
  datePickerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#1E293B',
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '20px',
    alignItems: 'start',
  },
  leftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  clientSelectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  clientSelectField: {
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  clientSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  clientMetaBadge: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
  },
  clientMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  clientMetaLabel: {
    color: '#64748B',
  },
  clientMetaVal: {
    fontWeight: '700',
  },
  clientMetaSub: {
    fontWeight: '600',
    color: '#1E293B',
  },
  tableCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    backgroundColor: '#F8FAFC',
    padding: '12px 16px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableHeaderTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
  },
  addItemBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1E4E79',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
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
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  },
  th: {
    padding: '10px 14px',
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
    padding: '10px 14px',
    fontSize: '13px',
    color: '#334155',
  },
  qtyInput: {
    width: '100%',
    padding: '7px 8px',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
  },
  productSelect: {
    width: '100%',
    padding: '7px 10px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  priceInput: {
    width: '100%',
    padding: '7px 8px',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    textAlign: 'right',
    fontFamily: 'var(--font-mono)',
  },
  costText: {
    color: '#64748B',
    fontSize: '12px',
  },
  subtotalText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: '13px',
  },
  deleteRowBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTextRow: {
    padding: '8px 14px',
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  obsField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  obsInput: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    outline: 'none',
  },
  rightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    position: 'sticky',
    top: '90px',
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
  },
  summaryLabel: {
    color: '#64748B',
  },
  summaryVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: '#E2E8F0',
    margin: '4px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1E4E79',
  },
  paymentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  paymentField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  abonoInput: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '15px',
    fontWeight: '700',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
  },
  paymentSelect: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  pendingCard: {
    backgroundColor: '#FFF7ED',
    border: '1px solid #FFEDD5',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pendingLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#C2410C',
    textTransform: 'uppercase',
  },
  pendingVal: {
    fontSize: '22px',
    fontWeight: '800',
  },
  pendingStateSub: {
    fontSize: '11px',
    color: '#9A3412',
    fontWeight: '600',
    marginTop: '2px',
  },
  profitCard: {
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#065F46',
  },
  profitTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#065F46',
  },
  profitVal: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#059669',
  },
  actionBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#E05A2B',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(224, 90, 43, 0.25)',
  },
  cancelBtn: {
    padding: '9px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '11px',
    color: '#EF4444',
  },
  loadingBox: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748B',
    fontSize: '14px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#E05A2B',
    animation: 'spin 0.8s linear infinite',
  }
};
