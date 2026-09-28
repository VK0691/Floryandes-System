# 🌹 Floryandes System

Sistema integral de facturación, inventario y contabilidad para florería.

## 📋 Descripción

**Floryandes System** es una plataforma de gestión comercial diseñada para reemplazar hojas de cálculo de Excel, centralizando facturación, compras e inventario, con reportes financieros en tiempo real.

**Características principales:**
- Facturación por bonches (Rojos, Colores, Blancos) e hierbas (Aster, Solidago).
- Registro de compras con control de cantidades sanas y mermas.
- Inventario y cálculo de utilidad bruta/neta en tiempo real.
- Reportes consolidados (día, semana, mes, año).
- Soporte multiplataforma: Web, Desktop (`.exe`) y App Móvil.

---

## 🏗️ Arquitectura y Stack

```text
Web (Vercel) ──┐
App Móvil ─────┼──► SUPABASE (PostgreSQL + Auth + Storage + API)
Desktop (.exe) ┘
```

| Componente | Tecnología | Costo inicial |
| :--- | :--- | :--- |
| **Base de Datos / Backend** | Supabase (PostgreSQL) | $0 |
| **Autenticación** | Supabase Auth | $0 |
| **Frontend Web** | React / Vue (Vercel) | $0 |
| **App Escritorio / Móvil**| Flutter (Desktop / Mobile) | $0 |

---

## 📁 Estructura del Proyecto

```text
floryandes-system/
├── docs/                # Requerimientos, sprints, diagramas BD
├── supabase/            # Migraciones y scripts SQL
├── frontend-web/        # Aplicación Web (React/Vue)
├── app-movil/           # App Android/iOS (Flutter)
├── app-escritorio/      # App Windows (Flutter Desktop)
├── .env.example
└── README.md
```

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js v18+
- Flutter v3.0+
- Git
- Cuenta en Supabase y Vercel

### Instalación

1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/floryandes-system.git
   cd floryandes-system
   ```

2. **Variables de Entorno (`.env`):**
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-api-key
   ```

3. **Ejecutar Frontend Web:**
   ```bash
   cd frontend-web
   npm install
   npm run dev
   ```

4. **Ejecutar App Móvil:**
   ```bash
   cd ../app-movil
   flutter pub get
   flutter run
   ```

---

## 🧪 Pruebas y Despliegue

```bash
# Pruebas
cd frontend-web && npm run test
cd app-movil && flutter test

# Compilación y Deploy
cd frontend-web && npm run build && vercel --prod  # Web
cd app-movil && flutter build apk --release       # Android
cd app-escritorio && flutter build windows --release # Windows .exe
```

---

## 📅 Roadmap resumido

| Sprints | Enfoque |
| :--- | :--- |
| **Sprint 0 - 2** | Base de datos, Auth, Gestión de Clientes |
| **Sprint 3 - 5** | Catálogo de Productos y Módulo de Facturación |
| **Sprint 6 - 7** | Compras e Inventario en tiempo real |
| **Sprint 8 - 9** | Reportes de Utilidades y Pérdidas |
| **Sprint 10 - 13** | Apps de Escritorio (.exe), Móvil y QA final |

*Tiempo estimado total: ~27 semanas.*

---

## 📝 Licencia y Contacto

- **Licencia:** Proyecto privado de uso exclusivo para la florería.
- **Contacto:** [Tu Nombre] - [tu-email@ejemplo.com]
