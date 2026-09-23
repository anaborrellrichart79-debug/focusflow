import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarCursos, cargarHorarios } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CuadriculaHorario } from '@/componentes/horario/CuadriculaHorario';
import { DatosHorario } from '@/componentes/horario/DatosHorario';
import { DialogoCelda } from '@/componentes/horario/DialogoCelda';
import { EditorFranjas } from '@/componentes/horario/EditorFranjas';
import { FormularioHorario } from '@/componentes/horario/FormularioHorario';
import { PanelAsignaturas } from '@/componentes/horario/PanelAsignaturas';
import type { FranjaHorario } from '@/servicios/horarios';

export function PaginaHorario() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const { activo: horario, cargado, error } = usarSelector((estado) => estado.horario);
  const [editando, setEditando] = useState(false);
  const [celda, setCelda] = useState<{ franja: FranjaHorario; diaSemana: number } | null>(null);

  useEffect(() => {
    despachar(cargarCursos());
    despachar(cargarHorarios());
  }, [despachar]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {intl.formatMessage({ id: 'horario.titulo' })}
        </h1>
        {horario && (
          <Button variant={editando ? 'default' : 'outline'} onClick={() => setEditando((valor) => !valor)}>
            {intl.formatMessage({ id: editando ? 'horario.terminar' : 'horario.editar' })}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!cargado ? null : !horario ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{intl.formatMessage({ id: 'horario.crearPrimero' })}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'horario.crearPrimeroAyuda' })}
            </p>
            <FormularioHorario />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <CardTitle className="text-2xl font-bold tracking-wide uppercase">
                  {intl.formatMessage({ id: 'horario.cabecera' })}
                </CardTitle>
                <p className="rounded-md border-2 border-primary px-3 py-1 text-xl font-bold text-primary">
                  {horario.titulo}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage(
                  { id: 'horario.subtitulo' },
                  {
                    curso: intl.formatMessage(
                      { id: 'horario.curso' },
                      {
                        numero: horario.curso.numero,
                        etapa: intl.formatMessage({ id: `horario.etapa.${horario.curso.etapa}` }),
                      },
                    ),
                    periodo: horario.periodo,
                    comunidad: intl.formatMessage({ id: `comunidad.${horario.comunidad}` }),
                  },
                )}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <CuadriculaHorario
                horario={horario}
                editable={editando}
                alPulsarCelda={(franja, diaSemana) => setCelda({ franja, diaSemana })}
              />
              {editando && (
                <p className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'horario.editarAyuda' })}
                </p>
              )}
            </CardContent>
          </Card>

          {editando && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{intl.formatMessage({ id: 'horario.asignaturas.titulo' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PanelAsignaturas horario={horario} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{intl.formatMessage({ id: 'horario.franjas.titulo' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* key: al cambiar de horario activo, el borrador se reinicia. */}
                  <EditorFranjas key={horario.id} horario={horario} />
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{intl.formatMessage({ id: 'horario.datos.tituloSeccion' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DatosHorario key={horario.id} horario={horario} />
                </CardContent>
              </Card>
            </div>
          )}

          {celda && (
            <DialogoCelda
              horario={horario}
              franja={celda.franja}
              diaSemana={celda.diaSemana}
              alCerrar={() => setCelda(null)}
            />
          )}
        </>
      )}
    </main>
  );
}
