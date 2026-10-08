-- Tamaños de presentación: un mismo perfume en 50 ml, 100 ml, 200 ml...
--
-- Cada tamaño es un producto completo, con su SKU, precio, stock y costo: así compras,
-- pedidos y cuentas siguen funcionando igual. Lo único nuevo es este enlace: los tamaños
-- que se agregan después apuntan al producto original con parent_id (el original lo
-- tiene vacío). El "grupo" de un producto es coalesce(parent_id, id).
alter table products add column parent_id integer references products (id);

create index on products (parent_id);
