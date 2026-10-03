// Pruebas de las cuentas de dinero. Se ejecutan con: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMoney, readForm } from "./form.ts";
import { purchaseEffect } from "./inventory.ts";

test("parseMoney acepta pesos con o sin puntos de miles", () => {
  assert.equal(parseMoney("215000"), 215000);
  assert.equal(parseMoney("215.000"), 215000);
  assert.equal(parseMoney("$ 1.215.000"), 1215000);
  assert.equal(parseMoney("0"), 0);
});

test("parseMoney rechaza decimales, negativos y texto", () => {
  // "215.5" NO debe leerse como 2155 ni como 215: es ambiguo y se rechaza.
  for (const bad of ["215.5", "215,50", "-100", "abc", "", "1.2.3", "9999999999"]) {
    assert.equal(parseMoney(bad), null, bad);
  }
});

test("readForm anota los errores por campo", () => {
  const data = new FormData();
  data.set("price", "12,5");
  data.set("quantity", "0");
  const form = readForm(data);
  assert.equal(form.money("price", { required: true }), null);
  assert.equal(form.integer("quantity", { min: 1 }), null);
  assert.equal(form.text("name", { required: true }), null);
  assert.deepEqual(Object.keys(form.errors).sort(), ["name", "price", "quantity"]);
});

test("purchaseEffect da los mismos valores que el Excel", () => {
  // Compra real P001: 1 unidad a $112.809 con $64.335 de flete, sin stock previo.
  const empty = { stock: 0, unitsIn: 0, costBasis: 0, avgCost: 141382 };
  assert.deepEqual(purchaseEffect(empty, 1, 112809, 64335), {
    totalCost: 177144,
    realUnitCost: 177144,
    newStock: 1,
    newAvgCost: 177144,
  });
  // Una segunda unidad más barata baja el promedio.
  const after = { stock: 0, unitsIn: 1, costBasis: 177144, avgCost: 177144 };
  assert.equal(purchaseEffect(after, 1, 150000, 0).newAvgCost, 163572);
});
