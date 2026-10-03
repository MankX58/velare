-- Cotizaciones: alguien pregunta por un perfume que no está en el catálogo
-- y un administrador le responde con el precio.

create table quotes (
  id           integer generated always as identity primary key,
  user_id      integer not null references users (id),
  perfume      text not null,  -- lo que busca, con sus palabras
  details      text,           -- tamaño, versión o cualquier pista
  phone        text not null,  -- WhatsApp para avisarle
  -- La respuesta. Sin answered_at está pendiente; con answered_at y sin precio, no se consiguió.
  price        integer check (price > 0),
  answer       text,
  answered_at  timestamptz,
  answered_by  integer references users (id),
  created_at   timestamptz not null default now()
);

create index on quotes (user_id);
