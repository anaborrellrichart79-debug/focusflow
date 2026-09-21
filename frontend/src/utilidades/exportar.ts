function escaparCampoCsv(valor: string): string {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function construirFilaCsv(campos: (string | number)[]): string {
  return campos.map((campo) => escaparCampoCsv(String(campo))).join(',');
}

// El BOM inicial (U+FEFF, construido con fromCharCode para no dejar el
// carácter invisible suelto en el propio código fuente) es necesario para
// que Excel abra el CSV como UTF-8 y no rompa los acentos/eñes.
export function descargarCsv(filas: string[], nombreArchivo: string) {
  const contenido = String.fromCharCode(0xfeff) + filas.join('\r\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
