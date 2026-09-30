import { useState, type FormEvent } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { salir } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ErrorApi } from '@/servicios/api';
import { eliminarCuenta } from '@/servicios/autenticacion';

// Derecho a borrar los datos (RGPD): al final de Ajustes. Hay que pulsar dos
// veces y repetir la contraseña, así no se borra nada por error.
export function TarjetaEliminarCuenta() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [confirmando, setConfirmando] = useState(false);
  const [contrasena, setContrasena] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alEliminar(evento: FormEvent) {
    evento.preventDefault();
    if (!token || !contrasena) return;
    setEliminando(true);
    setError(null);
    try {
      await eliminarCuenta(token, contrasena);
      // Como "Cerrar sesión": al quedarse sin sesión, la app vuelve a la portada.
      despachar(salir());
    } catch (causa) {
      setError(causa instanceof ErrorApi ? causa.message : intl.formatMessage({ id: 'ajustes.eliminar.error' }));
      setEliminando(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{intl.formatMessage({ id: 'ajustes.eliminar.titulo' })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">{intl.formatMessage({ id: 'ajustes.eliminar.explicacion' })}</p>
        {!confirmando ? (
          <div>
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmando(true)}>
              {intl.formatMessage({ id: 'ajustes.eliminar.boton' })}
            </Button>
          </div>
        ) : (
          <form onSubmit={alEliminar} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              {intl.formatMessage({ id: 'ajustes.eliminar.contrasena' })}
              <Input
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                className="max-w-xs"
              />
            </label>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="destructive" disabled={!contrasena || eliminando}>
                {intl.formatMessage({ id: 'ajustes.eliminar.confirmar' })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmando(false);
                  setContrasena('');
                  setError(null);
                }}
                disabled={eliminando}
              >
                {intl.formatMessage({ id: 'ajustes.eliminar.cancelar' })}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
