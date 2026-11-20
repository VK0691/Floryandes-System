import { supabase } from '../lib/supabaseClient';

/**
 * Proveedores predeterminados según especificación
 */
export const DEFAULT_PROVEEDORES = [
  { id_proveedor: 1, nombre: 'TESSA', tipo: 'Corporativa', telefono: '0991234567', activo: true },
  { id_proveedor: 2, nombre: 'ING. CAJAS', tipo: 'Finca', telefono: '0987654321', activo: true },
  { id_proveedor: 3, nombre: 'DON ALBERTO', tipo: 'Finca', telefono: '0978901234', activo: true },
  { id_proveedor: 4, nombre: 'EDU FLOR', tipo: 'Corporativa', telefono: '0965432109', activo: true },
  { id_proveedor: 5, nombre: 'DENIS', tipo: 'Finca', telefono: '0954321987', activo: true },
  { id_proveedor: 6, nombre: 'SRA. MIRIAM', tipo: 'Finca', telefono: '0943219876', activo: true },
];

/**
 * Obtener lista de proveedores (desde BD o fallback predeterminado)
 */
export async function getProveedores() {
  try {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return data;
    return DEFAULT_PROVEEDORES;
  } catch (err) {
    console.warn('Usando proveedores predeterminados por error:', err.message);
    return DEFAULT_PROVEEDORES;
  }
}

/**
 * Obtener el próximo número secuencial de compra
 */
export async function getProximoNumeroCompra() {
  try {
    const { data, error } = await supabase
      .from('compra')
      .select('numero_compra')
      .order('numero_compra', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0 && data[0].numero_compra) {
      return Number(data[0].numero_compra) + 1;
    }
    return 2001; // Número inicial secuencial para compras
  } catch (err) {
    console.warn('Fallback próximo número de compra:', err.message);
    return 2001;
  }
}

/**
 * Listar compras con filtros y paginación (Historia 6.5)
 */
export async function getCompras({
  search = '',
  id_proveedor = 'ALL',
  fechaDesde = '',
  fechaHasta = '',
  estado = 'ALL',
  page = 1,
  pageSize = 10,
}) {
  try {
    let query = supabase
      .from('compra')
      .select('*, proveedor(id_proveedor, nombre, tipo, telefono), usuario(id_usuario, nombre)', { count: 'exact' });

    if (estado !== 'ALL') {
      query = query.eq('estado', estado);
    }

    if (id_proveedor !== 'ALL') {
      query = query.eq('id_proveedor', parseInt(id_proveedor, 10));
    }

    if (fechaDesde) {
      query = query.gte('fecha_compra', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha_compra', fechaHasta);
    }

    query = query.order('numero_compra', { ascending: false });

    const { data, count: _count, error } = await query;
    if (error) throw error;

    let items = data || [];

    // Búsqueda en memoria por # compra o nombre de proveedor
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(c =>
        c.numero_compra.toString().includes(term) ||
        (c.proveedor?.nombre && c.proveedor.nombre.toLowerCase().includes(term)) ||
        (c.observaciones && c.observaciones.toLowerCase().includes(term))
      );
    }

    const totalFiltered = items.length;
    const from = (page - 1) * pageSize;
    const paginatedItems = items.slice(from, from + pageSize);

    return {
      compras: paginatedItems,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / pageSize) || 1,
      currentPage: page,
    };
  } catch (err) {
    console.error('Error in getCompras:', err);
    throw err;
  }
}

/**
 * Obtener detalle completo de una compra
 */
export async function getCompraDetalle(id_compra) {
  try {
    // 1. Cabecera
    const { data: compra, error: cErr } = await supabase
      .from('compra')
      .select('*, proveedor(*), usuario(nombre)')
      .eq('id_compra', id_compra)
      .single();

    if (cErr) throw cErr;

    // 2. Detalle de productos comprados
    const { data: detalles, error: dErr } = await supabase
      .from('detalle_compra')
      .select('*, producto(*)')
      .eq('id_compra', id_compra)
      .order('id_detalle_compra', { ascending: true });

    if (dErr) throw dErr;

    // 3. Movimientos de inventario asociados
    const { data: movimientos } = await supabase
      .from('movimiento_inventario')
      .select('*, producto(codigo, nombre)')
      .ilike('referencia', `%Compra #${compra.numero_compra}%`)
      .order('id_movimiento', { ascending: true });

    return {
      compra,
      detalles: detalles || [],
      movimientos: movimientos || [],
    };
  } catch (err) {
    console.error('Error in getCompraDetalle:', err);
    throw err;
  }
}

/**
 * Guardar nueva compra y actualizar inventario (Historias 6.1, 6.2, 6.3, 6.4)
 */
export async function crearCompra({
  numero_compra,
  id_proveedor,
  id_usuario = 1,
  fecha_compra,
  total_compra,
  total_pagado = 0,
  estado = 'PENDIENTE',
  observaciones = '',
  detalles = [],
}) {
  try {
    const totalCompraNum = parseFloat(total_compra) || 0;
    const totalPagadoNum = parseFloat(total_pagado) || 0;
    const saldoPendiente = Math.max(0, totalCompraNum - totalPagadoNum);

    // 1. Insertar Cabecera de Compra
    const compraPayload = {
      numero_compra: parseInt(numero_compra, 10),
      id_proveedor: parseInt(id_proveedor, 10),
      id_usuario: parseInt(id_usuario, 10) || 1,
      fecha_compra: fecha_compra || new Date().toISOString().split('T')[0],
      total_compra: totalCompraNum,
      total_pagado: totalPagadoNum,
      saldo_pendiente: saldoPendiente,
      estado: estado || (saldoPendiente <= 0 ? 'PAGADA' : 'PENDIENTE'),
      observaciones: observaciones ? observaciones.trim().slice(0, 500) : null,
    };

    const { data: nuevaCompra, error: cErr } = await supabase
      .from('compra')
      .insert([compraPayload])
      .select()
      .single();

    if (cErr) throw cErr;

    const compraId = nuevaCompra.id_compra;

    // 2. Insertar DetalleCompra para cada producto
    if (detalles.length > 0) {
      const itemsPayload = detalles.map(d => ({
        id_compra: compraId,
        id_producto: parseInt(d.id_producto, 10),
        cantidad_recibida: parseFloat(d.cantidad_recibida) || 0,
        cantidad_sana: parseFloat(d.cantidad_sana) || 0,
        cantidad_perdida: parseFloat(d.cantidad_perdida) || 0,
        motivo_perdida: d.cantidad_perdida > 0 ? (d.motivo_perdida || 'Maltratados').slice(0, 200) : null,
        costo_unitario: parseFloat(d.costo_unitario) || 0,
        subtotal: parseFloat(d.subtotal) || 0,
      }));

      const { error: dErr } = await supabase
        .from('detalle_compra')
        .insert(itemsPayload);

      if (dErr) throw dErr;

      // 3. Actualizar Stock y Costo Promedio en Producto + Registrar Movimientos
      for (const item of detalles) {
        const prodId = parseInt(item.id_producto, 10);
        const cantSana = parseFloat(item.cantidad_sana) || 0;
        const cantPerdida = parseFloat(item.cantidad_perdida) || 0;
        const costoUnit = parseFloat(item.costo_unitario) || 0;

        // Consultar producto actual
        const { data: prodData } = await supabase
          .from('producto')
          .select('stock_actual, costo_promedio, es_inventariable, nombre, codigo')
          .eq('id_producto', prodId)
          .single();

        if (prodData) {
          const stockAnterior = parseFloat(prodData.stock_actual) || 0;
          const costoAnterior = parseFloat(prodData.costo_promedio) || 0;

          // Costo real por bonche sano (absorbiendo pérdidas si las hubo)
          const costoRealBoncheSano = cantSana > 0
            ? ((parseFloat(item.cantidad_recibida) || cantSana) * costoUnit) / cantSana
            : costoUnit;

          // Nuevo stock
          const nuevoStock = stockAnterior + cantSana;

          // Recálculo de costo promedio ponderado
          let nuevoCostoPromedio = costoAnterior;
          if (nuevoStock > 0 && cantSana > 0) {
            nuevoCostoPromedio = ((stockAnterior * costoAnterior) + (cantSana * costoRealBoncheSano)) / nuevoStock;
            nuevoCostoPromedio = Math.round(nuevoCostoPromedio * 100) / 100;
          } else if (costoAnterior === 0) {
            nuevoCostoPromedio = costoUnit;
          }

          // Actualizar producto
          await supabase
            .from('producto')
            .update({
              stock_actual: nuevoStock,
              costo_promedio: nuevoCostoPromedio,
            })
            .eq('id_producto', prodId);

          // Registrar Movimiento de ENTRADA por la cantidad sana
          if (cantSana > 0) {
            await supabase
              .from('movimiento_inventario')
              .insert([{
                tipo_movimiento: 'ENTRADA',
                id_producto: prodId,
                cantidad: cantSana,
                costo_unitario: costoRealBoncheSano,
                referencia: `Compra #${numero_compra} - ${prodData.codigo}`,
                id_usuario: parseInt(id_usuario, 10) || 1,
              }]);
          }

          // Registrar Movimiento de PERDIDA si hubo mermas
          if (cantPerdida > 0) {
            await supabase
              .from('movimiento_inventario')
              .insert([{
                tipo_movimiento: 'PERDIDA',
                id_producto: prodId,
                cantidad: cantPerdida,
                costo_unitario: costoUnit,
                referencia: `Pérdida Compra #${numero_compra}: ${item.motivo_perdida || 'Merma'}`,
                id_usuario: parseInt(id_usuario, 10) || 1,
              }]);
          }
        }
      }
    }

    // 4. Registrar en Auditoría
    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'compra',
        id_registro: compraId,
        accion: 'CREAR',
        id_usuario: parseInt(id_usuario, 10) || 1,
        detalle: `Compra #${numero_compra} registrada a proveedor #${id_proveedor}. Total: $${totalCompraNum.toFixed(2)} (${detalles.length} productos)`,
      }]);
    } catch {}

    return { success: true, compra: nuevaCompra };
  } catch (err) {
    console.error('Error in crearCompra:', err);
    return { success: false, error: err.message || 'Error al guardar la compra' };
  }
}

