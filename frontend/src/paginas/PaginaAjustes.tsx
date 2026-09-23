import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import {
  cargarEstadoGoogle,
  conectarConGoogle,
  desconectarGoogle,
  sincronizarGoogle,
} from '@/almacen/googleSlice';
import { cambiarModoEscolar } from '@/almacen/sesionSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export function PaginaAjustes() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const [parametros] = useSearchParams();
  const { conectado, ultimaSincronizacion, sincronizando, ultimoResumen, error } = usarSelector(
    (estado) => estado.google,
  );

  const modoEscolarActivo = usarSelector(
    (estado) => estado.sesion.usuario?.modoEscolarActivo ?? false,
  );
  const [guardandoModoEscolar, setGuardandoModoEscolar] = useState(false);
  const [errorModoEscolar, setErrorModoEscolar] = useState<string | null>(null);

  useEffect(() => {
    despachar(cargarEstadoGoogle());
  }, [despachar]);

  const resultadoCallback = parametros.get('google');

  async function manejarConectar() {
    const resultado = await despachar(conectarConGoogle());
    if (conectarConGoogle.fulfilled.match(resultado)) {
      window.location.href = resultado.payload;
    }
  }

  async function alCambiarModoEscolar(activo: boolean) {
    setGuardandoModoEscolar(true);
    setErrorModoEscolar(null);
    const resultado = await despachar(cambiarModoEscolar(activo));
    if (cambiarModoEscolar.rejected.match(resultado)) {
      setErrorModoEscolar(resultado.payload ?? null);
    }
    setGuardandoModoEscolar(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'ajustes.titulo' })}
        </h1>
      </div>

      {resultadoCallback === 'conectado' && (
        <p className="rounded-md border border-exito/30 bg-exito/10 px-4 py-2 text-sm text-exito">
          {intl.formatMessage({ id: 'ajustes.google.conectadoOk' })}
        </p>
      )}
      {resultadoCallback === 'error' && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {intl.formatMessage({ id: 'ajustes.google.errorConexion' })}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'ajustes.modoEscolar.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'ajustes.modoEscolar.descripcion' })}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={modoEscolarActivo}
              disabled={guardandoModoEscolar}
              onCheckedChange={(marcada) => alCambiarModoEscolar(marcada === true)}
            />
            {intl.formatMessage({ id: 'ajustes.modoEscolar.activar' })}
          </label>
          {errorModoEscolar && <p className="text-sm text-destructive">{errorModoEscolar}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{intl.formatMessage({ id: 'ajustes.google.titulo' })}</CardTitle>
            <Badge variant={conectado ? 'default' : 'outline'}>
              {intl.formatMessage({
                id: conectado ? 'ajustes.google.conectado' : 'ajustes.google.noConectado',
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'ajustes.google.descripcion' })}
          </p>

          <p className="text-sm text-muted-foreground">
            {intl.formatMessage(
              { id: 'ajustes.google.ultimaSincronizacion' },
              {
                fecha: ultimaSincronizacion
                  ? intl.formatDate(ultimaSincronizacion, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : intl.formatMessage({ id: 'ajustes.google.nunca' }),
              },
            )}
          </p>

          {conectado && (
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage({ id: 'ajustes.google.autoSyncInfo' })}
            </p>
          )}

          {ultimoResumen && (
            <p className="text-sm">
              {intl.formatMessage(
                { id: 'ajustes.google.resumen' },
                {
                  creados: ultimoResumen.creados,
                  actualizados: ultimoResumen.actualizados,
                  eliminados: ultimoResumen.eliminados,
                  importados: ultimoResumen.importados,
                },
              )}
            </p>
          )}

          {ultimoResumen != null && ultimoResumen.errores > 0 && (
            <p className="text-sm text-motivador">
              {intl.formatMessage(
                { id: 'ajustes.google.errores' },
                { cantidad: ultimoResumen.errores },
              )}
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3">
            {conectado ? (
              <>
                <Button
                  onClick={() => despachar(sincronizarGoogle())}
                  disabled={sincronizando}
                >
                  {intl.formatMessage({
                    id: sincronizando
                      ? 'ajustes.google.sincronizando'
                      : 'ajustes.google.sincronizarAhora',
                  })}
                </Button>
                <Button variant="outline" onClick={() => despachar(desconectarGoogle())}>
                  {intl.formatMessage({ id: 'ajustes.google.desconectar' })}
                </Button>
              </>
            ) : (
              <Button onClick={manejarConectar}>
                {intl.formatMessage({ id: 'ajustes.google.conectar' })}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
