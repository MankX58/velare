-- Fase 5: caja. Equivale a la hoja "Caja" del Excel.
--
-- Cada fila es dinero que de verdad entró (valor positivo) o salió (valor negativo).
-- Una venta entra a caja el día en que se cobra (paid_on) e incluye el envío que pagó
-- el cliente; una venta fiada no aparece aquí hasta que se marca como cobrada.
create view cash_movements as
  select o.paid_on as moved_on,
         'Venta cobrada' as kind,
         ((select coalesce(sum(total), 0) from order_items where order_id = o.id) + o.shipping_fee)::int as amount,
         concat_ws(', ', o.code, coalesce(o.shipping_name, c.name)) as description,
         o.payment_method as method,
         o.id as source_id
  from orders o
  left join customers c on c.id = o.customer_id
  where o.paid_on is not null and o.status not in ('pending', 'payment_reported', 'cancelled')
union all
  select moved_on, 'Aporte', amount, concept, method, id
  from owner_movements
  where kind = 'Aporte'
union all
  select pu.purchased_on, 'Compra', -pu.total_cost, concat_ws(', ', p.name, pu.supplier), pu.payment_method, pu.id
  from purchases pu
  join products p on p.id = pu.product_id
union all
  select spent_on, 'Gasto', -amount, concat_ws(': ', category, description), payment_method, id
  from expenses
union all
  select moved_on, 'Retiro', -amount, concept, method, id
  from owner_movements
  where kind = 'Retiro';
