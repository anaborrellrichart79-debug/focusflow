import { useState } from 'react';
import { useIntl } from 'react-intl';
import { conectarConGoogle } from '@/almacen/googleSlice';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { ErrorApi } from '@/servicios/api';
import { importarClassroom, type ResumenClassroom } from '@/servicios/google';

// Dentro de la tarjeta de Google en Ajustes: conectar Classroom (permisos de
// solo lectura, que se suman a los de Calendar) e importar como tareas
// escolares los trabajos pendientes de entregar.
export function SeccionClassroom() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const token = usarSelector((estado) => estado.sesion.tokenAcceso);
  const conectado = usarSelector((estado) => estado.google.classroom);
  const [importando, setImportando] = useState(false);
  const [resumen, setResumen] = useState<ResumenClassroom | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function conectar() {
    const resultado = await despachar(conectarConGoogle({ classroom: true }));
    if (conectarConGoogle.fulfilled.match(resultado)) window.location.href = resultado.payload;
  }

  async function importar() {
    if (!token) return;
    setImportando(true);
    setError(null);
    setResumen(null);
    try {
      setResumen(await importarClassroom(token));
      despachar(cargarTareas());
    } catch (causa) {
      setError(causa instanceof ErrorApi ? causa.message : intl.formatMessage({ id: 'classroom.error' }));
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="text-sm font-medium">{intl.formatMessage({ id: 'classroom.titulo' })}</p>
      <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'classroom.descripcion' })}</p>

      {conectado ? (
        <Button className="self-start" onClick={importar} disabled={importando}>
          {intl.formatMessage({ id: importando ? 'classroom.importando' : 'classroom.importar' })}
        </Button>
      ) : (
        <>
          <Button variant="outline" className="self-start" onClick={conectar}>
            {intl.formatMessage({ id: 'classroom.conectar' })}
          </Button>
          <p className="text-xs text-muted-foreground">{intl.formatMessage({ id: 'classroom.aviso' })}</p>
        </>
      )}

      {resumen && (
        <p role="status" className="text-sm text-primary">
          {intl.formatMessage({ id: 'classroom.resumen' }, { ...resumen })}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
