// Reduce una foto en el navegador antes de subirla.
//
// Una foto tomada con el teléfono pesa varios megas y trae datos ocultos, como el lugar
// donde se tomó. Aquí se redibuja a un máximo de 1400 px de lado y se guarda como JPEG:
// queda en unos 300 KB y sin esos datos. Si el archivo no es una imagen que el navegador
// entienda (por ejemplo, un HEIC en Chrome), la función falla y quien la llama avisa.
export async function shrinkImage(file: File, maxSide = 1400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo preparar la imagen.");
  // JPEG no tiene transparencia: un PNG recortado quedaría con fondo negro sin este blanco.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo convertir la imagen."))), "image/jpeg", 0.82);
  });
}
