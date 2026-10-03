// Esqueleto que se ve mientras cargan "Mis pedidos" o un pedido: un título y unas filas.
// Las páginas públicas (inicio, producto) no tienen esqueleto a propósito: así, si la
// dirección no existe, el servidor puede responder con un 404 de verdad.
export default function OrdersLoading() {
  return (
    <main aria-busy="true" aria-label="Cargando" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <div className="motion-safe:animate-skeleton">
        <div className="mb-10 h-14 w-64 max-w-full bg-mist" />
        <div className="space-y-4">
          <div className="h-16 bg-mist" />
          <div className="h-16 bg-mist" />
          <div className="h-16 bg-mist" />
        </div>
      </div>
    </main>
  );
}
