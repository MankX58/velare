// Cuentas de una compra, iguales a las de la hoja "Compras" del Excel.
// Solo sirven para MOSTRAR el efecto antes de guardar: el valor oficial lo
// calcula siempre la base de datos (vista product_stats).

export type StockBefore = {
  stock: number; // unidades disponibles hoy
  unitsIn: number; // unidades que han entrado: stock inicial + compras
  costBasis: number; // lo que costaron esas unidades, con fletes
  avgCost: number; // costo promedio actual
};

export function purchaseEffect(before: StockBefore, quantity: number, unitCost: number, shippingCost: number) {
  const totalCost = quantity * unitCost + shippingCost;
  const unitsIn = before.unitsIn + quantity;
  return {
    totalCost,
    realUnitCost: quantity > 0 ? Math.round(totalCost / quantity) : 0,
    newStock: before.stock + quantity,
    // Costo promedio = todo lo que ha costado la mercancía ÷ unidades que han entrado.
    newAvgCost: unitsIn > 0 ? Math.round((before.costBasis + totalCost) / unitsIn) : before.avgCost,
  };
}
