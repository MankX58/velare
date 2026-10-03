import { linkStyles } from "@/components/button";
import { Fact, PageHeader } from "@/components/page-header";
import { QuoteBadge } from "@/components/quote-badge";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
import { AnswerForm } from "./answer-form";

export const metadata = { title: "Cotizaciones" };

type QuoteRow = {
  id: number;
  perfume: string;
  details: string | null;
  phone: string;
  price: number | null;
  answer: string | null;
  answered: boolean;
  created_on: string;
  email: string | null;
};

export default async function QuotesPage() {
  await requireAdmin();

  // Primero las que esperan respuesta; dentro de cada grupo, las más recientes.
  // ponytail: sin buscador ni páginas, muestra las últimas 200. Agregar FilterBar si el volumen crece.
  const quotes = (await sql`
    select q.id, q.perfume, q.details, q.phone, q.price, q.answer, u.email,
           q.answered_at is not null as answered,
           (q.created_at at time zone 'America/Bogota')::date::text as created_on
    from quotes q
    join users u on u.id = q.user_id
    order by q.answered_at is not null, q.id desc
    limit 200`) as QuoteRow[];
  const pending = quotes.filter((quote) => !quote.answered).length;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Cotizaciones"
        description="Perfumes que te piden y no están en el catálogo. Respóndeles con el precio; el cliente ve tu respuesta en la tienda."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Cotizaciones">{quotes.length}</Fact>
          <Fact label="Por responder">{pending}</Fact>
        </dl>
      </PageHeader>

      {quotes.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay cotizaciones</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cuando alguien pregunte en la tienda por un perfume que no está en el catálogo, aparecerá aquí para que le
            respondas con el precio.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {quotes.map((quote) => {
            const greeting = `Hola, te escribimos de Velare por tu cotización de ${quote.perfume}.`;
            const message = quote.price === null ? greeting : `${greeting} El precio es ${formatCOP(quote.price)}.`;
            return (
              <li key={quote.id} className="grid grid-cols-1 gap-x-10 gap-y-6 p-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="min-w-0 text-lg font-medium break-words">{quote.perfume}</h2>
                    <QuoteBadge answered={quote.answered} price={quote.price} />
                  </div>
                  {quote.details && (
                    <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-ink-soft">{quote.details}</p>
                  )}
                  <p className="mt-4 text-xs text-ink-faint">
                    {formatDate(quote.created_on)}, {quote.email ?? "sin correo"}
                  </p>
                  <a href={whatsappLink(quote.phone, message)} target="_blank" rel="noreferrer" className={`mt-2 inline-block text-sm ${linkStyles.default}`}>
                    Escribirle por WhatsApp al {quote.phone}
                  </a>
                </div>
                <AnswerForm quoteId={quote.id} price={quote.price} answer={quote.answer} answered={quote.answered} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
