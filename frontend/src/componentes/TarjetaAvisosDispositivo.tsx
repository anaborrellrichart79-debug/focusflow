import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarSelector } from '@/almacen/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorApi } from '@/servicios/api';
import {
  activarPush,
  desactivarPush,
  enviarPruebaPush,
  obtenerEstadoPush,
  type EstadoPush,
} from '@/servicios/push';

const MENSAJE_ESTADO: Partial<Record<EstadoPush, string>> = {
  'no-soportado': 'ajustes.push.noSoportado',
  'no-configurado': 'ajustes.push.noConfigurado',
  bloqueado: 'ajustes.push.bloqueado',
  activo: 'ajustes.push.activo',
};

// Web Push: los avisos llegan como notificación del sistema aunque FocusFlow
// esté cerrado. Se activa en cada navegador o móvil por separado.
export function TarjetaAvisosDispositivo() {
  const intl = useIntl();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerEstadoPush(token)
      .then(setEstado)
      .catch(() => setEstado('no-configurado'));
  }, [token]);

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true);
    setMensaje(null);
    try {
      await accion();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof ErrorApi ? error.message : intl.formatMessage({ id: 'ajustes.push.error' }),
      });
    } finally {
      setOcupado(false);
    }
  }

  const activar = () =>
    ejecutar(async () => {
      setEstado(await activarPush(token!));
    });

  const desactivar = () =>
    ejecutar(async () => {
      await desactivarPush(token);
      setEstado('inactivo');
    });

  const probar = () =>
    ejecutar(async () => {
      await enviarPruebaPush(token!);
      setMensaje({ tipo: 'ok', texto: intl.formatMessage({ id: 'ajustes.push.pruebaEnviada' }) });
    });

  const claveEstado = estado ? MENSAJE_ESTADO[estado] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{intl.formatMessage({ id: 'ajustes.push.titulo' })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'ajustes.push.descripcion' })}</p>

        {claveEstado && (
          <p
            role="status"
            className={estado === 'activo' ? 'text-sm font-medium text-exito' : 'text-sm text-muted-foreground'}
          >
            {intl.formatMessage({ id: claveEstado })}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {estado === 'inactivo' && (
            <Button onClick={activar} disabled={ocupado}>
              {intl.formatMessage({ id: 'ajustes.push.activar' })}
            </Button>
          )}
          {estado === 'activo' && (
            <>
              <Button variant="outline" onClick={probar} disabled={ocupado}>
                {intl.formatMessage({ id: 'ajustes.push.probar' })}
              </Button>
              <Button variant="ghost" onClick={desactivar} disabled={ocupado}>
                {intl.formatMessage({ id: 'ajustes.push.desactivar' })}
              </Button>
            </>
          )}
        </div>

        {mensaje && (
          <p
            role={mensaje.tipo === 'error' ? 'alert' : 'status'}
            className={mensaje.tipo === 'error' ? 'text-sm text-destructive' : 'text-sm text-primary'}
          >
            {mensaje.texto}
          </p>
        )}

        <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'ajustes.push.instalar' })}</p>
      </CardContent>
    </Card>
  );
}
