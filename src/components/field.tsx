// Piezas de formulario: etiqueta arriba, campo, y debajo la ayuda o el error.

// Aspecto de un campo, sin ancho: lo usan las barras de filtros, donde cada control mide lo suyo.
// Con aria-invalid el borde se pone rojo.
export const controlStyles =
  "border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint " +
  "transition-colors duration-(--duration-quick) ease-smooth-out hover:border-ink-faint " +
  "focus:border-ink aria-invalid:border-danger";

// Clase para <input>, <select> y <textarea> dentro de un formulario: ocupan todo el ancho.
export const inputStyles = `w-full ${controlStyles}`;

export function Field({
  label,
  name,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  name: string; // debe coincidir con el id del campo que va dentro
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

// Atributos que conectan un campo con su error para lectores de pantalla.
export function fieldProps(name: string, error?: string) {
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  };
}
