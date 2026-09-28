-- ==========================================================
-- FLORYANDES SYSTEM - Script de Creación y Semilla de BD (v3.1)
-- ==========================================================

-- 1. TABLA USUARIO
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'BODEGUERO')),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA CLIENTE
CREATE TABLE IF NOT EXISTS cliente (
  id_cliente SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  ruc VARCHAR(20),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  correo VARCHAR(100),
  tipo_cliente VARCHAR(20) DEFAULT 'MINORISTA' CHECK (tipo_cliente IN ('MAYORISTA', 'MINORISTA', 'CORPORATIVO')),
  saldo_actual DECIMAL(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA CATEGORIA
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PRODUCTO_VENTA', 'INSUMO', 'SERVICIO')),
  activo BOOLEAN DEFAULT TRUE
);

-- 4. TABLA PRODUCTO
CREATE TABLE IF NOT EXISTS producto (
  id_producto SERIAL PRIMARY KEY,
  id_categoria INT REFERENCES categoria(id_categoria),
  codigo VARCHAR(20) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('BONCHE', 'UNIDAD', 'DOCENA')),
  precio_base DECIMAL(12,2) DEFAULT 0,
  costo_promedio DECIMAL(12,2) DEFAULT 0,
  es_inventariable BOOLEAN DEFAULT TRUE,
  stock_actual DECIMAL(12,2) DEFAULT 0,
  stock_minimo DECIMAL(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

-- 5. TABLA INSUMO
CREATE TABLE IF NOT EXISTS insumo (
  id_insumo SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('UNIDAD', 'METRO', 'ROLLO', 'PAQUETE')),
  stock_actual DECIMAL(12,2) DEFAULT 0,
  stock_minimo DECIMAL(12,2) DEFAULT 0,
  costo_promedio DECIMAL(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

-- 6. TABLA PROVEEDOR
CREATE TABLE IF NOT EXISTS proveedor (
  id_proveedor SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  ruc VARCHAR(20),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  tipo VARCHAR(20) DEFAULT 'Finca' CHECK (tipo IN ('Finca', 'Corporativa', 'Distribuidor')),
  activo BOOLEAN DEFAULT TRUE
);

-- 7. TABLA COMPRA
CREATE TABLE IF NOT EXISTS compra (
  id_compra SERIAL PRIMARY KEY,
  numero_compra INT UNIQUE NOT NULL,
  id_proveedor INT REFERENCES proveedor(id_proveedor),
  id_usuario INT REFERENCES usuario(id_usuario),
  fecha_compra DATE NOT NULL,
  total_compra DECIMAL(12,2) DEFAULT 0,
  total_pagado DECIMAL(12,2) DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADA', 'ANULADA')),
  observaciones VARCHAR(500)
);

-- 8. TABLA DETALLE COMPRA
CREATE TABLE IF NOT EXISTS detalle_compra (
  id_detalle_compra SERIAL PRIMARY KEY,
  id_compra INT REFERENCES compra(id_compra) ON DELETE CASCADE,
  id_producto INT REFERENCES producto(id_producto),
  id_insumo INT REFERENCES insumo(id_insumo),
  cantidad_recibida DECIMAL(12,2) NOT NULL,
  cantidad_sana DECIMAL(12,2) NOT NULL,
  cantidad_perdida DECIMAL(12,2) DEFAULT 0,
  motivo_perdida VARCHAR(200),
  costo_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

-- 9. TABLA FACTURA
CREATE TABLE IF NOT EXISTS factura (
  id_factura SERIAL PRIMARY KEY,
  numero_factura INT UNIQUE NOT NULL,
  id_cliente INT REFERENCES cliente(id_cliente),
  id_usuario INT REFERENCES usuario(id_usuario),
  fecha_emision DATE NOT NULL,
  saldo_anterior DECIMAL(12,2) DEFAULT 0,
  total_factura DECIMAL(12,2) DEFAULT 0,
  total_abonado DECIMAL(12,2) DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PAGADA', 'PENDIENTE', 'ANULADA')),
  observaciones VARCHAR(500)
);

-- 10. TABLA DETALLE FACTURA
CREATE TABLE IF NOT EXISTS detalle_factura (
  id_detalle_factura SERIAL PRIMARY KEY,
  id_factura INT REFERENCES factura(id_factura) ON DELETE CASCADE,
  id_producto INT REFERENCES producto(id_producto),
  cantidad DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  costo_unitario DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  descuento DECIMAL(12,2) DEFAULT 0
);

-- 11. TABLA PAGO
CREATE TABLE IF NOT EXISTS pago (
  id_pago SERIAL PRIMARY KEY,
  id_factura INT REFERENCES factura(id_factura),
  fecha_pago DATE NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE')),
  referencia VARCHAR(100),
  id_usuario INT REFERENCES usuario(id_usuario)
);

-- 12. TABLA MOVIMIENTO INVENTARIO
CREATE TABLE IF NOT EXISTS movimiento_inventario (
  id_movimiento SERIAL PRIMARY KEY,
  fecha TIMESTAMP DEFAULT NOW(),
  tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'PERDIDA')),
  id_producto INT REFERENCES producto(id_producto),
  id_insumo INT REFERENCES insumo(id_insumo),
  cantidad DECIMAL(12,2) NOT NULL,
  costo_unitario DECIMAL(12,2) DEFAULT 0,
  referencia VARCHAR(100),
  id_usuario INT REFERENCES usuario(id_usuario)
);

-- 13. TABLA GASTO OPERATIVO
CREATE TABLE IF NOT EXISTS gasto_operativo (
  id_gasto SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  categoria VARCHAR(50) CHECK (categoria IN ('ARRIENDO', 'SERVICIOS', 'SUELDOS', 'TRANSPORTE', 'OTROS')),
  id_usuario INT REFERENCES usuario(id_usuario)
);

-- 14. TABLA AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria SERIAL PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  id_registro INT NOT NULL,
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREAR', 'MODIFICAR', 'ANULAR', 'ELIMINAR')),
  fecha TIMESTAMP DEFAULT NOW(),
  id_usuario INT REFERENCES usuario(id_usuario),
  detalle TEXT
);

-- ==========================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_factura_fecha ON factura(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_factura_cliente ON factura(id_cliente);
CREATE INDEX IF NOT EXISTS idx_detalle_factura_producto ON detalle_factura(id_producto);
CREATE INDEX IF NOT EXISTS idx_compra_fecha ON compra(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_compra_proveedor ON compra(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_movimiento_producto ON movimiento_inventario(id_producto);

-- ==========================================
-- DATOS INICIALES (SEED DATA)
-- ==========================================
-- Proveedores
INSERT INTO proveedor (nombre, tipo) VALUES
('TESSA', 'Corporativa'),
('ING. CAJAS', 'Finca'),
('DON ALBERTO', 'Finca'),
('EDU FLOR', 'Corporativa'),
('DENIS', 'Finca'),
('SRA. MIRIAM', 'Finca')
ON CONFLICT (nombre) DO NOTHING;

-- Categorías
INSERT INTO categoria (nombre, tipo) VALUES
('Bonches', 'PRODUCTO_VENTA'),
('Hierbas', 'PRODUCTO_VENTA'),
('Servicios', 'SERVICIO'),
('Insumos', 'INSUMO')
ON CONFLICT DO NOTHING;

-- Productos
INSERT INTO producto (id_categoria, codigo, nombre, unidad_medida, precio_base)
VALUES
(1, 'BON-ROJ', 'Bonche de Rosas Rojas', 'BONCHE', 2.50),
(1, 'BON-COL', 'Bonche de Colores', 'BONCHE', 2.75),
(1, 'BON-BLA', 'Bonche de Rosas Blancas', 'BONCHE', 2.50),
(2, 'AST', 'Aster', 'UNIDAD', 1.50),
(2, 'SOL', 'Solidago', 'UNIDAD', 1.50),
(3, 'GUI', 'Guía de Envío', 'UNIDAD', 6.00),
(4, 'CAJ', 'Cajas', 'UNIDAD', 0.75)
ON CONFLICT (codigo) DO NOTHING;

-- Insumos
INSERT INTO insumo (codigo, nombre, unidad_medida, stock_minimo) VALUES
('LIG', 'Ligas', 'UNIDAD', 50),
('ZUN', 'Zuncho', 'ROLLO', 5),
('BIN', 'Binchas', 'PAQUETE', 10),
('FUN', 'Fundas', 'PAQUETE', 20)
ON CONFLICT (codigo) DO NOTHING;

-- Clientes
INSERT INTO cliente (nombre, ruc, telefono, tipo_cliente) VALUES
('SRA. JENNY', '0201617784', '0994616783', 'MINORISTA'),
('TÍA ELSA', '0925229916001', '0969941947', 'MINORISTA'),
('SRA. MARY', NULL, NULL, 'MINORISTA'),
('SRA. PATRICIA', NULL, '0980654343', 'MINORISTA')
ON CONFLICT (nombre) DO NOTHING;
