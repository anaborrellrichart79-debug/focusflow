import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { salir, restaurarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorApi } from '@/servicios/api';
import { reenviarConfirmacion } from '@/servicios/autenticacion';
import { generarCodigoVinculo } from '@/servicios/familia';
import { SelectorIdioma } from './SelectorIdioma';
import { SelectorTema } from './SelectorTema';

type EstadoReenvio =
  | { tipo: 'inactivo' }
  | { tipo: 'enviando' }
  | { tipo: 'enviado' }
  | { tipo: 'error'; mensaje: string };

type EstadoCodigo =
  | { tipo: 'inactivo' }
  | { tipo: 'generando' }
  | { tipo: 'generado'; codigo: string; expiraEn: string }
  | { tipo: 'error'; mensaje: string };

export function PantallaConsentimientoPendiente() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const tokenAcceso = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [reenvio, setReenvio] = useState<EstadoReenvio>({ tipo: 'inactivo' });
  const [comprobando, setComprobando] = useState(false);
  const [codigo, setCodigo] = useState<EstadoCodigo>({ tipo: 'inactivo' });

  // Segunda vía de confirmación, sin correo: si el padre o la madre introduce
  // este código en su página Familia, el vínculo confirma la cuenta.
  async function alGenerarCodigo() {
    if (!tokenAcceso) return;
    setCodigo({ tipo: 'generando' });
    try {
      const generado = await generarCodigoVinculo(tokenAcceso);
      setCodigo({ tipo: 'generado', ...generado });
    } catch (error) {
      setCodigo({
        tipo: 'error',
        mensaje:
          error instanceof ErrorApi
            ? error.message
            : intl.formatMessage({ id: 'consentimiento.pendiente.errorCodigo' }),
      });
    }
  }

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
            <Button variant="ghost" onClick={() => despachar(salir())}>
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
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
            <p className="text-sm">{intl.formatMessage({ id: 'consentimiento.pendiente.viaFamilia' })}</p>
            {codigo.tipo === 'generado' && (
              <p className="flex flex-wrap items-baseline gap-3">
                <span
                  className="font-mono text-2xl font-semibold tracking-[0.3em]"
                  aria-label={intl.formatMessage({ id: 'familia.codigo.etiqueta' })}
                >
                  {codigo.codigo}
                </span>
                <span className="text-xs text-muted-foreground">
                  {intl.formatMessage(
                    { id: 'familia.codigo.caduca' },
                    { fecha: intl.formatDate(codigo.expiraEn, { dateStyle: 'medium', timeStyle: 'short' }) },
                  )}
                </span>
              </p>
            )}
            {codigo.tipo === 'error' && (
              <p role="alert" className="text-sm text-destructive">
                {codigo.mensaje}
              </p>
            )}
            <Button
              variant="outline"
              className="self-start"
              onClick={alGenerarCodigo}
              disabled={codigo.tipo === 'generando'}
            >
              {intl.formatMessage({
                id: codigo.tipo === 'generado' ? 'familia.codigo.otro' : 'consentimiento.pendiente.generarCodigo',
              })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
