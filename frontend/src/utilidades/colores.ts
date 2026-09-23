// Luminancia relativa de WCAG 2.x para un color "#RRGGBB".
function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((inicio) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

function contraste(a: number, b: number) {
  const [clara, oscura] = a > b ? [a, b] : [b, a];
  return (clara + 0.05) / (oscura + 0.05);
}

// Texto negro o blanco, el que más contraste tenga sobre el fondo: así una
// asignatura amarilla se lee en negro y una azul oscura en blanco, sea cual
// sea el color que elija el usuario.
export function colorTextoSobre(fondo: string): '#000000' | '#ffffff' {
  const lumFondo = luminancia(fondo);
  return contraste(lumFondo, 0) >= contraste(lumFondo, 1) ? '#000000' : '#ffffff';
}
