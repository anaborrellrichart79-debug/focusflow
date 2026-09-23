import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cerrarSesion, restaurarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorApi } from '@/servicios/api';
import { reenviarConfirmacion } from '@/servicios/autenticacion';
import { SelectorIdioma } from './SelectorIdioma';
import { SelectorTema } from './SelectorTema';

type EstadoReenvio =
  | { tipo: 'inactivo' }
  | { tipo: 'enviando' }
  | { tipo: 'enviado' }
  | { tipo: 'error'; mensaje: string };

export function PantallaConsentimientoPendiente() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tokenAcceso = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [reenvio, setReenvio] = useState<EstadoReenvio>({ tipo: 'inactivo' });
  const [comprobando, setComprobando] = useState(false);

  async function alReenviar() {
    if (!tokenAcceso) return;
    setReenvio({ tipo: 'enviando' });
    try {
      await reenviarConfirmacion(tokenAcceso);
      setReenvio({ tipo: 'enviado' });
    } catch (error) {
      setReenvio({
        tipo: 'error',
        mensaje:
          error instanceof ErrorApi
            ? error.message
            : intl.formatMessage({ id: 'consentimiento.pendiente.errorReenvio' }),
      });
    }
  }

  // Vuelve a pedir el perfil: si el tutor ya ha confirmado, llega con
  // consentimientoConfirmado a true y DisenoAplicacion deja pasar solo.
  async function alComprobar() {
    setComprobando(true);
    await despachar(restaurarSesion());
    setComprobando(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex justify-end gap-3">
        <SelectorTema />
        <SelectorIdioma />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'consentimiento.pendiente.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'consentimiento.pendiente.explicacion' })}
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={alComprobar} disabled={comprobando}>
              {intl.formatMessage({ id: 'consentimiento.pendiente.comprobar' })}
            </Button>
            <Button variant="outline" onClick={alReenviar} disabled={reenvio.tipo === 'enviando'}>
              {intl.formatMessage({ id: 'consentimiento.pendiente.reenviar' })}
            </Button>
            <Button variant="ghost" onClick={() => despachar(cerrarSesion())}>
              {intl.formatMessage({ id: 'auth.cerrarSesion' })}
            </Button>
          </div>
          {reenvio.tipo === 'enviado' && (
            <p role="status" className="text-sm text-primary">
              {intl.formatMessage({ id: 'consentimiento.pendiente.reenviado' })}
            </p>
          )}
          {reenvio.tipo === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {reenvio.mensaje}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
