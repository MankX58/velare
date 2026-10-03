// Estilos de botón compartidos. Se aplican con className a <button>, <a> o <Link>.
// Todos miden 44px de alto (cómodo para el dedo) y se hunden un poco al presionarlos.
const base =
  "inline-flex h-11 items-center justify-center px-6 text-sm font-medium tracking-wide whitespace-nowrap " +
  "transition duration-(--duration-quick) ease-smooth-out active:scale-98 " +
  "disabled:pointer-events-none disabled:opacity-60";

export const buttonStyles = {
  // Acción principal sobre fondo claro.
  primary: `${base} bg-brand text-on-brand hover:bg-brand-strong`,
  // Acción secundaria: cancelar, volver.
  secondary: `${base} border border-line bg-surface text-ink hover:border-ink-faint`,
  // Acción principal sobre una zona verde.
  onBrand: `${base} bg-on-brand text-brand hover:bg-ink`,
};

// Enlace de texto subrayado. `onBrand` para zonas verdes, `danger` para eliminar.
const linkBase = "underline transition-colors duration-(--duration-quick) ease-smooth-out";

export const linkStyles = {
  default: `${linkBase} decoration-line hover:decoration-ink`,
  onBrand: `${linkBase} decoration-on-brand-soft/50 hover:decoration-on-brand`,
  danger: `${linkBase} text-danger decoration-danger/30 hover:decoration-danger`,
};
