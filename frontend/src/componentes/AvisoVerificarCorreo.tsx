import { MailWarning } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { restaurarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { ErrorApi } from '@/servicios/api';
import { reenviarVerificacion } from '@/servicios/autenticacion';

type EstadoReenvio =
  | { tipo: 'inactivo' }
  | { tipo: 'enviando' }
  | { tipo: 'enviado' }
  | { tipo: 'error'; mensaje: string };

// Franja encima de cada página mientras el correo de la cuenta no esté
// verificado. No bloquea nada: solo recuerda que falta y permite reenviar
// el enlace. Sin verificar, el servidor no manda correos de avisos.
export function AvisoVerificarCorreo() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const tokenAcceso = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [reenvio, setReenvio] = useState<EstadoReenvio>({ tipo: 'inactivo' });
  const [comprobando, setComprobando] = useState(false);

  if (!usuario || usuario.correoVerificado !== false) return null;

  async function alReenviar() {
    if (!tokenAcceso) return;
    setReenvio({ tipo: 'enviando' });
    try {
      await reenviarVerificacion(tokenAcceso);
      setReenvio({ tipo: 'enviado' });
    } catch (error) {
      setReenvio({
        tipo: 'error',
        mensaje:
          error instanceof ErrorApi
            ? error.message
            : intl.formatMessage({ id: 'verificacion.aviso.errorReenvio' }),
      });
    }
  }

  // Vuelve a pedir el perfil: si ya se ha pulsado el enlace (quizá en otro
  // dispositivo), llega con correoVerificado a true y la franja desaparece.
  async function alComprobar() {
    setComprobando(true);
    await despachar(restaurarSesion());
    setComprobando(false);
  }

  return (
    <div
      role="region"
      aria-label={intl.formatMessage({ id: 'verificacion.pagina.titulo' })}
      className="flex flex-col gap-2 border-b border-border bg-muted/60 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2">
        <MailWarning aria-hidden className="size-4 shrink-0 text-primary" />
        <span>
          {intl.formatMessage({ id: 'verificacion.aviso.texto' }, { correo: usuario.correo })}
          {reenvio.tipo === 'enviado' && (
            <span role="status" className="ml-1 text-muted-foreground">
              {intl.formatMessage({ id: 'verificacion.aviso.reenviado' })}
            </span>
          )}
          {reenvio.tipo === 'error' && (
            <span role="alert" className="ml-1 text-destructive">
              {reenvio.mensaje}
            </span>
          )}
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" disabled={comprobando} onClick={alComprobar}>
          {intl.formatMessage({ id: 'verificacion.aviso.comprobar' })}
        </Button>
        <Button
          size="sm"
          disabled={reenvio.tipo === 'enviando' || reenvio.tipo === 'enviado'}
          onClick={alReenviar}
        >
          {intl.formatMessage({ id: 'verificacion.aviso.reenviar' })}
        </Button>
      </div>
    </div>
  );
}
