// El símbolo de Velare: una V clara sobre el verde salvia de la marca, de esquinas rectas.
// Solo se usa para generar imágenes (icono de la pestaña, icono del teléfono, vista previa
// al compartir), por eso lleva estilos en línea y colores fijos en lugar de clases de Tailwind.
// `size` es el lado de la V en píxeles; el fondo llena todo el espacio disponible.
export function LogoMark({ size }: { size: number }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#596357" }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M11 12 L24 38 L37 12" stroke="#f6f8f5" strokeWidth="3.5" />
      </svg>
    </div>
  );
}
