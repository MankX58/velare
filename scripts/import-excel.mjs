// Importación inicial desde el Excel de contabilidad.
//
//   npm run db:import          importa (se niega si ya hay productos)
//   npm run db:import:reset    borra los datos del negocio e importa de nuevo
//
// Solo se leen las celdas que se escriben a mano. Lo que el Excel calcula con
// fórmulas (stock, costo promedio, totales) lo calcula la base de datos, y al
// final se comparan ambos resultados: si no coinciden, no se guarda nada.
import { readSheet } from "read-excel-file/node";
import { connect } from "./db.mjs";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const file = args.find((a) => !a.startsWith("--")) ?? "data/CONTABILIDAD 1.xlsx";

// ---------- Lectura del Excel ----------

// Filas de una hoja como objetos { "Encabezado": valor }. La fila de
// encabezados es la primera cuya columna A dice `firstHeader`.
async function readTable(sheet, firstHeader) {
  const rows = await readSheet(file, sheet);
  const at = rows.findIndex((r) => r[0] === firstHeader);
  if (at < 0) throw new Error(`Hoja ${sheet}: no encontré el encabezado "${firstHeader}".`);
  const headers = rows[at];
  return rows.slice(at + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

const text = (v) => (v == null ? null : String(v).trim() || null);

function int(v, label) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${label}: "${v}" no es un número.`);
  return Math.round(n);
}

function isoDate(v, label) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  // Número de serie de Excel (días desde el 30/12/1899).
  if (typeof v === "number") return new Date(Date.UTC(1899, 11, 30) + v * 86400000).toISOString().slice(0, 10);
  const m = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // dd/mm/aaaa
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  throw new Error(`${label}: no entiendo la fecha "${v}" (usa dd/mm/aaaa).`);
}

function required(value, label) {
  if (value == null) throw new Error(`${label}: falta el dato.`);
  return value;
}

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sum = (rows, column) => rows.reduce((total, r) => total + (Number(r[column]) || 0), 0);

// Igual que el Excel: en Productos, Compras y Ventas una fila sin SKU se ignora.
const productRows = (await readTable("Productos", "SKU (código único)")).filter((r) => text(r["SKU (código único)"]));
const purchaseRows = (await readTable("Compras", "Fecha")).filter((r) => text(r["SKU"]));
const saleRows = (await readTable("Ventas", "Fecha")).filter((r) => text(r["SKU"]));
const customerRows = (await readTable("Clientes", "Cliente")).filter((r) => text(r["Cliente"]));
const expenseRows = (await readTable("Gastos", "Fecha")).filter((r) => r["Valor"] != null);
const movementRows = (await readTable("Aportes_Retiros", "Fecha")).filter((r) => r["Valor"] != null);

// Hoja Config: parámetros en las columnas A-B y listas hacia la derecha.
const config = await readSheet(file, "Config");
const configHead = config.findIndex((r) => r[0] === "Parámetro");
if (configHead < 0) throw new Error('Hoja Config: no encontré el encabezado "Parámetro".');
const param = (label) => config.find((r) => typeof r[0] === "string" && r[0].startsWith(label))?.[1] ?? null;
function list(title) {
  const col = config[configHead].indexOf(title);
  const values = [];
  for (const row of config.slice(configHead + 1)) {
    if (col < 0 || row[col] == null) break; // la lista termina en la primera celda vacía
    values.push(String(row[col]));
  }
  return values;
}
const settings = {
  business_name: param("Nombre del negocio"),
  analysis_year: param("Año de análisis"),
  opening_cash: param("Dinero en caja"),
  target_margin: param("Margen bruto objetivo"),
  payment_fee: param("Comisión de pagos"),
  vat: param("IVA a cobrar"),
  monthly_sales_goal: param("Meta de ventas mensual"),
  reactivation_days: param("Días sin comprar"),
  payment_methods: list("Métodos de pago"),
  sales_channels: list("Canales de venta"),
  expense_categories: list("Categorías de gasto"),
};

// ---------- Escritura en la base de datos (todo o nada) ----------

const warnings = [];
const db = await connect();
await db.query("begin");

try {
  const existing = await db.query("select count(*)::int as count from products");
  if (existing.rows[0].count > 0 && !reset) {
    throw new Error(
      "La base de datos ya tiene productos. Para borrar los datos del negocio y volver a importar: npm run db:import:reset",
    );
  }
  if (reset) {
    await db.query(
      "truncate products, purchases, customers, orders, order_items, expenses, owner_movements, settings restart identity",
    );
  }

  // Productos
  const products = new Map(); // sku -> { id, name, listPrice }
  const slugs = new Set();
  for (const r of productRows) {
    const sku = text(r["SKU (código único)"]);
    const name = required(text(r["Perfume"]), `Productos ${sku}: nombre`);
    const brand = text(r["Marca"]);
    let slug = slugify(`${brand ?? ""} ${name}`);
    if (slugs.has(slug)) slug += `-${sku.toLowerCase()}`;
    slugs.add(slug);
    const listPrice = int(r["Precio de lista"], `Productos ${sku}: precio de lista`) ?? 0;
    const inserted = await db.query(
      `insert into products
         (sku, slug, name, brand, audience, size_ml, initial_stock, initial_unit_cost, list_price, reorder_point)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id`,
      [
        sku,
        slug,
        name,
        brand,
        text(r["Público"]),
        int(r["Tamaño (ml)"], `Productos ${sku}: tamaño`),
        int(r["Stock inicial (und)"], `Productos ${sku}: stock inicial`) ?? 0,
        int(r["Costo unitario inicial"], `Productos ${sku}: costo inicial`) ?? 0,
        listPrice,
        int(r["Punto de reorden (und)"], `Productos ${sku}: punto de reorden`) ?? 0,
      ],
    );
    products.set(sku, { id: inserted.rows[0].id, name, listPrice });
  }

  function product(sku, sheet) {
    const found = products.get(text(sku));
    if (!found) throw new Error(`${sheet}: el SKU "${sku}" no existe en la hoja Productos.`);
    return found;
  }

  // Compras
  for (const r of purchaseRows) {
    const label = `Compras ${r["SKU"]}`;
    await db.query(
      `insert into purchases
         (purchased_on, supplier, product_id, quantity, unit_cost, shipping_cost, payment_method, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        required(isoDate(r["Fecha"], `${label}: fecha`), `${label}: fecha`),
        text(r["Proveedor"]),
        product(r["SKU"], "Compras").id,
        required(int(r["Cantidad"], `${label}: cantidad`), `${label}: cantidad`),
        required(int(r["Costo unitario"], `${label}: costo unitario`), `${label}: costo unitario`),
        int(r["Envío / flete de esta compra"], `${label}: flete`) ?? 0,
        text(r["Método de pago"]),
        text(r["Notas / Nº de factura"]),
      ],
    );
  }

  // Clientes (el Excel los relaciona por nombre; aquí pasan a tener un id)
  const customers = new Map(); // nombre en minúsculas -> id
  async function addCustomer(name, r = {}) {
    const inserted = await db.query(
      "insert into customers (name, phone, source, birthday, notes) values ($1, $2, $3, $4, $5) returning id",
      [
        name,
        text(r["WhatsApp / teléfono"]),
        text(r["¿Cómo llegó?"]),
        isoDate(r["Cumpleaños"], `Clientes ${name}: cumpleaños`),
        text(r["Gustos / notas"]),
      ],
    );
    customers.set(name.toLowerCase(), inserted.rows[0].id);
    return inserted.rows[0].id;
  }
  for (const r of customerRows) await addCustomer(text(r["Cliente"]), r);

  // Ventas: cada fila del Excel es un pedido con una sola línea.
  const customersFromSales = [];
  for (const r of saleRows) {
    const p = product(r["SKU"], "Ventas");
    const label = `Ventas ${r["SKU"]}`;
    const date = required(isoDate(r["Fecha"], `${label}: fecha`), `${label}: fecha`);

    const customerName = text(r["Cliente"]);
    let customerId = null;
    if (customerName) {
      customerId = customers.get(customerName.toLowerCase());
      if (!customerId) {
        customerId = await addCustomer(customerName);
        customersFromSales.push(customerName);
      }
    }

    // Igual que la columna "Fecha ingreso a caja": solo si ¿Pagado? = Sí.
    const paidOn = text(r["¿Pagado?"]) === "Sí" ? (isoDate(r["Fecha de pago (si fue después)"], `${label}: fecha de pago`) ?? date) : null;

    // El Excel no registra el estado del envío: una venta anotada se importa como entregada.
    const order = await db.query(
      `insert into orders (customer_id, ordered_on, status, channel, payment_method, paid_on)
       values ($1, $2, 'delivered', $3, $4, $5)
       returning id`,
      [customerId, date, text(r["Canal"]), text(r["Método de pago"]), paidOn],
    );
    const stats = await db.query("select avg_cost from product_stats where product_id = $1", [p.id]);
    await db.query(
      `insert into order_items (order_id, product_id, product_name, quantity, unit_price, discount, unit_cost)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        order.rows[0].id,
        p.id,
        p.name,
        required(int(r["Cantidad"], `${label}: cantidad`), `${label}: cantidad`),
        int(r["Precio unit. (vacío = precio de lista)"], `${label}: precio`) ?? p.listPrice,
        int(r["Descuento total ($)"], `${label}: descuento`) ?? 0,
        stats.rows[0].avg_cost,
      ],
    );
  }

  // Gastos
  let expenses = 0;
  for (const r of expenseRows) {
    const date = isoDate(r["Fecha"], "Gastos: fecha");
    if (!date) {
      warnings.push(`Gasto de ${r["Valor"]} sin fecha: no se importó.`);
      continue;
    }
    await db.query(
      "insert into expenses (spent_on, category, description, amount, kind, payment_method) values ($1, $2, $3, $4, $5, $6)",
      [date, text(r["Categoría"]), text(r["Descripción"]), int(r["Valor"], "Gastos: valor"), text(r["Tipo (Fijo / Variable)"]), text(r["Método de pago"])],
    );
    expenses++;
  }

  // Aportes y retiros
  let movements = 0;
  for (const r of movementRows) {
    const date = isoDate(r["Fecha"], "Aportes_Retiros: fecha");
    if (!date) {
      warnings.push(`Aporte/retiro de ${r["Valor"]} sin fecha: no se importó.`);
      continue;
    }
    await db.query(
      "insert into owner_movements (moved_on, kind, concept, amount, method) values ($1, $2, $3, $4, $5)",
      [date, text(r["Tipo (Aporte / Retiro)"]), text(r["Concepto"]), int(r["Valor"], "Aportes_Retiros: valor"), text(r["Método"])],
    );
    movements++;
  }

  // Config
  const savedSettings = Object.entries(settings).filter(([, value]) => value != null);
  for (const [key, value] of savedSettings) {
    await db.query("insert into settings (key, value) values ($1, $2::jsonb)", [key, JSON.stringify(value)]);
  }

  // ---------- Comprobación contra los valores que calculó el Excel ----------

  const problems = [];
  const stats = await db.query(
    "select p.sku, s.stock, s.avg_cost from products p join product_stats s on s.product_id = p.id",
  );
  const statsBySku = new Map(stats.rows.map((s) => [s.sku, s]));
  for (const r of productRows) {
    const sku = text(r["SKU (código único)"]);
    const ours = statsBySku.get(sku);
    const stock = int(r["Stock actual"], sku);
    const cost = int(r["Costo promedio (CPP)"], sku);
    if (stock != null && ours.stock !== stock) problems.push(`${sku}: stock ${ours.stock} aquí, ${stock} en el Excel`);
    if (cost != null && ours.avg_cost !== cost) problems.push(`${sku}: costo promedio ${ours.avg_cost} aquí, ${cost} en el Excel`);
  }
  const totals = await db.query(
    `select coalesce(sum(total), 0)::int as sales,
            coalesce(sum(quantity * unit_cost), 0)::int as cost,
            coalesce(sum(quantity), 0)::int as units
     from order_items`,
  );
  const { sales, cost, units } = totals.rows[0];
  const excelSales = Math.round(sum(saleRows, "Total venta"));
  const excelCost = sum(saleRows, "Costo total");
  if (sales !== excelSales) problems.push(`Ventas: total ${sales} aquí, ${excelSales} en el Excel`);
  // Aquí el costo promedio se redondea al peso: se tolera hasta 1 peso por unidad vendida.
  if (Math.abs(cost - excelCost) > units) problems.push(`Ventas: costo ${cost} aquí, ${excelCost} en el Excel`);

  if (problems.length) {
    throw new Error("Los cálculos no coinciden con el Excel, no se guardó nada:\n  " + problems.join("\n  "));
  }

  await db.query("commit");

  // ---------- Resumen ----------

  // Valores usados en el Excel que no están en las listas de Config.
  function notInList(what, rows, column, allowed) {
    const odd = [...new Set(rows.map((r) => text(r[column])).filter((v) => v && !allowed.includes(v)))];
    if (odd.length) warnings.push(`${what} que no están en la lista de Config: ${odd.map((v) => `"${v}"`).join(", ")}`);
  }
  notInList("Compras usa métodos de pago", purchaseRows, "Método de pago", settings.payment_methods);
  notInList("Ventas usa métodos de pago", saleRows, "Método de pago", settings.payment_methods);
  notInList("Ventas usa canales", saleRows, "Canal", settings.sales_channels);
  notInList("Gastos usa categorías", expenseRows, "Categoría", settings.expense_categories);
  if (customersFromSales.length) {
    warnings.push(`Clientes creados desde Ventas (no estaban en la hoja Clientes): ${customersFromSales.join(", ")}`);
  }

  console.log(`Importado desde ${file}${reset ? " (se borraron los datos anteriores)" : ""}`);
  console.log(`  Productos          ${products.size}`);
  console.log(`  Compras            ${purchaseRows.length}`);
  console.log(`  Clientes           ${customers.size}`);
  console.log(`  Ventas             ${saleRows.length}`);
  console.log(`  Gastos             ${expenses}`);
  console.log(`  Aportes y retiros  ${movements}`);
  console.log(`  Ajustes de Config  ${savedSettings.length}`);
  console.log("Comprobación: stock, costo promedio y totales de ventas coinciden con el Excel.");
  if (warnings.length) console.log("Avisos:\n  - " + warnings.join("\n  - "));
} catch (error) {
  await db.query("rollback");
  console.error("No se importó nada.\n" + error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
