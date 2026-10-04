# Graph Report - velare-shop  (2026-10-04)

## Corpus Check
- Corpus is ~46,693 words - fits in a single context window. You may not need a graph.

## Summary
- 575 nodes · 1868 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.84)
- Token cost: 162,134 input · 0 output

## Community Hubs (Navigation)
- Reglas de diseño y documentación
- Server actions del panel
- Páginas de listados del panel
- Formularios del panel
- Dependencias y configuración
- Flujo de pedido y pago manual
- Importación del Excel y base de datos
- Resumen financiero del panel
- Layouts y páginas de la tienda
- Configuración de TypeScript
- Iconos y logo
- Producto, usuarios y accesibilidad
- Identidad visual
- Inventario y estructura del repo
- Autenticación Auth0
- Marca y movimiento
- QR de pago Bre-B
- Comandos npm e importación
- Configuración de PostCSS

## God Nodes (most connected - your core abstractions)
1. `sql` - 85 edges
2. `requireAdmin()` - 59 edges
3. `next` - 55 edges
4. `formatCOP()` - 45 edges
5. `PageHeader()` - 31 edges
6. `buttonStyles` - 28 edges
7. `react` - 25 edges
8. `SummaryPage()` - 25 edges
9. `Field()` - 24 edges
10. `fieldProps()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Archivo de verificación de Google Search Console` --conceptually_related_to--> `Aparecer en Google (Search Console, GOOGLE_SITE_VERIFICATION, sitemap)`  [INFERRED]
  public/google8b34724abead212d.html → README.md
- `QuoteForm()` --indirect_call--> `requestQuote()`  [INFERRED]
  src/app/(tienda)/cotizar/quote-form.tsx → src/app/(tienda)/cotizar/actions.ts
- `FinanceForm()` --indirect_call--> `saveFinanceSettings()`  [INFERRED]
  src/app/admin/ajustes/finance-form.tsx → src/app/admin/ajustes/actions.ts
- `SettingsForm()` --indirect_call--> `saveStoreSettings()`  [INFERRED]
  src/app/admin/ajustes/settings-form.tsx → src/app/admin/ajustes/actions.ts
- `MovementForm()` --indirect_call--> `createMovement()`  [INFERRED]
  src/app/admin/caja/movement-form.tsx → src/app/admin/caja/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo de pedido con pago manual por transferencia** — product_venta_bajo_pedido, product_pago_manual, product_sin_correos, design_avance_de_pedido, src_components_order_progress, product_administrador, product_compradores [INFERRED 0.85]
- **Componentes del panel que explican cifras de dinero** — design_cifras_con_explicacion, src_components_summary_line, src_components_glossary, src_components_money_bars [INFERRED 0.85]
- **Indexación en Google: verificación, sitemap, robots e icono** — readme_aparecer_en_google, public_google8b34724abead212d_google_site_verification, src_app_sitemap, src_app_robots, src_lib_site, src_components_logo_mark [INFERRED 0.85]

## Communities (22 total, 4 thin omitted)

### Community 0 - "Reglas de diseño y documentación"
Cohesion: 0.05
Nodes (65): Diseño de Velare (DESIGN.md), Estados de pantalla: carga, vacío y error, Iconos: @phosphor-icons/react en peso light, Avisos con Sileo (Toaster en el layout raíz), Los pedidos guardan precio, costo y total del momento de la venta, Stack: Next.js, React, TypeScript, Tailwind, Neon, Auth0, Vercel, Vercel Blob, Sileo, Archivo de verificación de Google Search Console, Aparecer en Google (Search Console, GOOGLE_SITE_VERIFICATION, sitemap) (+57 more)

### Community 1 - "Server actions del panel"
Cohesion: 0.09
Nodes (50): saveFinanceSettings(), saveStoreSettings(), createMovement(), deleteMovement(), markPaid(), movementTypes, metadata, NewMovementPage() (+42 more)

### Community 2 - "Páginas de listados del panel"
Cohesion: 0.11
Nodes (54): CashPage(), metadata, CustomerRow, CustomersPage(), metadata, states, metadata, PurchaseRow (+46 more)

### Community 3 - "Formularios del panel"
Cohesion: 0.11
Nodes (37): react, sileo, FinanceForm(), metadata, SettingsPage(), SettingsForm(), MovementForm(), types (+29 more)

### Community 4 - "Dependencias y configuración"
Cohesion: 0.04
Nodes (46): eslintConfig, dependencies, @auth0/nextjs-auth0, @neondatabase/serverless, next, @phosphor-icons/react, react, react-dom (+38 more)

### Community 5 - "Flujo de pedido y pago manual"
Cohesion: 0.10
Nodes (34): Pago por transferencia (Bre-B o Nequi) confirmado a mano, sin pasarela, Sin correos transaccionales: estado en la web y aviso por WhatsApp, Venta bajo pedido: pagar, verificar, comprar al proveedor, enviar, AdminOrderPage(), dateTime, metadata, ConfirmPayment(), confirm() (+26 more)

### Community 6 - "Importación del Excel y base de datos"
Cohesion: 0.07
Nodes (24): @neondatabase/serverless, connect(), addCustomer(), args, configHead, customerRows, expenseRows, isoDate() (+16 more)

### Community 7 - "Resumen financiero del panel"
Cohesion: 0.11
Nodes (31): Vista cash_movements (entradas y salidas de dinero), colors, count(), metadata, ProductMovement, ShareList(), Stat(), SummaryPage() (+23 more)

### Community 8 - "Layouts y páginas de la tienda"
Cohesion: 0.10
Nodes (22): @phosphor-icons/react, AdminLayout(), metadata, metadata, NotFound(), metadata, NoAccessPage(), metadata (+14 more)

### Community 9 - "Configuración de TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 10 - "Iconos y logo"
Cohesion: 0.19
Nodes (11): AppleIcon(), contentType, size, contentType, Icon(), size, alt, contentType (+3 more)

### Community 11 - "Producto, usuarios y accesibilidad"
Cohesion: 0.24
Nodes (8): Accesibilidad y comodidad (reglas de diseño), Panel (denso, sin adornos) frente a Tienda (aire, asimetría, fotos reales), Accesibilidad e inclusión (AA, foco, menos movimiento, 44px), Administrador (el dueño), Compradores (Colombia, redes sociales, teléfono), Producto (PRODUCT.md), Panel de administración src/app/admin, Tienda pública src/app/(tienda)

### Community 12 - "Identidad visual"
Cohesion: 0.33
Nodes (5): Paleta de color (tokens de globals.css), Tipografía: Jost (display) y Geist (sans), Verde salvia #596357 (único color de marca), Wordmark (componente de la marca escrita), Posicionamiento: boutique de perfumería internacional

### Community 13 - "Inventario y estructura del repo"
Cohesion: 0.40
Nodes (4): nextConfig, Estructura del repositorio, Vista product_stats (stock, costo promedio, margen, alerta), StockBefore

### Community 14 - "Autenticación Auth0"
Cohesion: 0.40
Nodes (3): @auth0/nextjs-auth0, auth0, config

### Community 15 - "Marca y movimiento"
Cohesion: 0.40
Nodes (5): Lema: Fragancias que dejan huella, Movimiento: escala de transitions.dev, Elemento compartido lista-producto (ViewTransition morph), Marca Velare, src/app/globals.css

### Community 16 - "QR de pago Bre-B"
Cohesion: 0.50
Nodes (4): Payment QR Code Image (Bre-B / Nu, store owner account), Bre-B Instant Payment System (Colombia), Nu Bank (issuing wallet of the QR), Bre-B Payment Key (Llave) of the Account Holder

### Community 17 - "Comandos npm e importación"
Cohesion: 0.67
Nodes (3): Excel de contabilidad (25 productos, compras, ventas, clientes), Comandos npm (dev, build, lint, test, db:*), Importación del Excel (db:import, db:import:reset)

## Knowledge Gaps
- **171 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Reglas de diseño y documentación` to `Server actions del panel`, `Páginas de listados del panel`, `Formularios del panel`, `Dependencias y configuración`, `Flujo de pedido y pago manual`, `Resumen financiero del panel`, `Layouts y páginas de la tienda`, `Iconos y logo`, `Inventario y estructura del repo`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reglas de diseño y documentación` be split into smaller, more focused modules?**
  _Cohesion score 0.0522466039707419 - nodes in this community are weakly interconnected._
- **Why does `sql` connect `Server actions del panel` to `Reglas de diseño y documentación`, `Páginas de listados del panel`, `Flujo de pedido y pago manual`, `Resumen financiero del panel`, `Layouts y páginas de la tienda`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `Server actions del panel` be split into smaller, more focused modules?**
  _Cohesion score 0.09440993788819876 - nodes in this community are weakly interconnected._
- **Why does `@neondatabase/serverless` connect `Importación del Excel y base de datos` to `Server actions del panel`, `Dependencias y configuración`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Páginas de listados del panel` be split into smaller, more focused modules?**
  _Cohesion score 0.10641821946169772 - nodes in this community are weakly interconnected._