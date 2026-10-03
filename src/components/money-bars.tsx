import { formatCOP } from "@/lib/format";

// Gráfica de barras apiladas horizontales, todas en la misma escala.
// Cada barra es un total (por ejemplo "Invertido") partido en segmentos.
// Reglas que sigue: barras delgadas, 2px de separación entre segmentos, el total
// escrito en la punta, leyenda con los valores y texto siempre en color de texto.

export type Segment = { label: string; value: number; color: string };
export type Bar = { label: string; segments: Segment[] };

export function MoneyBars({ bars, legend }: { bars: Bar[]; legend: Segment[] }) {
  const total = (bar: Bar) => bar.segments.reduce((sum, segment) => sum + segment.value, 0);
  const max = Math.max(...bars.map(total), 1);

  return (
    <figure className="group/bars">
      <div className="flex flex-col gap-5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <p className="mb-2 text-sm text-ink-soft">{bar.label}</p>
            <div className="flex items-center gap-3">
              {/* Todas las barras comparten este carril, así sus largos se pueden comparar.
                  El ancho de cada barra es su total frente al mayor de los totales. */}
              <div className="min-w-0 flex-1">
                <div className="flex h-5 gap-0.5" style={{ width: `${(total(bar) / max) * 100}%` }}>
                  {bar.segments
                  .filter((segment) => segment.value > 0)
                  .map((segment) => (
                    <div
                      key={segment.label}
                      tabIndex={0}
                      data-segment
                      // Al señalar un tramo, los demás tramos de la gráfica se atenúan.
                      className="group relative h-full transition-opacity duration-(--duration-medium) ease-smooth-out group-has-[[data-segment]:hover]/bars:duration-(--duration-quick) [@media(hover:hover)]:group-has-[[data-segment]:hover]/bars:not-hover:opacity-30 last:rounded-r-[4px] motion-safe:origin-left motion-safe:animate-grow"
                      style={{ width: `${(segment.value / total(bar)) * 100}%`, backgroundColor: segment.color }}
                    >
                      {/* Detalle al pasar el cursor o enfocar con el teclado. */}
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 scale-98 bg-ink px-3 py-2 text-xs whitespace-nowrap text-paper opacity-0 transition duration-(--duration-quick) ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                      >
                        {segment.label}: <span className="tabular-nums">{formatCOP(segment.value)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">{formatCOP(total(bar))}</span>
            </div>
          </div>
        ))}
      </div>

      {/* La leyenda lleva los valores: la gráfica se puede leer sin depender del color ni del cursor. */}
      <figcaption className="mt-8 border-t border-line pt-5">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {legend.map((segment) => (
            <li key={segment.label} className="flex items-center gap-2">
              <span aria-hidden className="size-3 shrink-0" style={{ backgroundColor: segment.color }} />
              <span className="text-ink-soft">{segment.label}</span>
              <span className="tabular-nums">{formatCOP(segment.value)}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
