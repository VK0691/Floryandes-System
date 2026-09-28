¡Perfecto! Aquí tienes el **README.md** completo para el proyecto **Floryandes System**. Está diseñado para que cualquier desarrollador (tú, un colaborador o tu yo del futuro) entienda el proyecto, su arquitectura, cómo instalarlo y cómo contribuir.

---

```markdown
# 🌹 Floryandes System

Sistema integral de facturación, inventario y contabilidad para florería.

![Versión](https://img.shields.io/badge/versión-1.0.0-blue)
![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Licencia](https://img.shields.io/badge/licencia-privada-red)

---

## 📋 Descripción

**Floryandes System** es una plataforma de gestión comercial diseñada específicamente para la florería. Reemplaza el uso de múltiples hojas de cálculo Excel, centralizando la operación diaria (facturación, compras, inventario) y proporcionando inteligencia de negocio en tiempo real (utilidad por bonche, pérdidas, rentabilidad por cliente y proveedor).

El sistema permite:
- Facturar bonches (Rojos, Colores, Blancos) y hierbas (Aster, Solidago).
- Registrar compras con múltiples productos, cantidades sanas y pérdidas.
- Controlar inventario en tiempo real.
- Calcular utilidad bruta y neta.
- Generar reportes por día, semana, mes y año.
- Acceder desde PC (`.exe`), navegador web y aplicación móvil.

---

## 🎯 Objetivos

- **Centralización:** Unificar todas las hojas de cálculo en una sola base de datos.
- **Automatización:** Eliminar cálculos manuales de subtotales, totales, saldos y utilidades.
- **Control de Cuentas:** Registro histórico de facturas, abonos y saldos pendientes.
- **Trazabilidad:** Saber exactamente qué se compró, a qué proveedor, cuánto se pagó y cuánto se perdió.
- **Análisis Temporal:** Consultar el rendimiento del negocio por día, semana, mes o año.
- **Escalabilidad:** Agregar nuevos módulos sin rehacer el sistema.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTENDS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web App     │  │  App Móvil   │  │  .exe        │      │
│  │  (Vercel)    │  │  (Flutter)   │  │  (Flutter)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          │      Internet (HTTPS)             │
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────┐
│                      SUPABASE (Nube)                        │
│  - PostgreSQL (Base de Datos)                               │
│  - API REST (Backend)                                       │
│  - Auth (Autenticación)                                     │
│  - Storage (Archivos)                                       │
│  - Realtime (Sincronización)                                │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Costo |
| :--- | :--- | :--- |
| **Base de Datos** | PostgreSQL (Supabase) | $0 (plan Free, 500 MB) |
| **Backend / API** | Supabase (API REST) | $0 |
| **Autenticación** | Supabase Auth | $0 |
| **Storage** | Supabase Storage | $0 (1 GB) |
| **Frontend Web** | React / Vue / Next.js | $0 |
| **Hosting Web** | Vercel | $0 (plan Hobby) |
| **App Escritorio** | Flutter Desktop / Electron | $0 |
| **App Móvil** | Flutter (Android/iOS) | $0 (APK) / $25 único (Google Play) |
| **Dominio** | Namecheap / Cloudflare | ~$10/año (opcional) |

**Costo total inicial:** **$0/mes**.

---

## 📁 Estructura del Proyecto

```
floryandes-system/
├── .github/
│   └── workflows/          # CI/CD (opcional)
├── docs/                   # Documentación
│   ├── requerimientos.md   # Documento de requerimientos
│   ├── sprints.md          # Planificación de sprints
│   ├── historias.md        # Historias de usuario
│   └── bd.md               # Diseño de base de datos (PlantUML)
├── supabase/
│   ├── migrations/         # Scripts SQL de migración
│   │   ├── 001_crear_tablas.sql
│   │   ├── 002_insertar_datos_iniciales.sql
│   │   └── 003_indices.sql
│   └── functions/          # Edge Functions (RPC)
├── frontend-web/           # Frontend web (React/Vue)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/       # Conexión con Supabase
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vercel.json
├── app-movil/              # App móvil (Flutter)
│   ├── lib/
│   │   ├── screens/
│   │   ├── widgets/
│   │   ├── services/       # Conexión con Supabase
│   │   ├── models/
│   │   └── main.dart
│   └── pubspec.yaml
├── app-escritorio/         # App escritorio (Flutter Desktop)
│   ├── lib/
│   └── pubspec.yaml
├── .env.example            # Variables de entorno (ejemplo)
├── .gitignore
├── README.md               # Este archivo
└── LICENSE
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** v18+ (para el frontend web)
- **Flutter** v3.0+ (para la app móvil y escritorio)
- **Git** (para control de versiones)
- **Cuenta en Supabase** (gratis)
- **Cuenta en Vercel** (gratis)

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/floryandes-system.git
cd floryandes-system
```

### Paso 2: Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Nombre: `floryandes-system`.
3. Región: `us-east-1` (la más cercana a Ecuador).
4. Copia la **URL** y la **API Key** del proyecto.
5. Ve al **SQL Editor** y ejecuta los scripts en orden:
   - `supabase/migrations/001_crear_tablas.sql`
   - `supabase/migrations/002_insertar_datos_iniciales.sql`
   - `supabase/migrations/003_indices.sql`

### Paso 3: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-api-key
```

### Paso 4: Instalar dependencias del frontend web

```bash
cd frontend-web
npm install
npm run dev
```

La web estará disponible en `http://localhost:5173`.

### Paso 5: Instalar dependencias de la app móvil

```bash
cd app-movil
flutter pub get
flutter run
```

### Paso 6: Desplegar en Vercel

1. Conecta tu repositorio de GitHub a Vercel.
2. Configura las variables de entorno en Vercel.
3. Vercel desplegará automáticamente en cada `git push`.

---

## 📊 Base de Datos

El sistema cuenta con las siguientes tablas principales:

| Tabla | Propósito |
| :--- | :--- |
| **Cliente** | Datos de clientes (Sra. Jenny, Tía Elsa, etc.). |
| **Usuario** | Usuarios del sistema (Admin, Vendedor, Bodeguero). |
| **Categoria** | Categorías de productos (Bonches, Hierbas, Servicios, Insumos). |
| **Producto** | Catálogo de productos (Bonches Rojos, Colores, Blancos, Aster, Solidago). |
| **Insumo** | Materiales (Ligas, Zuncho, Binchas, Fundas, Cajas). |
| **Proveedor** | Proveedores (TESSA, ING. CAJAS, DON ALBERTO, EDU FLOR, DENIS, SRA. MIRIAM). |
| **Compra** | Cabecera de compras. |
| **DetalleCompra** | Líneas de compra (con cantidades sanas y pérdidas). |
| **MovimientoInventario** | Kardex de entradas y salidas. |
| **Factura** | Cabecera de facturas. |
| **DetalleFactura** | Líneas de factura. |
| **Pago** | Abonos a facturas. |
| **GastoOperativo** | Costos indirectos (arriendo, luz, sueldos). |
| **Auditoria** | Registro de cambios en el sistema. |

Para más detalle, ver `docs/bd.md`.

---

## 🧪 Pruebas

### Frontend Web
```bash
cd frontend-web
npm run test
```

### App Móvil
```bash
cd app-movil
flutter test
```

### Base de Datos
Las pruebas de la base de datos se hacen directamente en Supabase SQL Editor.

---

## 🚢 Despliegue

### Frontend Web (Vercel)
```bash
cd frontend-web
npm run build
vercel --prod
```

### App Móvil (APK)
```bash
cd app-movil
flutter build apk --release
```
El APK estará en `build/app/outputs/flutter-apk/app-release.apk`.

### App Escritorio (.exe)
```bash
cd app-escritorio
flutter build windows --release
```
El `.exe` estará en `build/windows/runner/Release/`.

---

## 📅 Roadmap de Sprints

| Sprint | Duración | Objetivo | Estado |
| :--- | :--- | :--- | :--- |
| **0** | 1 semana | Preparación | ⏳ Pendiente |
| **1** | 2 semanas | BD y Auth | ⏳ Pendiente |
| **2** | 2 semanas | Clientes | ⏳ Pendiente |
| **3** | 2 semanas | Productos | ⏳ Pendiente |
| **4** | 2 semanas | Facturación 1 | ⏳ Pendiente |
| **5** | 2 semanas | Facturación 2 | ⏳ Pendiente |
| **6** | 2 semanas | Compras | ⏳ Pendiente |
| **7** | 2 semanas | Inventario | ⏳ Pendiente |
| **8** | 2 semanas | Reportes 1 | ⏳ Pendiente |
| **9** | 2 semanas | Reportes 2 | ⏳ Pendiente |
| **10** | 2 semanas | `.exe` | ⏳ Pendiente |
| **11** | 2 semanas | App Móvil 1 | ⏳ Pendiente |
| **12** | 2 semanas | App Móvil 2 | ⏳ Pendiente |
| **13** | 2 semanas | Pruebas y Capacitación | ⏳ Pendiente |

**Duración total estimada:** ~27 semanas (~6.5 meses).

---

## 🤝 Contribución

Este es un proyecto privado. Si eres colaborador:

1. Crea una rama: `git checkout -b feature/nueva-funcionalidad`.
2. Haz tus cambios y commitea: `git commit -m "Agrega nueva funcionalidad"`.
3. Sube la rama: `git push origin feature/nueva-funcionalidad`.
4. Abre un Pull Request.

### Convención de Commits

- `feat:` Nueva funcionalidad.
- `fix:` Corrección de bug.
- `docs:` Cambios en documentación.
- `style:` Cambios de formato (no afectan código).
- `refactor:` Refactorización de código.
- `test:` Agrega o modifica pruebas.
- `chore:` Tareas de mantenimiento.

---

## 📝 Licencia

Este proyecto es **privado** y de uso exclusivo de la florería. No se permite su distribución sin autorización.

---

## 📞 Contacto

- **Desarrollador:** [Tu Nombre]
- **Email:** [tu-email@ejemplo.com]
- **Repositorio:** [https://github.com/tu-usuario/floryandes-system](https://github.com/tu-usuario/floryandes-system)

---

## 🙏 Agradecimientos

- A Dios, por la oportunidad de digitalizar el negocio familiar.
- A mi papá, por confiar en este proyecto.
- A Supabase y Vercel, por ofrecer planes gratuitos que hacen posible este sistema.

---

## 📚 Documentación Adicional

- [Documento de Requerimientos](docs/requerimientos.md)
- [Diseño de Base de Datos](docs/bd.md)
- [Planificación de Sprints](docs/sprints.md)
- [Historias de Usuario](docs/historias.md)

---

**Hecho con ❤️ para la florería.**
```

---

## 📌 ¿Qué incluye este README?

| Sección | Propósito |
| :--- | :--- |
| **Descripción** | Qué es el sistema y qué hace. |
| **Objetivos** | Por qué se construye. |
| **Arquitectura** | Cómo está diseñado técnicamente. |
| **Stack Tecnológico** | Qué tecnologías se usan y cuánto cuestan. |
| **Estructura del Proyecto** | Cómo están organizadas las carpetas. |
| **Instalación** | Cómo configurar el entorno paso a paso. |
| **Base de Datos** | Resumen de las tablas principales. |
| **Pruebas** | Cómo ejecutar las pruebas. |
| **Despliegue** | Cómo publicar el sistema. |
| **Roadmap de Sprints** | Planificación del desarrollo. |
| **Contribución** | Cómo colaborar en el proyecto. |
| **Licencia** | Términos de uso. |
| **Contacto** | Información del desarrollador. |
| **Agradecimientos** | Reconocimientos. |

---

## 🎯 ¿Qué sigue?

Ahora que tienes el README, podemos:

1. **Escribir el script SQL completo** para crear todas las tablas en Supabase (listo para el Sprint 1).
2. **Definir las historias de usuario de los Sprints 3 y 4** (Productos y Facturación).
3. **Diseñar la API** (endpoints) que usará el frontend.
4. **Crear el repositorio en GitHub** y configurar Vercel + Supabase.

¿Cuál prefieres que hagamos ahora?
