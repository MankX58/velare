// Esqueleto del catálogo mientras cargan los productos: misma rejilla, cajas vacías.
export default function CatalogLoading() {
  return (
    <main aria-busy="true" aria-label="Cargando el catálogo" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <div className="motion-safe:animate-skeleton">
        <div className="mb-8 h-14 w-56 bg-mist" />
        <div className="mb-6 h-11 bg-mist" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] bg-mist" />
              <div className="mt-3 h-4 bg-mist" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
