// Estilos de los enlaces de la cabecera de la tienda. Van en su propio archivo (sin
// "use client") porque los usan tanto el layout del servidor como los enlaces de cliente.

// Los demás enlaces se atenúan al señalar uno (dentro de un contenedor "group/nav").
export const navLink =
  "transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/nav:duration-(--duration-quick) " +
  "[@media(hover:hover)]:group-has-[a:hover]/nav:not-hover:opacity-40";

// Al señalar un enlace de texto, una línea se dibuja debajo de izquierda a derecha;
// al salir, se recoge hacia la derecha (por eso cambia el origen).
export const navUnderline =
  "relative after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-right after:scale-x-0 after:bg-current " +
  "after:duration-(--duration-fast) after:ease-smooth-out motion-safe:after:transition-transform " +
  "hover:after:origin-left hover:after:scale-x-100";

// Alto mínimo de 44px para que los enlaces de texto se puedan tocar con comodidad.
export const navText = `inline-flex min-h-11 items-center ${navUnderline}`;
