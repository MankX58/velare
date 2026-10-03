// Cómo se lee cada signo en un lector de pantalla.
const signWords = { "+": "más", "−": "menos", "=": "igual a" };

// Una línea "nombre: valor" de un resumen o de una cuenta. Va dentro de un <dl>.
// - `hint`: de dónde sale el número, en una frase corta debajo del nombre.
// - `sign`: "+", "−" o "=" cuando la línea es un paso de una cuenta. La primera línea
//   de la cuenta lleva sign="" para que todas queden alineadas.
// - `total`: el nombre va en negro y con más peso: es un resultado.
// - `from`: muestra el valor de antes, tachado, si es distinto del nuevo.
export function SummaryLine({
  label,
  hint,
  sign,
  total = false,
  from,
  danger = false,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  sign?: "" | keyof typeof signWords;
  total?: boolean;
  from?: string;
  danger?: boolean; // valor en rojo: una pérdida o un saldo negativo
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex min-w-0 gap-2 text-ink-soft">
        {sign !== undefined && (
          <span className="w-3 shrink-0 text-ink-faint">
            {/* Sin signo va un espacio: así la línea conserva su altura y el valor queda alineado con el nombre. */}
            <span aria-hidden>{sign || " "}</span>
            {sign && <span className="sr-only">{signWords[sign]}</span>}
          </span>
        )}
        <span className="min-w-0">
          <span className={total ? "font-medium text-ink" : ""}>{label}</span>
          {hint && <span className="mt-1 block text-xs leading-relaxed text-ink-faint">{hint}</span>}
        </span>
      </dt>
      <dd className={`shrink-0 text-right tabular-nums ${danger ? "text-danger" : ""}`}>
        {from && from !== String(children) && <s className="mr-2 text-ink-faint">{from}</s>}
        {/* key: al cambiar el valor, el número vuelve a entrar con una transición corta. */}
        <span key={String(children)} className="inline-block font-medium motion-safe:animate-swap">
          {children}
        </span>
      </dd>
    </div>
  );
}
