import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

/**
 * Obtener listado de inventario consolidado y métricas de stock
 * Historia 7.1
 */
export async function getStockInventario({ search = '', categoriaId = 'ALL', stockStatus = 'ALL' } = {}) {
  try {
    let query = supabase
      .from('producto')
      .select('*, categoria(id_categoria, nombre)')
      .eq('activo', true)
      .eq('es_inventariable', true)
      .order('nombre', { ascending: true });

    if (categoriaId !== 'ALL') {
      query = query.eq('id_categoria', parseInt(categoriaId, 10));
    }

    const { data, error } = await query;
    if (error) throw error;

    let items = data || [];

    // Filtro por búsqueda de texto
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(
        p =>
          (p.nombre && p.nombre.toLowerCase().includes(term)) ||
          (p.codigo && p.codigo.toLowerCase().includes(term)) ||
          (p.variedad && p.variedad.toLowerCase().includes(term))
      );
    }

    // Clasificación de estado de stock
    items = items.map(p => {
      const actual = parseFloat(p.stock_actual) || 0;
      const minimo = parseFloat(p.stock_minimo) || 0;
      let estado = 'NORMAL';
      if (actual <= 0) {
        estado = 'AGOTADO';
      } else if (actual < minimo) {
        estado = 'BAJO';
      }
      return {
        ...p,
        stock_actual_num: actual,
        stock_minimo_num: minimo,
        estado_stock: estado,
        porcentaje_stock: minimo > 0 ? Math.min(200, Math.round((actual / minimo) * 100)) : 100,
        valor_inventario: actual * (parseFloat(p.costo_promedio) || 0),
      };
    });

    // Filtro por estado de stock si aplica
    if (stockStatus !== 'ALL') {
      items = items.filter(p => p.estado_stock === stockStatus);
    }

    // Métricas globales
    const totalProductos = items.length;
    const totalUnidades = items.reduce((acc, p) => acc + p.stock_actual_num, 0);
    const valorTotal = items.reduce((acc, p) => acc + p.valor_inventario, 0);
    const bajoStockCount = items.filter(p => p.estado_stock === 'BAJO').length;
    const agotadosCount = items.filter(p => p.estado_stock === 'AGOTADO').length;
    const normalCount = items.filter(p => p.estado_stock === 'NORMAL').length;

    return {
      productos: items,
      metricas: {
        totalProductos,
        totalUnidades,
        valorTotal,
        bajoStockCount,
        agotadosCount,
        normalCount,
      },
    };
  } catch (err) {
    console.error('Error in getStockInventario:', err);
    throw err;
  }
}

/**
 * Obtener historial / Kardex de movimientos de inventario
 * Historia 7.2
 */
export async function getKardexMovimientos({
  id_producto = 'ALL',
  tipo = 'ALL',
  fechaDesde = '',
  fechaHasta = '',
  search = '',
  page = 1,
  pageSize = 20,
} = {}) {
  try {
    let query = supabase
      .from('movimiento_inventario')
      .select('*, producto(id_producto, codigo, nombre, unidad_medida, costo_promedio), usuario(id_usuario, nombre)', { count: 'exact' });

    if (id_producto !== 'ALL') {
      query = query.eq('id_producto', parseInt(id_producto, 10));
    }

    if (tipo !== 'ALL') {
      query = query.eq('tipo_movimiento', tipo);
    }

    if (fechaDesde) {
      query = query.gte('fecha', `${fechaDesde}T00:00:00.000Z`);
    }

    if (fechaHasta) {
      query = query.lte('fecha', `${fechaHasta}T23:59:59.999Z`);
    }

    query = query.order('fecha', { ascending: false }).order('id_movimiento', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    let items = data || [];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(
        m =>
          (m.referencia && m.referencia.toLowerCase().includes(term)) ||
          (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(term)) ||
          (m.producto?.codigo && m.producto.codigo.toLowerCase().includes(term))
      );
    }

    const totalFiltered = items.length;
    const from = (page - 1) * pageSize;
    const paginatedItems = items.slice(from, from + pageSize);

    return {
      movimientos: paginatedItems,
      allFilteredMovimientos: items,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / pageSize) || 1,
      currentPage: page,
    };
  } catch (err) {
    console.error('Error in getKardexMovimientos:', err);
    throw err;
  }
}

/**
 * Registrar ajuste manual de inventario (Exclusivo Administrador)
 * Historia 7.3
 */
export async function registrarAjusteInventario({
  id_producto,
  tipoAjuste = 'DIRECTO', // 'DIRECTO' (nuevo stock absoluto) o 'DELTA' (suma/resta)
  cantidad = 0,
  nuevoStock = 0,
  motivo = '',
  usuarioId = 1,
}) {
  try {
    if (!id_producto) throw new Error('Debe seleccionar un producto.');
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('Debe ingresar un motivo para el ajuste.');
    }

    // 1. Obtener producto actual
    const { data: prod, error: pErr } = await supabase
      .from('producto')
      .select('*')
      .eq('id_producto', parseInt(id_producto, 10))
      .single();

    if (pErr || !prod) {
      throw new Error('Producto no encontrado.');
    }

    const stockActual = parseFloat(prod.stock_actual) || 0;
    let stockFinal = 0;
    let diferencia = 0;

    if (tipoAjuste === 'DIRECTO') {
      stockFinal = parseFloat(nuevoStock);
      if (isNaN(stockFinal) || stockFinal < 0) {
        throw new Error('El nuevo stock debe ser un número mayor o igual a 0.');
      }
      diferencia = stockFinal - stockActual;
    } else {
      const delta = parseFloat(cantidad);
      if (isNaN(delta) || delta === 0) {
        throw new Error('La cantidad de ajuste debe ser diferente de 0.');
      }
      diferencia = delta;
      stockFinal = stockActual + delta;
      if (stockFinal < 0) {
        throw new Error(`El ajuste dejaría el stock en negativo (${stockFinal}). No permitido.`);
      }
    }

    // 2. Actualizar producto en base de datos
    const { error: uErr } = await supabase
      .from('producto')
      .update({ stock_actual: stockFinal })
      .eq('id_producto', prod.id_producto);

    if (uErr) throw uErr;

    // 3. Insertar movimiento de inventario tipo 'AJUSTE'
    const signText = diferencia >= 0 ? `+${diferencia}` : `${diferencia}`;
    const referenciaCompleta = `Ajuste manual: ${motivo.trim().slice(0, 180)} (Stock: ${stockActual} a ${stockFinal}, cambio: ${signText})`;

    const movimientoPayload = {
      fecha: new Date().toISOString(),
      tipo_movimiento: 'AJUSTE',
      id_producto: prod.id_producto,
      cantidad: Math.abs(diferencia),
      costo_unitario: prod.costo_promedio || 0,
      referencia: referenciaCompleta,
      id_usuario: parseInt(usuarioId, 10) || 1,
    };

    const { error: mErr } = await supabase
      .from('movimiento_inventario')
      .insert([movimientoPayload]);

    if (mErr) console.warn('Aviso: Movimiento de ajuste no registrado en BD:', mErr.message);

    // 4. Registro en Auditoría
    try {
      await supabase.from('auditoria').insert([{
        id_usuario: parseInt(usuarioId, 10) || 1,
        accion: 'AJUSTE_INVENTARIO',
        tabla_afectada: 'producto',
        id_registro: prod.id_producto,
        valores_anteriores: { stock_actual: stockActual },
        valores_nuevos: {
          stock_actual: stockFinal,
          diferencia,
          motivo: motivo.trim(),
        },
      }]);
    } catch (aErr) {
      console.warn('Aviso: Auditoría no registrada:', aErr.message);
    }

    return {
      success: true,
      producto: prod.nombre,
      stockAnterior: stockActual,
      stockNuevo: stockFinal,
      diferencia,
    };
  } catch (err) {
    console.error('Error in registrarAjusteInventario:', err);
    throw err;
  }
}

/**
 * Obtener productos con stock por debajo del mínimo para alertas
 * Historia 7.4
 */
export async function getProductosStockBajo() {
  try {
    const { data, error } = await supabase
      .from('producto')
      .select('id_producto, codigo, nombre, variedad, stock_actual, stock_minimo, unidad_medida, costo_promedio')
      .eq('activo', true)
      .eq('es_inventariable', true);

    if (error) throw error;

    const items = (data || [])
      .map(p => {
        const actual = parseFloat(p.stock_actual) || 0;
        const minimo = parseFloat(p.stock_minimo) || 0;
        return {
          ...p,
          stock_actual: actual,
          stock_minimo: minimo,
          deficit: Math.max(0, minimo - actual),
        };
      })
      .filter(p => p.stock_actual < p.stock_minimo)
      .sort((a, b) => b.deficit - a.deficit);

    return items;
  } catch (err) {
    console.error('Error in getProductosStockBajo:', err);
    return [];
  }
}

/**
 * Exportar Kardex a formato Excel (.xlsx) usando XLSX
 * Historia 7.2
 */
export function exportarKardexAExcel(movimientos = [], nombreArchivo = 'Kardex_Inventario_Floryandes') {
  try {
    const dataFormatted = movimientos.map((m, index) => {
      const fecha = m.fecha ? new Date(m.fecha).toLocaleString('es-EC') : '-';
      return {
        '#': index + 1,
        'Fecha y Hora': fecha,
        'Tipo de Movimiento': m.tipo_movimiento || 'N/A',
        'Código Producto': m.producto?.codigo || '-',
        'Producto': m.producto?.nombre || 'Producto no identificado',
        'Unidad': m.producto?.unidad_medida || 'Bonche',
        'Cantidad': parseFloat(m.cantidad || 0),
        'Costo Unitario ($)': parseFloat(m.costo_unitario || 0).toFixed(2),
        'Referencia / Observación': m.referencia || '-',
        'Usuario Responsable': m.usuario?.nombre || 'Sistema',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataFormatted);

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 45 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex Movimientos');

    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${nombreArchivo}_${todayStr}.xlsx`);
    return true;
  } catch (err) {
    console.error('Error exportando Kardex a Excel:', err);
    throw new Error('No se pudo generar el archivo Excel.');
  }
}

