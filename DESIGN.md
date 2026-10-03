# Diseño de Velare

Reglas visuales del proyecto. Los valores viven en [src/app/globals.css](src/app/globals.css); este archivo explica cómo usarlos. Si cambias un valor allí, actualiza esto.

## Idea

Una vitrina fría y limpia, no un salón dorado. Porcelana casi blanca, un solo verde menta pastel y tipografía de caja de perfume. Nada de crema con serif y dorado, ni de negro con dorado: es lo que usa todo el mundo en esta categoría.

Un solo tema, claro. Las fotos de producto suelen venir sobre blanco y el panel se usa de día.

## Color

Solo existen los colores definidos en `globals.css`; la paleta por defecto de Tailwind está desactivada.

| Uso | Clase |
|---|---|
| Fondo de página | `bg-paper` |
| Tablas, campos, superficies | `bg-surface` |
| Rellenos suaves, esqueletos | `bg-mist` |
| Bordes y divisores | `border-line`, `divide-line` |
| Texto principal, secundario, terciario | `text-ink`, `text-ink-soft`, `text-ink-faint` |
| Marca: botones, cabecera del panel, zonas verdes | `bg-brand`, `hover:bg-brand-strong` |
| Texto sobre verde | `text-on-brand`, `text-on-brand-soft` |
| Estados | `text-ok bg-ok-soft`, `text-warn bg-warn-soft`, `text-danger bg-danger-soft` |

- El verde menta pastel es el único color de marca. No se añade un segundo acento.
- Como el verde es claro, el texto que va encima es verde muy oscuro (`text-on-brand`), nunca blanco. El foco del teclado también usa ese verde oscuro.
- `text-ink-faint` no va sobre `bg-mist`: no alcanza el contraste mínimo (4,5:1).
- El verde se usa en superficies enteras (portada, cabecera), no en detalles sueltos.

## Tipografía

- **Jost** (`font-display`): títulos, la marca y la marca del perfume en las etiquetas.
- **Geist** (`font-sans`): todo lo demás. Los números de tablas llevan `tabular-nums`.
- La marca se escribe siempre con el componente `Wordmark`.
- Títulos grandes en peso ligero (`font-light`) y `tracking-tight`. Máximo `text-7xl`.
- Sin rótulos pequeños en mayúsculas encima de los títulos. Las mayúsculas espaciadas se reservan para la marca del perfume y las etiquetas de estado.

## Forma

Todo es de esquinas rectas: botones, tablas, campos, etiquetas. La única excepción son los avisos de Sileo, que traen su propia forma.

Sin sombras por ahora: la jerarquía se marca con bordes de 1px y espacio.

## Movimiento

Escala de transitions.dev, definida en `globals.css`. Cada valor se elige por lo que hace la animación:

| Qué | Cómo |
|---|---|
| Hover y cambios de color | `transition duration-(--duration-quick) ease-smooth-out` |
| Resaltar un elemento de un grupo | los demás bajan de opacidad mientras el cursor está sobre uno (navegación del panel, tramos de una gráfica). Solo en equipos con cursor |
| Botón presionado | `active:scale-98` |
| Texto importante que aparece | `motion-safe:animate-unveil`, escalonado con `--duration-micro` |
| Contenido que reemplaza a un esqueleto | `motion-safe:animate-settle` |
| Esqueleto de carga | `motion-safe:animate-skeleton` |
| Abrir menú o modal / cerrarlo | `--duration-fast` / `--duration-quick` (cerrar siempre es más rápido) |

- Toda animación lleva `motion-safe:` para respetar a quien pide menos movimiento.
- Solo se anima lo que comunica algo: un cambio de estado, una respuesta a una acción o el orden de lectura.
- Un escalonado completo no pasa de 300 ms.

## Componentes

- **Botones y enlaces:** `buttonStyles` y `linkStyles` de [button.ts](src/components/button.ts). Variante `onBrand` dentro de zonas verdes.
- **Etiqueta de producto:** nombre arriba; debajo, la marca en Jost con mayúsculas espaciadas y los datos (SKU, público, tamaño). Es el motivo que se repite en panel y tienda.
- **Avisos:** `sileo.success(...)`, `sileo.error(...)` desde componentes de cliente. El `Toaster` ya está en el layout raíz. Los errores de formulario van junto al campo, no en un aviso.
- **Formularios:** `Field` + `inputStyles` de [field.tsx](src/components/field.tsx): etiqueta arriba, ayuda o error debajo. Se conectan al servidor con `useServerForm`, que conserva lo escrito si hay errores.
- **Encabezado de página:** `PageHeader` con el enlace para volver, el título, la acción principal y una línea de datos (`Fact`).
- **Buscar y filtrar:** `FilterBar` de [filter-bar.tsx](src/components/filter-bar.tsx). Guarda lo elegido en la dirección (`?q=...`) y la página filtra en la base de datos.
- **Eliminar:** `ConfirmButton` pregunta antes de ejecutar; nunca un borrado de un solo clic.
- **Valores que cambian en vivo:** el número vuelve a entrar con `motion-safe:animate-swap`.
- **Gráficas:** `MoneyBars` de [money-bars.tsx](src/components/money-bars.tsx). Barras delgadas en una misma escala, 2px entre segmentos, leyenda con valores y detalle al pasar el cursor. Los colores `chart-cost`, `chart-inventory` y `chart-profit` están comprobados para daltonismo y solo se usan en marcas de gráficas. La cifra principal de un resumen va en Geist, no en Jost.
- **Estados:** cada pantalla con datos tiene carga (`loading.tsx`), vacío y error (`error.tsx`).

## Panel y tienda

- **Panel:** tablas y controles estándar, densidad media, sin adornos. La marca aparece solo en color, tipografía y la etiqueta de producto.
- **Tienda:** más aire, composición asimétrica, fotos reales de producto. Sin capturas falsas ni ilustraciones inventadas.

## Texto

Español claro y directo. Sin rayas largas, sin palabras de relleno ("eleva", "descubre la experiencia"). Los botones nombran su acción.
