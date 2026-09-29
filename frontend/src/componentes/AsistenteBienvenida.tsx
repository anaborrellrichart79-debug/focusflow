import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarCursos } from '@/almacen/horarioSlice';
import { cambiarModoEscolar, cambiarPerfiles, completarBienvenida } from '@/almacen/sesionSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { PerfilUsuario } from '@/servicios/autenticacion';
import { PERFILES } from '@/utilidades/perfiles';
import { FormularioHorario } from './horario/FormularioHorario';
import { SelectorIdioma } from './SelectorIdioma';
import { SelectorTema } from './SelectorTema';

type Paso = 'perfil' | 'escolar' | 'horario' | 'listo';

// Lo que se ve la primera vez que se entra con una cuenta nueva: para qué se
// va a usar la app, el modo escolar y el horario, en vez de tener que
// descubrirlo por Ajustes. Cada paso guarda al momento con lo mismo que usa
// Ajustes, y se puede saltar en cualquier momento.
export function AsistenteBienvenida() {
  const intl = useIntl();
  const despachar = usarDespachador();
  const navegar = useNavigate();
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const [paso, setPaso] = useState<Paso>('perfil');
  const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
  const [horarioCreado, setHorarioCreado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (paso === 'horario') despachar(cargarCursos());
  }, [paso, despachar]);

  const esEstudiante = perfiles.includes('ESTUDIANTE');
  const pasos: Paso[] = esEstudiante ? ['perfil', 'escolar', 'horario', 'listo'] : ['perfil', 'listo'];
  // Con el modo escolar rechazado, el horario no aplica.
  const numeroPaso = pasos.indexOf(paso) + 1;

  async function terminar(destino = '/') {
    setGuardando(true);
    await despachar(completarBienvenida());
    navegar(destino);
  }

  async function trasPerfil() {
    if (perfiles.length > 0) await despachar(cambiarPerfiles(PERFILES.filter((p) => perfiles.includes(p))));
    setPaso(esEstudiante ? 'escolar' : 'listo');
  }

  async function elegirModoEscolar(activar: boolean) {
    if (activar) {
      await despachar(cambiarModoEscolar(true));
      setPaso('horario');
    } else {
      setPaso('listo');
    }
  }

  function alternarPerfil(perfil: PerfilUsuario, marcado: boolean) {
    setPerfiles((actuales) => (marcado ? [...actuales, perfil] : actuales.filter((p) => p !== perfil)));
  }

  const consejos = [
    'bienvenida.consejo.captura',
    'bienvenida.consejo.buscar',
    ...(perfiles.includes('PADRE') ? ['bienvenida.consejo.familia'] : []),
    ...(esEstudiante ? ['bienvenida.consejo.pomodoro'] : []),
    'bienvenida.consejo.avisos',
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-gradient-to-br from-primary to-motivador bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          {intl.formatMessage({ id: 'app.titulo' })}
        </span>
        <div className="flex gap-3">
          <SelectorTema />
          <SelectorIdioma />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {intl.formatMessage({ id: 'bienvenida.paso' }, { paso: numeroPaso, total: pasos.length })}
          </p>
          {paso !== 'listo' && (
            <Button variant="ghost" size="sm" onClick={() => terminar()} disabled={guardando}>
              {intl.formatMessage({ id: 'bienvenida.saltar' })}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {paso === 'perfil' && (
            <>
              <CardTitle className="text-xl">
                {intl.formatMessage(
                  { id: 'bienvenida.perfil.titulo' },
                  { nombre: usuario?.nombre ?? usuario?.correo ?? '' },
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'bienvenida.perfil.descripcion' })}</p>
              <div className="flex flex-col gap-2">
                {PERFILES.map((perfil) => (
                  <label
                    key={perfil}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={perfiles.includes(perfil)}
                      onCheckedChange={(marcado) => alternarPerfil(perfil, marcado === true)}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{intl.formatMessage({ id: `perfil.${perfil}` })}</span>
                      <span className="text-xs text-muted-foreground">
                        {intl.formatMessage({ id: `bienvenida.perfil.${perfil}` })}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button className="self-end" onClick={trasPerfil}>
                {intl.formatMessage({ id: 'bienvenida.siguiente' })}
              </Button>
            </>
          )}

          {paso === 'escolar' && (
            <>
              <CardTitle className="text-xl">{intl.formatMessage({ id: 'bienvenida.escolar.titulo' })}</CardTitle>
              <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'ajustes.modoEscolar.descripcion' })}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => elegirModoEscolar(false)}>
                  {intl.formatMessage({ id: 'bienvenida.escolar.no' })}
                </Button>
                <Button onClick={() => elegirModoEscolar(true)}>
                  {intl.formatMessage({ id: 'bienvenida.escolar.si' })}
                </Button>
              </div>
            </>
          )}

          {paso === 'horario' && (
            <>
              <CardTitle className="text-xl">{intl.formatMessage({ id: 'bienvenida.horario.titulo' })}</CardTitle>
              <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'bienvenida.horario.descripcion' })}</p>
              <FormularioHorario
                alTerminar={() => {
                  setHorarioCreado(true);
                  setPaso('listo');
                }}
              />
              <Button variant="ghost" className="self-start" onClick={() => setPaso('listo')}>
                {intl.formatMessage({ id: 'bienvenida.horario.despues' })}
              </Button>
            </>
          )}

          {paso === 'listo' && (
            <>
              <CardTitle className="text-xl">{intl.formatMessage({ id: 'bienvenida.listo.titulo' })}</CardTitle>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
                {consejos.map((clave) => (
                  <li key={clave}>{intl.formatMessage({ id: clave })}</li>
                ))}
              </ul>
              <div className="flex flex-wrap justify-end gap-2">
                {horarioCreado && (
                  <Button variant="outline" onClick={() => terminar('/horario')} disabled={guardando}>
                    {intl.formatMessage({ id: 'bienvenida.listo.rellenarHorario' })}
                  </Button>
                )}
                <Button onClick={() => terminar()} disabled={guardando}>
                  {intl.formatMessage({ id: 'bienvenida.listo.empezar' })}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
