import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { actualizarHorario, crearHorario } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { ComunidadAutonoma } from '@/servicios/horarios';
import { ordenarCursos, periodoEscolarActual } from '@/utilidades/horario';
import { COMUNIDADES } from '@/utilidades/comunidades';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Alta de un horario nuevo. Si ya hay uno activo (p. ej. el del curso
// pasado), se ofrece usar el nuevo directamente.
export function FormularioHorario({ alTerminar }: { alTerminar?: () => void }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const cursos = usarSelector((estado) => estado.horario.cursos);
  const hayActivo = usarSelector((estado) => estado.horario.activo !== null);
  const [titulo, setTitulo] = useState('');
  const [periodo, setPeriodo] = useState(periodoEscolarActual);
  const [cursoId, setCursoId] = useState('');
  const [comunidad, setComunidad] = useState<ComunidadAutonoma | ''>('');
  const [activarlo, setActivarlo] = useState(true);

  async function alCrear(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !periodo.trim() || !cursoId || !comunidad) return;
    const resultado = await despachar(crearHorario({ titulo, periodo, cursoId, comunidad }));
    if (!crearHorario.fulfilled.match(resultado)) return;
    if (!resultado.payload.activo && activarlo) {
      await despachar(actualizarHorario({ id: resultado.payload.id, activo: true }));
    }
    alTerminar?.();
  }

  return (
    <form onSubmit={alCrear} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.titulo' })}
          <Input
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder={intl.formatMessage({ id: 'horario.datos.tituloEjemplo' })}
            maxLength={60}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.periodo' })}
          <Input
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
            maxLength={20}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.curso' })}
          <select
            value={cursoId}
            onChange={(evento) => setCursoId(evento.target.value)}
            className={CLASE_SELECT}
            required
          >
            <option value="">{intl.formatMessage({ id: 'horario.datos.elegir' })}</option>
            {(['PRIMARIA', 'ESO', 'BACHILLERATO'] as const).map((etapa) => (
              <optgroup key={etapa} label={intl.formatMessage({ id: `horario.etapa.${etapa}` })}>
                {ordenarCursos(cursos)
                  .filter((curso) => curso.etapa === etapa)
                  .map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {intl.formatMessage(
                        { id: 'horario.curso' },
                        {
                          numero: curso.numero,
                          etapa: intl.formatMessage({ id: `horario.etapa.${curso.etapa}` }),
                        },
                      )}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.comunidad' })}
          <select
            value={comunidad}
            onChange={(evento) => setComunidad(evento.target.value as ComunidadAutonoma)}
            className={CLASE_SELECT}
            required
          >
            <option value="">{intl.formatMessage({ id: 'horario.datos.elegir' })}</option>
            {COMUNIDADES.map((codigo) => (
              <option key={codigo} value={codigo}>
                {intl.formatMessage({ id: `comunidad.${codigo}` })}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hayActivo && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={activarlo} onCheckedChange={(marcada) => setActivarlo(marcada === true)} />
          {intl.formatMessage({ id: 'horario.datos.activarNuevo' })}
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        {intl.formatMessage({ id: 'horario.datos.plantillaAyuda' })}
      </p>
      <Button type="submit">{intl.formatMessage({ id: 'horario.crear' })}</Button>
    </form>
  );
}
