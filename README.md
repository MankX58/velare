# Velare

Proyecto web de Velare.

## Descripción

Velare es una tienda online orientada a ofrecer una experiencia de compra clara, rápida y fácil de usar.

## Estado

Proyecto en desarrollo.

## Requisitos

- Git
- Node.js 22 o superior y npm

## Configuración

1. Clona el repositorio:

   ```bash
   git clone https://github.com/MankX58/velare.git
   cd velare-shop
   ```

2. Crea un archivo `.env.local` a partir de `.env.example`.
3. Completa las variables de entorno. En desarrollo, las de Neon deben ser siempre las de la rama `dev`.
4. En Auth0, la aplicación debe tener `http://localhost:3000/auth/callback` en Allowed Callback URLs y `http://localhost:3000` en Allowed Logout URLs.

> Los archivos `.env*` se mantienen fuera del control de versiones para evitar publicar credenciales.

## Desarrollo

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Arranca la app en `http://localhost:3000` |
| `npm run build` | Compila y comprueba los tipos |
| `npm run lint` | Revisa el código |
| `npm test` | Ejecuta las pruebas de las cuentas de dinero e inventario |
| `npm run db:migrate` | Crea o actualiza las tablas con los archivos de `db/migrations` |
| `npm run db:import` | Importa el Excel de `data/CONTABILIDAD 1.xlsx` (solo si la base está vacía) |
| `npm run db:import:reset` | Borra los datos del negocio y vuelve a importar el Excel |
| `npm run db:admin tu@correo.com` | Convierte en administrador a un usuario que ya inició sesión |
| `npm run db:descriptions` | Pone las descripciones de `db/descriptions.json` en los productos que no tienen |
| `npm run db:fotos` | Conecta las fotos de `public/productos` (nombradas por SKU: `P001.jpg`, `P001-2.jpg`) con sus productos |

La carpeta `data/` no se sube al repositorio: copia ahí el Excel antes de importar.

## Fotos de producto

Hay dos formas de ponerle fotos a un perfume. Sin fotos, la tienda muestra una etiqueta con su marca y su nombre.

- **Desde el panel:** Productos → abrir un producto → Fotos → "Subir una foto". El navegador reduce la foto antes de enviarla y queda guardada en Vercel Blob. Necesita la variable `BLOB_READ_WRITE_TOKEN`:
  1. En Vercel, abre tu proyecto → Storage → Create Database → Blob.
  2. Conéctalo al proyecto: Vercel crea la variable sola para producción.
  3. Para usarlo también en tu computador, copia el valor de esa variable a `.env.local`.
- **Desde una carpeta:** guarda las fotos en `public/productos` con el SKU como nombre (`P001.jpg`, `P001-2.jpg`) y ejecuta `npm run db:fotos`.

## Publicar en Vercel

1. Importa el repositorio en Vercel. El plan gratuito (Hobby) no permite uso comercial: para vender hace falta el plan Pro.
2. En Settings → Environment Variables, pon las mismas variables de `.env.example` con los valores de producción:
   - `APP_BASE_URL`: `https://<proyecto>.vercel.app`
   - `DATABASE_URL` y `DATABASE_URL_UNPOOLED`: las de la rama `production` de Neon.
   - Las cuatro de Auth0 (usa un `AUTH0_SECRET` distinto al de desarrollo).
3. En Auth0, agrega `https://<proyecto>.vercel.app/auth/callback` a Allowed Callback URLs y `https://<proyecto>.vercel.app` a Allowed Logout URLs.
4. Crea las tablas en la base de producción. Guarda las dos direcciones de la rama `production` en un archivo `.env.production.local` (tampoco se sube al repositorio) y ejecuta:

   ```bash
   node --env-file=.env.production.local scripts/migrate.mjs
   ```

   El mismo patrón sirve para cualquier otro script, por ejemplo `scripts/make-admin.mjs tu@correo.com` después de iniciar sesión por primera vez en producción.
5. Entra al panel y revisa Ajustes: datos de pago, WhatsApp, saldo inicial y meta mensual.

Los buscadores encuentran la tienda por `/sitemap.xml` y `/robots.txt`, que se generan solos a partir de `APP_BASE_URL` y de los productos activos.

## Estructura

- `db/migrations/`: las tablas y las vistas `product_stats` (stock, costo promedio, margen y alerta) y `cash_movements` (cada entrada y salida de dinero).
- `scripts/`: migraciones, importación del Excel, rol de administrador, descripciones y fotos.
- `src/lib/`: conexión a la base de datos (`db.ts`), Auth0 (`auth0.ts`), usuario actual y permisos (`auth.ts`), validación de formularios (`form.ts`), cuentas de inventario (`inventory.ts`), resultados y caja (`finance.ts`), periodos (`period.ts`), calculadora de precios (`pricing.ts`) y dirección pública del sitio (`site.ts`).
- `src/proxy.ts`: deja que Auth0 atienda las rutas `/auth/*`.
- `src/app/`: las páginas. La tienda pública está en `src/app/(tienda)` (inicio, `catalogo`, `producto/[slug]`, `carrito`, `checkout`, `pedidos`, `cotizar`). El panel está en `src/app/admin`, con una carpeta por sección (`productos`, `compras`, `pedidos`, `cotizaciones`, `clientes`, `ventas`, `caja`, `precios`, `ajustes`). En cada una, `actions.ts` tiene lo que se ejecuta en el servidor al guardar o eliminar, y siempre empieza comprobando el rol.
- `src/app/robots.ts` y `src/app/sitemap.ts`: lo que leen los buscadores.
- `src/components/`: piezas de interfaz compartidas (botones, campos, tablas, navegación del panel).
- `next.config.ts`: de dónde se aceptan imágenes y las cabeceras de seguridad.
- `DESIGN.md`: las reglas visuales. `PRODUCT.md`: los datos del negocio.

## Contribución

1. Crea una rama para tu cambio.
2. Realiza los cambios y comprueba que funcionan localmente.
3. Abre un pull request describiendo el cambio.

## Licencia

Pendiente de definir.
