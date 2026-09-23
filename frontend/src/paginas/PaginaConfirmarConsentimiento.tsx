import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorApi } from '@/servicios/api';
import { confirmarConsentimiento } from '@/servicios/autenticacion';

type Estado = { tipo: 'confirmando' } | { tipo: 'confirmado' } | { tipo: 'error'; mensaje: string };

// Página pública a la que lleva el enlace del correo que recibe el tutor. No
// necesita sesión: el propio token del enlace identifica la cuenta del menor.
export function PaginaConfirmarConsentimiento() {
  const intl = useIntl();
  const [parametros] = useSearchParams();
  const token = parametros.get('token');
  const [estado, setEstado] = useState<Estado>(() =>
    token
      ? { tipo: 'confirmando' }
      : { tipo: 'error', mensaje: intl.formatMessage({ id: 'consentimiento.confirmar.sinToken' }) },
  );

  useEffect(() => {
    if (!token) return;
    // Confirmar dos veces no hace daño (solo pone el campo a true), así que el
    // doble montaje de StrictMode en desarrollo no es un problema.
    confirmarConsentimiento(token)
      .then(() => setEstado({ tipo: 'confirmado' }))
      .catch((error) =>
        setEstado({
          tipo: 'error',
          mensaje:
            error instanceof ErrorApi
              ? error.message
              : intl.formatMessage({ id: 'consentimiento.confirmar.error' }),
        }),
      );
  }, [token, intl]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage({ id: 'consentimiento.confirmar.titulo' })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {estado.tipo === 'confirmando' && (
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'consentimiento.confirmar.confirmando' })}
            </p>
          )}
          {estado.tipo === 'confirmado' && (
            <p role="status" className="text-sm">
              {intl.formatMessage({ id: 'consentimiento.confirmar.exito' })}
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
