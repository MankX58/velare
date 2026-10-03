// Dirección pública de la tienda, sin barra al final. Sale de APP_BASE_URL:
// http://localhost:3000 en desarrollo y https://<proyecto>.vercel.app en producción.
// La usan el mapa del sitio, robots.txt y los datos que leen los buscadores.
export const siteUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Convierte una ruta ("/producto/x") o la dirección de una foto en una dirección completa.
export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${siteUrl}${path}`);
