import { sql } from "./db";

// Estados de un pedido, en el orden en que avanza.
export const statusLabels = {
  pending: "Pendiente de pago",
  payment_reported: "Pago reportado",
  payment_confirmed: "Pago confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const;

export type OrderStatus = keyof typeof statusLabels;

// A qué estados puede pasar un pedido desde cada estado (además de confirmar el pago).
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ["cancelled"],
  payment_reported: ["cancelled"],
  payment_confirmed: ["preparing", "shipped", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-warn-soft text-warn",
  payment_reported: "bg-warn-soft text-warn",
  payment_confirmed: "bg-ok-soft text-ok",
  preparing: "bg-ok-soft text-ok",
  shipped: "bg-ok-soft text-ok",
  delivered: "bg-mist text-ink-soft",
  cancelled: "bg-danger-soft text-danger",
};

export type Order = {
  id: number;
  code: string;
  status: OrderStatus;
  ordered_on: string;
  user_id: number | null;
  customer: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_notes: string | null;
  shipping_fee: number;
  tracking: string | null;
  payment_reference: string | null;
  payment_reported_at: string | null;
  payment_confirmed_at: string | null;
  confirmed_by: string | null;
  admin_notes: string | null;
  items_total: number;
};

export type OrderItem = { product_name: string; quantity: number; unit_price: number; total: number };

// Un pedido con el total de sus líneas. Devuelve undefined si no existe.
export async function getOrder(id: number) {
  const rows = (await sql`
    select o.id, o.code, o.status, o.ordered_on::text as ordered_on, o.user_id, c.name as customer,
           o.shipping_name, o.shipping_phone, o.shipping_address, o.shipping_city, o.shipping_notes,
           o.shipping_fee, o.tracking, o.payment_reference,
           o.payment_reported_at::text as payment_reported_at,
           o.payment_confirmed_at::text as payment_confirmed_at,
           u.email as confirmed_by, o.admin_notes,
           (select coalesce(sum(total), 0) from order_items where order_id = o.id)::int as items_total
    from orders o
    left join customers c on c.id = o.customer_id
    left join users u on u.id = o.payment_confirmed_by
    where o.id = ${id}`) as Order[];
  return rows[0];
}

export async function getOrderItems(orderId: number) {
  return (await sql`
    select product_name, quantity, unit_price, total
    from order_items where order_id = ${orderId} order by id`) as OrderItem[];
}

// Datos de la tienda que el dueño configura en Panel → Ajustes.
export type StoreSettings = {
  brebKey: string; // llave Bre-B o número de Nequi al que se transfiere
  holder: string; // titular de la cuenta
  bank: string; // banco o billetera
  whatsapp: string; // número con indicativo, solo dígitos: 573001234567
  shippingFee: number; // costo fijo de envío en pesos (0 = sin cobro en la web)
  qrImage: string; // imagen del QR de pago dentro de la carpeta public, por ejemplo "/pago-qr.jpg"
};

const emptySettings: StoreSettings = { brebKey: "", holder: "", bank: "", whatsapp: "", shippingFee: 0, qrImage: "" };

export async function getStoreSettings(): Promise<StoreSettings> {
  const [row] = await sql`select value from settings where key = 'store'`;
  return { ...emptySettings, ...((row?.value ?? {}) as Partial<StoreSettings>) };
}
