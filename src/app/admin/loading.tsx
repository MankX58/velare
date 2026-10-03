// Esqueleto que se muestra mientras cargan los datos del panel. Imita la forma de la tabla.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="motion-safe:animate-skeleton">
      <div className="mb-6 h-9 w-44 bg-mist" />
      <div className="divide-y divide-line border border-line bg-surface">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-6 px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-mist" />
              <div className="h-3 w-64 max-w-full bg-mist" />
            </div>
            <div className="h-4 w-20 bg-mist" />
          </div>
        ))}
      </div>
    </div>
  );
}
