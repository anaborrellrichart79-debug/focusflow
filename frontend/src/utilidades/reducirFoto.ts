// Las fotos del móvil pesan varios MB y tienen más resolución de la que hace
// falta para leer un horario: se reducen a como mucho LADO_MAXIMO píxeles por
// lado y se pasan a JPEG antes de subirlas (más rápido, y por debajo del
// límite de 5 MB de la IA). Si el navegador no puede, se sube tal cual.
const LADO_MAXIMO = 2000;
const CALIDAD = 0.85;

export async function reducirFoto(foto: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(foto);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    const contexto = lienzo.getContext('2d');
    if (!contexto) return foto;
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const reducida = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD));
    return reducida ?? foto;
  } catch {
    return foto;
  }
}
