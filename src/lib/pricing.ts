// Calculadora de precios, con las fórmulas de la hoja "Precios" del Excel.
// Los porcentajes son fracciones: 0.3 = 30 %.
//
// Una diferencia con el Excel: allí la celda de la comisión apuntaba por error a la del IVA.
// Aquí la comisión y el IVA son valores distintos.

export type PriceInput = {
  cost: number; // costo del producto por unidad
  otherCosts: number; // empaque, domicilio gratis... por venta
  margin: number; // parte del precio de venta que debe quedar como ganancia
  fee: number; // comisión de pago, sobre el precio de venta
  vat: number; // IVA que se le cobra al cliente
};

export type PriceResult = {
  suggested: number; // precio exacto que da la fórmula
  rounded: number; // redondeado hacia arriba a miles: el precio de venta sin IVA
  withVat: number; // lo que paga el cliente
  feeAmount: number; // comisión por unidad
  profit: number; // ganancia por unidad, después de comisión y otros costos
  realMargin: number; // ganancia ÷ precio
  markup: number; // ganancia ÷ costo
};

// Precio = (costo + otros costos) ÷ (1 − margen − comisión).
// Devuelve null si margen y comisión suman 100 % o más: no existe un precio que lo cumpla.
export function suggestPrice({ cost, otherCosts, margin, fee, vat }: PriceInput): PriceResult | null {
  if (1 - margin - fee <= 0) return null;

  const suggested = (cost + otherCosts) / (1 - margin - fee);
  // Se redondea primero al peso para que una división como 70000 ÷ 0,7 = 100000,00000000001
  // no suba mil pesos de más.
  const rounded = Math.ceil(Math.round(suggested) / 1000) * 1000;
  const feeAmount = Math.round(rounded * fee);
  const profit = rounded - cost - otherCosts - feeAmount;

  return {
    suggested: Math.round(suggested),
    rounded,
    withVat: Math.round(rounded * (1 + vat)),
    feeAmount,
    profit,
    realMargin: rounded > 0 ? profit / rounded : 0,
    markup: cost > 0 ? profit / cost : 0,
  };
}
