import { supabase } from '../lib/supabaseClient';

/**
 * Obtener listado de productos con relaciones, filtros y paginación
 */
export async function getProductos({
  search = '',
  categoriaId = 'ALL',
  stockFilter = 'ALL', // 'ALL', 'BAJO', 'NORMAL', 'AGOTADO'
  includeInactive = false,
  page = 1,
  pageSize = 10,
}) {
  try {
    let query = supabase
      .from('producto')
      .select('*, categoria(*)', { count: 'exact' });

    // Filtro de inactivos
    if (!includeInactive) {
      query = query.eq('activo', true);
    }

    // Filtro por categoría
    if (categoriaId !== 'ALL') {
      query = query.eq('id_categoria', parseInt(categoriaId, 10));
    }

    // Búsqueda por texto (código o nombre)
    if (search.trim()) {
      const term = search.trim();
      query = query.or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%`);
    }

    // Orden por ID
    query = query.order('id_producto', { ascending: true });

    const { data, count, error } = await query;
    if (error) throw error;

    let items = data || [];

    // Filtro en memoria por estado de stock para respetar el cálculo complejo stock_actual < stock_minimo
    if (stockFilter === 'BAJO') {
      items = items.filter(p => p.es_inventariable && Number(p.stock_actual) > 0 && Number(p.stock_actual) < Number(p.stock_minimo));
    } else if (stockFilter === 'AGOTADO') {
      items = items.filter(p => p.es_inventariable && Number(p.stock_actual) <= 0);
    } else if (stockFilter === 'NORMAL') {
      items = items.filter(p => !p.es_inventariable || Number(p.stock_actual) >= Number(p.stock_minimo));
    }

    // Paginación
    const totalFiltered = items.length;
    const from = (page - 1) * pageSize;
    const paginatedItems = items.slice(from, from + pageSize);

    return {
      productos: paginatedItems,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / pageSize) || 1,
      currentPage: page,
    };
  } catch (err) {
    console.error('Error in getProductos:', err);
    throw err;
  }
}

/**
 * Obtener categorías del sistema
 */
export async function getCategorias(onlyActive = true) {
  try {
    let query = supabase.from('categoria').select('*').order('id_categoria', { ascending: true });
    if (onlyActive) {
      query = query.eq('activo', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error in getCategorias:', err);
    return [];
  }
}

/**
 * Crear nueva categoría
 */
export async function createCategoria(catData, usuarioId = 1) {
  try {
    const payload = {
      nombre: catData.nombre.trim(),
      tipo: catData.tipo || 'PRODUCTO_VENTA',
      activo: true,
    };

    const { data, error } = await supabase
      .from('categoria')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'categoria',
        id_registro: data.id_categoria,
        accion: 'CREAR',
        id_usuario: usuarioId,
        detalle: `Categoría creada: ${data.nombre} (${data.tipo})`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in createCategoria:', err);
    return { success: false, error: err.message || 'Error al crear categoría' };
  }
}

/**
 * Actualizar categoría existente
 */
export async function updateCategoria(id, catData, usuarioId = 1) {
  try {
    const { data, error } = await supabase
      .from('categoria')
      .update({
        nombre: catData.nombre.trim(),
        tipo: catData.tipo,
      })
      .eq('id_categoria', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'categoria',
        id_registro: id,
        accion: 'MODIFICAR',
        id_usuario: usuarioId,
        detalle: `Categoría actualizada: ${data.nombre}`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in updateCategoria:', err);
    return { success: false, error: err.message || 'Error al actualizar categoría' };
  }
}

/**
 * Activar o desactivar categoría
 */
export async function toggleActivoCategoria(id, nuevoEstado, usuarioId = 1) {
  try {
    const { data, error } = await supabase
      .from('categoria')
      .update({ activo: nuevoEstado })
      .eq('id_categoria', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'categoria',
        id_registro: id,
        accion: nuevoEstado ? 'REACTIVAR' : 'ELIMINAR',
        id_usuario: usuarioId,
        detalle: `Categoría #${id} marcada como ${nuevoEstado ? 'activa' : 'inactiva'}`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in toggleActivoCategoria:', err);
    return { success: false, error: err.message || 'Error al actualizar estado de categoría' };
  }
}

/**
 * Crear un nuevo producto
 */
export async function createProducto(prodData, usuarioId = 1) {
  try {
    // Validar unicidad del código
    const { data: existing } = await supabase
      .from('producto')
      .select('id_producto')
      .eq('codigo', prodData.codigo.trim().toUpperCase())
      .maybeSingle();

    if (existing) {
      return { success: false, error: `El código "${prodData.codigo.trim().toUpperCase()}" ya se encuentra registrado.` };
    }

    const payload = {
      codigo: prodData.codigo.trim().toUpperCase(),
      nombre: prodData.nombre.trim(),
      id_categoria: parseInt(prodData.id_categoria, 10),
      unidad_medida: prodData.unidad_medida || 'BONCHE',
      precio_base: parseFloat(prodData.precio_base) || 0,
      costo_promedio: parseFloat(prodData.costo_promedio) || 0,
      stock_actual: parseFloat(prodData.stock_actual) || 0,
      stock_minimo: parseFloat(prodData.stock_minimo) || 0,
      es_inventariable: prodData.es_inventariable !== undefined ? prodData.es_inventariable : true,
      activo: true,
    };

    const { data, error } = await supabase
      .from('producto')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'producto',
        id_registro: data.id_producto,
        accion: 'CREAR',
        id_usuario: usuarioId,
        detalle: `Producto creado: [${data.codigo}] ${data.nombre}`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in createProducto:', err);
    return { success: false, error: err.message || 'Error al crear producto' };
  }
}

/**
 * Actualizar producto existente
 */
export async function updateProducto(id, prodData, usuarioId = 1) {
  try {
    // Validar unicidad del código si cambió
    const codigoUpper = prodData.codigo.trim().toUpperCase();
    const { data: existing } = await supabase
      .from('producto')
      .select('id_producto')
      .eq('codigo', codigoUpper)
      .neq('id_producto', id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `El código "${codigoUpper}" ya pertenece a otro producto.` };
    }

    const payload = {
      codigo: codigoUpper,
      nombre: prodData.nombre.trim(),
      id_categoria: parseInt(prodData.id_categoria, 10),
      unidad_medida: prodData.unidad_medida || 'BONCHE',
      precio_base: parseFloat(prodData.precio_base) || 0,
      costo_promedio: parseFloat(prodData.costo_promedio) || 0,
      stock_actual: parseFloat(prodData.stock_actual) || 0,
      stock_minimo: parseFloat(prodData.stock_minimo) || 0,
      es_inventariable: prodData.es_inventariable !== undefined ? prodData.es_inventariable : true,
    };

    const { data, error } = await supabase
      .from('producto')
      .update(payload)
      .eq('id_producto', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'producto',
        id_registro: id,
        accion: 'MODIFICAR',
        id_usuario: usuarioId,
        detalle: `Producto modificado: [${data.codigo}] ${data.nombre}`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in updateProducto:', err);
    return { success: false, error: err.message || 'Error al actualizar producto' };
  }
}

/**
 * Activar o desactivar producto (Soft delete)
 */
export async function toggleActivoProducto(id, nuevoEstado, usuarioId = 1) {
  try {
    const { data, error } = await supabase
      .from('producto')
      .update({ activo: nuevoEstado })
      .eq('id_producto', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'producto',
        id_registro: id,
        accion: nuevoEstado ? 'REACTIVAR' : 'ELIMINAR',
        id_usuario: usuarioId,
        detalle: `Producto [${data.codigo}] marcado como ${nuevoEstado ? 'activo' : 'inactivo'}`,
      }]);
    } catch {}

    return { success: true, data };
  } catch (err) {
    console.error('Error in toggleActivoProducto:', err);
    return { success: false, error: err.message || 'Error al cambiar estado' };
  }
}

/**
 * Obtener detalle completo de un producto con historial de ventas y compras
 */
export async function getProductoDetalle(id_producto) {
  try {
    // 1. Datos del producto con categoría
    const { data: prod, error: pErr } = await supabase
      .from('producto')
      .select('*, categoria(*)')
      .eq('id_producto', id_producto)
      .single();

    if (pErr) throw pErr;

    // 2. Historial de ventas en detalle_factura
    const { data: ventas, error: vErr } = await supabase
      .from('detalle_factura')
      .select('*, factura(*, cliente(*))')
      .eq('id_producto', id_producto)
      .order('id_detalle_factura', { ascending: false });

    // 3. Historial de compras en detalle_compra
    const { data: compras, error: cErr } = await supabase
      .from('detalle_compra')
      .select('*, compra(*, proveedor(*))')
      .eq('id_producto', id_producto)
      .order('id_detalle_compra', { ascending: false });

    return {
      producto: prod,
      ventas: ventas || [],
      compras: compras || [],
    };
  } catch (err) {
    console.error('Error in getProductoDetalle:', err);
    throw err;
  }
}

/**
 * Importar lote de productos desde array validado
 */
export async function importarProductosLote(productosArray, usuarioId = 1) {
  try {
    let importados = 0;
    const errores = [];

    // Obtener categorías existentes para mapear nombres
    const categorias = await getCategorias(false);
    const catMap = {};
    categorias.forEach(c => {
      catMap[c.nombre.toLowerCase()] = c.id_categoria;
    });

    for (const item of productosArray) {
      const codigo = (item.codigo || '').toString().trim().toUpperCase();
      const nombre = (item.nombre || '').toString().trim();
      const catNombre = (item.categoria || 'Bonches').toString().trim().toLowerCase();
      const id_categoria = catMap[catNombre] || 1;
      const unidad_medida = (item.unidad_medida || 'BONCHE').toString().trim().toUpperCase();
      const precio_base = parseFloat(item.precio_base) || 0;
      const stock_minimo = parseFloat(item.stock_minimo) || 0;
      const stock_actual = parseFloat(item.stock_actual) || 0;
      const costo_promedio = parseFloat(item.costo_promedio) || 0;

      if (!codigo || !nombre || precio_base <= 0) {
        errores.push(`Fila con código "${codigo || 'sin código'}": datos incompletos o precio inválido.`);
        continue;
      }

      // Check si existe
      const { data: existing } = await supabase
        .from('producto')
        .select('id_producto')
        .eq('codigo', codigo)
        .maybeSingle();

      if (existing) {
        // Actualizar
        const { error: upErr } = await supabase
          .from('producto')
          .update({
            nombre,
            id_categoria,
            unidad_medida,
            precio_base,
            stock_minimo,
            stock_actual,
            costo_promedio,
          })
          .eq('id_producto', existing.id_producto);

        if (upErr) {
          errores.push(`Error actualizando [${codigo}]: ${upErr.message}`);
        } else {
          importados++;
        }
      } else {
        // Insertar
        const { error: insErr } = await supabase
          .from('producto')
          .insert([{
            codigo,
            nombre,
            id_categoria,
            unidad_medida,
            precio_base,
            stock_minimo,
            stock_actual,
            costo_promedio,
            es_inventariable: true,
            activo: true,
          }]);

        if (insErr) {
          errores.push(`Error insertando [${codigo}]: ${insErr.message}`);
        } else {
          importados++;
        }
      }
    }

    try {
      await supabase.from('auditoria').insert([{
        tabla_afectada: 'producto',
        id_registro: 0,
        accion: 'CREAR',
        id_usuario: usuarioId,
        detalle: `Importación masiva: ${importados} productos procesados con ${errores.length} incidencias`,
      }]);
    } catch {}

    return { success: true, importados, errores };
  } catch (err) {
    console.error('Error in importarProductosLote:', err);
    return { success: false, error: err.message || 'Error en la importación' };
  }
}
