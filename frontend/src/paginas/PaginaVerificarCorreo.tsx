import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useSearchParams } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { restaurarSesion } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorApi } from '@/servicios/api';
import { verificarCorreo } from '@/servicios/autenticacion';

type Estado = { tipo: 'verificando' } | { tipo: 'verificado' } | { tipo: 'error'; mensaje: string };

// Página pública a la que lleva el enlace del correo de verificación, igual
// que PaginaConfirmarConsentimiento: el token identifica la cuenta, así que
// funciona aunque se abra en un navegador sin sesión (p. ej. el del móvil).
export function PaginaVerificarCorreo() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const haySesion = usarSelector((estado) => estado.sesion.tokenAcceso !== null);
  const [parametros] = useSearchParams();
  const token = parametros.get('token');
  const [estado, setEstado] = useState<Estado>(() =>
    token
      ? { tipo: 'verificando' }
      : { tipo: 'error', mensaje: intl.formatMessage({ id: 'verificacion.pagina.sinToken' }) },
  );

  useEffect(() => {
    if (!token) return;
    // Verificar dos veces no hace daño, así que el doble montaje de
    // StrictMode en desarrollo no es un problema.
    verificarCorreo(token)
      .then(() => {
        setEstado({ tipo: 'verificado' });
        // Con sesión abierta en este navegador, refresca el perfil para que
        // desaparezca el aviso de "confirma tu correo".
        if (haySesion) void despachar(restaurarSesion());
      })
      .catch((error) =>
        setEstado({
          tipo: 'error',
          mensaje:
            error instanceof ErrorApi
              ? error.message
              : intl.formatMessage({ id: 'verificacion.pagina.error' }),
        }),
      );
  }, [token, intl, haySesion, despachar]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'verificacion.pagina.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {estado.tipo === 'verificando' && (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'verificacion.pagina.verificando' })}
            </p>
          )}
          {estado.tipo === 'verificado' && (
            <p role="status" className="text-sm">
              {intl.formatMessage({ id: 'verificacion.pagina.exito' })}
            </p>
          )}
          {estado.tipo === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              {estado.mensaje}
            </p>
          )}
          <Button asChild variant="outline">
            <Link to="/">{intl.formatMessage({ id: 'app.titulo' })}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
