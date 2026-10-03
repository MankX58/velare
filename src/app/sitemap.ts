import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// El mapa se guarda en caché y se vuelve a generar como mucho una vez por hora,
// así los productos nuevos aparecen sin consultar la base de datos en cada visita.
export const revalidate = 3600;

// /sitemap.xml: la lista de páginas públicas para los buscadores.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await sql`
    select slug, updated_at from products where is_active order by slug`) as { slug: string; updated_at: Date }[];

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/cotizar`, changeFrequency: "monthly", priority: 0.5 },
    ...products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
