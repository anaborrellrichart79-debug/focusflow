// Le dice a Google que retire el permiso concedido a FocusFlow (al
// desconectar o al eliminar la cuenta): así deja de verse en las apps con
// acceso de la cuenta de Google y, al volver a conectar, Google vuelve a
// enseñar qué permisos se piden. Si Google no responde, se sigue igual: las
// claves se borran de todos modos.
export async function revocarPermisoGoogle(token: string) {
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.warn('No se pudo retirar el permiso de Google');
  }
}
