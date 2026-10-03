import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de producto que se suben desde el panel viven en Vercel Blob.
    // Solo se aceptan imágenes de ese almacenamiento, de ningún otro sitio.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },

  experimental: {
    // Subir una foto pasa por una acción del servidor, que por defecto acepta hasta 1 MB.
    // La foto llega ya reducida por el navegador (unos 300 KB); 2 MB deja margen de sobra.
    serverActions: { bodySizeLimit: "2mb" },
  },

  // Cabeceras de seguridad para todas las páginas.
  // ponytail: no incluye una política de contenido (CSP). Añadirla si algún día se cargan
  // scripts de terceros (analítica, chat); hoy la app no carga ninguno.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" }, // el navegador no adivina tipos de archivo
          { key: "X-Frame-Options", value: "DENY" }, // nadie puede mostrar la tienda o el panel dentro de otra página
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
