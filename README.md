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

La carpeta `data/` no se sube al repositorio: copia ahí el Excel antes de importar.

## Estructura

- `db/migrations/`: las tablas y la vista `product_stats`, que calcula stock, costo promedio, margen y alerta.
- `scripts/`: migraciones, importación del Excel y asignación del rol de administrador.
- `src/lib/`: conexión a la base de datos (`db.ts`), Auth0 (`auth0.ts`), usuario actual y permisos (`auth.ts`), validación de formularios (`form.ts`) y cuentas de inventario (`inventory.ts`).
- `src/proxy.ts`: deja que Auth0 atienda las rutas `/auth/*`.
- `src/app/`: las páginas. El panel está en `src/app/admin`, con una carpeta por sección (`productos`, `compras`). En cada una, `actions.ts` tiene lo que se ejecuta en el servidor al guardar o eliminar.
- `src/components/`: piezas de interfaz compartidas (botones, campos, tablas, cabecera del panel).
- `DESIGN.md`: las reglas visuales. `PRODUCT.md`: los datos del negocio.

## Contribución

1. Crea una rama para tu cambio.
2. Realiza los cambios y comprueba que funcionan localmente.
3. Abre un pull request describiendo el cambio.

## Licencia

Pendiente de definir.
