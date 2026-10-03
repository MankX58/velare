import { cache } from "react";
import { sql } from "./db";

// Consultas de la tienda pública. Solo devuelven productos activos y solo los datos
// que un cliente puede ver: nunca costos ni márgenes.

export type StoreProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  audience: string | null;
  size_ml: number | null;
  category: string | null;
  description: string | null;
  list_price: number;
  images: string[]; // fotos del producto; vacío = se muestra la etiqueta
  in_stock: boolean; // false = se vende bajo pedido
};

export const sortOptions = [
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre" },
];

// Lista de productos con búsqueda, filtros y orden. Sin `orden`, salen primero los más vendidos.
export async function listProducts({ q = "", marca = "", publico = "", orden = "", limit = 200 } = {}) {
  const like = `%${q}%`;
  return (await sql`
    select p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images,
           s.stock > 0 as in_stock
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active
      and (${q} = '' or p.name ilike ${like} or p.brand ilike ${like})
      and (${marca} = '' or p.brand = ${marca})
      and (${publico} = '' or p.audience = ${publico})
    order by
      case when ${orden} = 'precio-asc' then p.list_price end asc,
      case when ${orden} = 'precio-desc' then p.list_price end desc,
      case when ${orden} = 'nombre' then p.name end asc,
      s.units_sold desc, s.stock desc, p.name asc
    limit ${limit}`) as StoreProduct[];
}

// cache(): si se pide el mismo producto dos veces en una visita (título y página), se consulta una sola.
export const getProduct = cache(async (slug: string) => {
  const rows = (await sql`
    select p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images,
           s.stock > 0 as in_stock
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and p.slug = ${slug}`) as StoreProduct[];
  return rows[0];
});

// Productos por id, para mostrar el carrito con precios actuales.
export async function getProductsById(ids: number[]) {
  return (await sql`
    select p.id, p.slug, p.name, p.brand, p.audience, p.size_ml, p.category, p.description, p.list_price, p.images,
           s.stock > 0 as in_stock
    from products p
    join product_stats s on s.product_id = p.id
    where p.is_active and p.id = any(${ids})`) as StoreProduct[];
}

export async function listBrands() {
  const rows = await sql`select brand from products where is_active and brand is not null group by brand order by brand`;
  return rows.map((row) => row.brand as string);
}

// Cuántos productos hay para cada público: [{ audience: "Hombre", count: 20 }, ...]
export async function countByAudience() {
  return (await sql`
    select audience, count(*)::int as count
    from products
    where is_active and audience is not null
    group by audience
    order by count desc`) as { audience: string; count: number }[];
}
