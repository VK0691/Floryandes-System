import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://etfeopoiguuwijjdeiwo.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  throw new Error('Configura SUPABASE_SERVICE_ROLE_KEY antes de ejecutar la importacion.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const files = [
  process.env.VENTAS_2025 ||
    'C:\\Users\\wilso\\Documents\\FLORYANDES SISTEMA\\datos\\resumenes2025-2026\\ventas_rosas_2025_bd.xlsx',
  process.env.VENTAS_2026 ||
    'C:\\Users\\wilso\\Documents\\FLORYANDES SISTEMA\\datos\\resumenes2025-2026\\ventas_rosas_2026_bd.xlsx',
];

const productVariants = [
  ['BON-ROJ', 'Bonche de Rosas Rojas'],
  ['BON-COL', 'Bonche de Colores'],
  ['BON-BLA', 'Bonche de Rosas Blancas'],
  ['BON-PINT', 'Rosas Pintadas'],
  ['BON-AMA', 'Rosas Amarillas'],
];

function decimal(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function integer(value) {
  const number = Number.parseInt(String(value), 10);
  return Number.isFinite(number) ? number : null;
}

function normalizeDate(value, fallbackYear, fallbackMonth) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  const month = integer(fallbackMonth);
  return `${fallbackYear}-${String(month && month > 0 ? month : 1).padStart(2, '0')}-01`;
}

async function ensureCategoryAndProducts() {
  let { data: category, error } = await supabase
    .from('categoria')
    .select('id_categoria')
    .ilike('nombre', 'Bonches')
    .maybeSingle();

  if (error) throw error;
  if (!category) {
    const created = await supabase
      .from('categoria')
      .insert({ nombre: 'Bonches', tipo: 'PRODUCTO_VENTA', activo: true })
      .select('id_categoria')
      .single();
    if (created.error) throw created.error;
    category = created.data;
  }

  const productIds = {};
  for (const [code, name] of productVariants) {
    const result = await supabase
      .from('producto')
      .select('id_producto')
      .eq('codigo', code)
      .maybeSingle();
    if (result.error) throw result.error;

    if (result.data) {
      productIds[code] = result.data.id_producto;
    } else {
      const created = await supabase
        .from('producto')
        .insert({
          id_categoria: category.id_categoria,
          codigo: code,
          nombre: name,
          unidad_medida: 'BONCHE',
          precio_base: 0,
          costo_promedio: 0,
          es_inventariable: false,
          stock_actual: 0,
          stock_minimo: 0,
          activo: true,
        })
        .select('id_producto')
        .single();
      if (created.error) throw created.error;
      productIds[code] = created.data.id_producto;
    }
  }
  return productIds;
}

async function ensureClient(name) {
  const normalized = String(name || '').trim();
  if (!normalized) throw new Error('Existe una fila sin cliente.');

  const existing = await supabase
    .from('cliente')
    .select('id_cliente')
    .eq('nombre', normalized)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id_cliente;

  const created = await supabase
    .from('cliente')
    .insert({
      nombre: normalized,
      tipo_cliente: 'MINORISTA',
      activo: true,
    })
    .select('id_cliente')
    .single();
  if (created.error) throw created.error;
  return created.data.id_cliente;
}

function mapProduct(category, productIds) {
  switch (String(category || '').trim()) {
    case 'BONCHES DE ROSAS':
      return productIds['BON-ROJ'];
    case 'BONCHES DE PROMOCIÓN':
      return productIds['BON-COL'];
    case 'ROSAS BLANCAS':
      return productIds['BON-BLA'];
    case 'ROSAS PINTADAS':
      return productIds['BON-PINT'];
    case 'ROSAS AMARILLAS':
      return productIds['BON-AMA'];
    default:
      return null;
  }
}

function groupHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function makeSyntheticNumber(year, date, client) {
  const [, month, day] = date.split('-').map(Number);
  const hash = groupHash(`${date}|${client}`) % 100000;
  return 100000000 + ((year - 2000) * 1000000) + (month * 100000) + (day * 1000) + hash;
}

async function importWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.ventas_rosas, { defval: '' });
  const yearMatch = filePath.match(/20\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  if (!year) throw new Error(`No se pudo determinar el año de ${filePath}`);

  const productIds = await ensureCategoryAndProducts();
  const { data: users } = await supabase
    .from('usuario')
    .select('id_usuario')
    .eq('activo', true)
    .limit(1);
  const usuarioId = users?.[0]?.id_usuario || null;

  const groups = new Map();
  for (const row of rows) {
    const cliente = String(row.cliente || '').trim();
    const date = normalizeDate(row.fecha, year, row.num_mes);
    const anomalousGlobalAmount =
      String(row.observacion || '').includes('Monto global acumulado');
    const invoiceNumber = anomalousGlobalAmount ? null : integer(row.num_factura);
    const groupKey = invoiceNumber
      ? `INV:${year}:${invoiceNumber}:${date}:${cliente}`
      : `AUTO:${year}:${date}:${cliente}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        year,
        date,
        cliente,
        invoiceNumber,
        sourceRows: [],
      });
    }
    groups.get(groupKey).sourceRows.push(row);
  }

  let createdInvoices = 0;
  let skippedInvoices = 0;
  let createdDetails = 0;

  for (const group of groups.values()) {
    let number = group.invoiceNumber;
    if (!number) {
      number = makeSyntheticNumber(group.year, group.date, group.cliente);
    }

    const existing = await supabase
      .from('factura')
      .select('id_factura')
      .eq('numero_factura', number)
      .maybeSingle();
    if (existing.error) throw existing.error;

    if (existing.data) {
      skippedInvoices++;
      continue;
    }

    const clientId = await ensureClient(group.cliente);
    const total = group.sourceRows.reduce((sum, row) => sum + decimal(row.subtotal), 0);
    const sourceIds = group.sourceRows.map((row) => row.id_venta_rosa).join(', ');

    const created = await supabase
      .from('factura')
      .insert({
        numero_factura: number,
        id_cliente: clientId,
        id_usuario: usuarioId,
        fecha_emision: group.date,
        saldo_anterior: 0,
        total_factura: total,
        total_abonado: total,
        saldo_pendiente: 0,
        estado: 'PAGADA',
        observaciones: `[HISTORICO ${group.year} XLSX] Filas origen: ${sourceIds}`,
      })
      .select('id_factura')
      .single();

    if (created.error) throw created.error;
    createdInvoices++;

    const details = group.sourceRows.map((row) => ({
      id_factura: created.data.id_factura,
      id_producto: mapProduct(row.categoria_rosa, productIds),
      cantidad: decimal(row.cantidad_bonches),
      precio_unitario: decimal(row.precio_unitario),
      costo_unitario: 0,
      subtotal: decimal(row.subtotal),
      descuento: 0,
    }));

    const detailResult = await supabase.from('detalle_factura').insert(details);
    if (detailResult.error) throw detailResult.error;
    createdDetails += details.length;
  }

  return { createdInvoices, skippedInvoices, createdDetails };
}

for (const filePath of files) {
  const result = await importWorkbook(filePath);
  console.log(filePath, result);
}
