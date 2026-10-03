import { CaretDown } from "@phosphor-icons/react/dist/ssr";

// Explicación plegable de los datos de una pantalla: qué es cada uno y de dónde sale.
// Usa <details>, que el navegador abre y cierra sin código y funciona con teclado.
export function Glossary({
  title = "¿Qué significa cada dato?",
  terms,
}: {
  title?: string;
  terms: [name: string, meaning: string][];
}) {
  return (
    <details className="group mb-6 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-ink-soft underline decoration-line transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink [&::-webkit-details-marker]:hidden">
        {title}
        <CaretDown
          size={14}
          weight="light"
          aria-hidden
          className="transition-transform duration-(--duration-fast) ease-smooth-out group-open:rotate-180"
        />
      </summary>
      <dl className="mt-2 grid gap-x-10 gap-y-5 border border-line bg-surface p-6 group-open:motion-safe:animate-disclose sm:grid-cols-2">
        {terms.map(([name, meaning]) => (
          <div key={name}>
            <dt className="font-medium">{name}</dt>
            <dd className="mt-1 leading-relaxed text-ink-soft">{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
