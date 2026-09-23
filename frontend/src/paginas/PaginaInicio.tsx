import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { seleccionarTareasDelAmbito } from '@/almacen/selectores';
import { cargarTareas } from '@/almacen/tareasSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EtiquetaFechaLimite } from '@/componentes/EtiquetaFechaLimite';
import { SelectorIdioma } from '@/componentes/SelectorIdioma';
import { SelectorTema } from '@/componentes/SelectorTema';
import { diasHastaFecha } from '@/utilidades/fechas';

export function PaginaInicio() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { usuario } = usarSelector((estado) => estado.sesion);
  const tareas = usarSelector(seleccionarTareasDelAmbito);

  useEffect(() => {
    if (usuario) despachar(cargarTareas());
  }, [usuario, despachar]);

  const tareasProximas = useMemo(
    () =>
      tareas
        .filter((tarea) => tarea.estado !== 'HECHA' && tarea.fechaLimite)
        .filter((tarea) => {
          const dias = diasHastaFecha(tarea.fechaLimite!);
          return dias >= 0 && dias <= 7;
        })
        .sort((a, b) => diasHastaFecha(a.fechaLimite!) - diasHastaFecha(b.fechaLimite!)),
    [tareas],
  );

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-12 overflow-hidden px-4 py-16 text-center sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]"
      />
      {!usuario && (
        <div className="absolute top-6 right-4 flex items-center gap-3 sm:top-8 sm:right-8">
          <SelectorTema />
          <SelectorIdioma />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <h1 className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-5xl font-semibold tracking-tight text-transparent lg:text-6xl">
          {intl.formatMessage({ id: 'app.titulo' })}
        </h1>
        <p className="text-lg text-muted-foreground">
          {intl.formatMessage({ id: 'app.eslogan' })}
        </p>
      </div>

      {usuario ? (
        <div className="flex w-full flex-col items-center gap-6">
          <p className="text-lg">
            {intl.formatMessage(
              { id: 'auth.bienvenidoUsuario' },
              { nombre: usuario.nombre ?? usuario.correo },
            )}
          </p>

          <Card className="w-full max-w-sm text-left">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                {intl.formatMessage({ id: 'inicio.proximos.titulo' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tareasProximas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: 'inicio.proximos.vacio' })}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {tareasProximas.map((tarea) => (
                    <li key={tarea.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{tarea.titulo}</span>
                      <EtiquetaFechaLimite fechaLimite={tarea.fechaLimite!} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/login">{intl.formatMessage({ id: 'auth.login.titulo' })}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/registro">
              {intl.formatMessage({ id: 'auth.registro.titulo' })}
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
