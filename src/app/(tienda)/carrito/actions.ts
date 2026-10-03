"use server";

import { getProductsById, type StoreProduct } from "@/lib/catalog";

// Devuelve los productos del carrito con su precio ACTUAL. El navegador solo manda
// ids: nombres y precios salen siempre de la base de datos.
export async function getCartProducts(ids: number[]): Promise<StoreProduct[]> {
  const valid = ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, 50);
  if (valid.length === 0) return [];
  return getProductsById(valid);
}
