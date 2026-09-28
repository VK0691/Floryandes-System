import { supabase } from '../lib/supabaseClient';

/**
 * Obtener listado de clientes con filtros y paginación
 */
export async function getClientes({
  search = '',
  tipo = 'ALL',
  saldoFilter = 'ALL', // 'ALL', 'DEUDA', 'SIN_DEUDA'
  includeInactive = false,
  page = 1,
  pageSize = 10,
}) {
  try {
    let query = supabase
      .from('cliente')
      .select('*', { count: 'exact' });

    // Filtro de activos / inactivos
    if (!includeInactive) {
      query = query.eq('activo', true);
    }

    // Filtro de tipo de cliente
    if (tipo !== 'ALL') {
      query = query.eq('tipo_cliente', tipo);
    }

    // Filtro de saldo
    if (saldoFilter === 'DEUDA') {
      query = query.gt('saldo_actual', 0);
    } else if (saldoFilter === 'SIN_DEUDA') {
      query = query.lte('saldo_actual', 0);
    }

    // Búsqueda por texto (nombre, ruc, teléfono)
    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre.ilike.%${term}%,ruc.ilike.%${term}%,telefono.ilike.%${term}%`);
    }

    // Paginación y orden
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('id_cliente', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      clientes: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
    };
  } catch (err) {
    console.error('Error in getClientes:', err);
    throw err;
  }
}

/**
 * Crear un nuevo cliente y registrar en auditoría
 */
export async function createCliente(clienteData, usuarioId = 1) {
  try {
    const payload = {
      nombre: clienteData.nombre.trim(),
      ruc: clienteData.ruc?.trim() || null,
      telefono: clienteData.telefono?.trim() || null,
      direccion: clienteData.direccion?.trim() || null,
      correo: clienteData.correo?.trim() || null,
      tipo_cliente: clienteData.tipo_cliente || 'MINORISTA',
      saldo_actual: parseFloat(clienteData.saldo_actual) || 0.00,
      activo: true,
    };

    const { data, error } = await supabase
      .from('cliente')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Registrar en auditoría
    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'cliente',
        id_registro: data.id_cliente,
        accion: 'CREAR',
        id_usuario: usuarioId,
        detalle: `Cliente creado: ${data.nombre} (${data.tipo_cliente})`,
      }]);
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in createCliente:', err);
    return { success: false, error: err.message || 'Error al crear cliente' };
  }
}

/**
 * Modificar cliente existente y registrar en auditoría
 */
export async function updateCliente(id, clienteData, usuarioId = 1) {
  try {
    const payload = {
      nombre: clienteData.nombre.trim(),
      ruc: clienteData.ruc?.trim() || null,
      telefono: clienteData.telefono?.trim() || null,
      direccion: clienteData.direccion?.trim() || null,
      correo: clienteData.correo?.trim() || null,
      tipo_cliente: clienteData.tipo_cliente || 'MINORISTA',
    };

    const { data, error } = await supabase
      .from('cliente')
      .update(payload)
      .eq('id_cliente', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en auditoría
    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'cliente',
        id_registro: id,
        accion: 'MODIFICAR',
        id_usuario: usuarioId,
        detalle: `Cliente actualizado: ${data.nombre}`,
      }]);
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in updateCliente:', err);
    return { success: false, error: err.message || 'Error al actualizar cliente' };
  }
}

/**
 * Desactivar o reactivar cliente (Soft delete) y registrar en auditoría
 */
export async function toggleActivoCliente(id, nuevoEstado, usuarioId = 1) {
  try {
    const { data, error } = await supabase
      .from('cliente')
      .update({ activo: nuevoEstado })
      .eq('id_cliente', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en auditoría
    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'cliente',
        id_registro: id,
        accion: nuevoEstado ? 'REACTIVAR' : 'ELIMINAR',
        id_usuario: usuarioId,
        detalle: `Cliente ${data.nombre} marcado como ${nuevoEstado ? 'activo' : 'inactivo'}`,
      }]);
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error in toggleActivoCliente:', err);
    return { success: false, error: err.message || 'Error al cambiar estado' };
  }
}

/**
 * Obtener detalle completo de un cliente con su historial de facturas y pagos
 */
export async function getClienteDetalle(id_cliente) {
  try {
    // 1. Datos del cliente
    const { data: cliente, error: cErr } = await supabase
      .from('cliente')
      .select('*')
      .eq('id_cliente', id_cliente)
      .single();

    if (cErr) throw cErr;

    // 2. Facturas del cliente
    const { data: facturas, error: fErr } = await supabase
      .from('factura')
      .select('*')
      .eq('id_cliente', id_cliente)
      .order('fecha_emision', { ascending: false });

    // 3. Pagos asociados a las facturas del cliente
    let pagos = [];
    if (facturas && facturas.length > 0) {
      const facturaIds = facturas.map(f => f.id_factura);
      const { data: pData } = await supabase
        .from('pago')
        .select('*')
        .in('id_factura', facturaIds)
        .order('fecha_pago', { ascending: false });

      if (pData) pagos = pData;
    }

    return {
      cliente,
      facturas: facturas || [],
      pagos: pagos || [],
    };
  } catch (err) {
    console.error('Error in getClienteDetalle:', err);
    throw err;
  }
}

/**
 * Registrar un pago / abono y actualizar saldo automáticamente
 */
export async function registrarAbono({
  id_cliente,
  id_factura,
  monto,
  metodo_pago = 'EFECTIVO',
  referencia = '',
  id_usuario = 1,
}) {
  try {
    const abonoMonto = parseFloat(monto);
    if (!abonoMonto || abonoMonto <= 0) {
      return { success: false, error: 'El monto del abono debe ser mayor a cero' };
    }

    // 1. Insertar registro de pago
    const { data: pago, error: pErr } = await supabase
      .from('pago')
      .insert([{
        id_factura: id_factura || null,
        fecha_pago: new Date().toISOString().split('T')[0],
        monto: abonoMonto,
        metodo_pago,
        referencia: referencia.trim() || 'Abono a cuenta',
        id_usuario,
      }])
      .select()
      .single();

    if (pErr) throw pErr;

    // 2. Si hay factura asociada, actualizar estado y saldo de la factura
    if (id_factura) {
      const { data: fData } = await supabase
        .from('factura')
        .select('total_factura, total_abonado')
        .eq('id_factura', id_factura)
        .single();

      if (fData) {
        const nuevoTotalAbonado = Number(fData.total_abonado || 0) + abonoMonto;
        const nuevoSaldoPendiente = Math.max(0, Number(fData.total_factura || 0) - nuevoTotalAbonado);
        const nuevoEstado = nuevoSaldoPendiente <= 0 ? 'PAGADA' : 'PENDIENTE';

        await supabase
          .from('factura')
          .update({
            total_abonado: nuevoTotalAbonado,
            saldo_pendiente: nuevoSaldoPendiente,
            estado: nuevoEstado,
          })
          .eq('id_factura', id_factura);
      }
    }

    // 3. Actualizar automáticamente saldo_actual del cliente
    const { data: cData } = await supabase
      .from('cliente')
      .select('saldo_actual')
      .eq('id_cliente', id_cliente)
      .single();

    const saldoAnterior = Number(cData?.saldo_actual || 0);
    const nuevoSaldo = Math.max(0, saldoAnterior - abonoMonto);

    await supabase
      .from('cliente')
      .update({ saldo_actual: nuevoSaldo })
      .eq('id_cliente', id_cliente);

    // 4. Auditoría
    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'pago',
        id_registro: pago.id_pago,
        accion: 'CREAR',
        id_usuario,
        detalle: `Abono de $${abonoMonto.toFixed(2)} registrado para cliente #${id_cliente} (${metodo_pago})`,
      }]);
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return { success: true, pago, nuevoSaldo };
  } catch (err) {
    console.error('Error in registrarAbono:', err);
    return { success: false, error: err.message || 'Error al registrar abono' };
  }
}
