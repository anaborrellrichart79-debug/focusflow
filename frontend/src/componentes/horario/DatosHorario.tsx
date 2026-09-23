import { useState } from 'react';
import { useIntl } from 'react-intl';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { actualizarHorario, eliminarHorario } from '@/almacen/horarioSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ComunidadAutonoma, Horario } from '@/servicios/horarios';
import { COMUNIDADES } from '@/utilidades/comunidades';
import { FormularioHorario } from './FormularioHorario';

const CLASE_SELECT =
  'rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md';

// Título, periodo y comunidad del horario activo, más la gestión de los demás
// horarios del usuario (activar otro, crear uno nuevo, borrar este).
export function DatosHorario({ horario }: { horario: Horario }) {
  const intl = useIntl();
  const despachar = usarDespachador();
  const otros = usarSelector((estado) =>
    estado.horario.lista.filter((candidato) => candidato.id !== horario.id),
  );
  const [titulo, setTitulo] = useState(horario.titulo);
  const [periodo, setPeriodo] = useState(horario.periodo);
  const [comunidad, setComunidad] = useState<ComunidadAutonoma>(horario.comunidad);
  const [creandoOtro, setCreandoOtro] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const hayCambios =
    titulo.trim() !== horario.titulo ||
    periodo.trim() !== horario.periodo ||
    comunidad !== horario.comunidad;

  function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !periodo.trim()) return;
    despachar(actualizarHorario({ id: horario.id, titulo, periodo, comunidad }));
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.titulo' })}
          <Input value={titulo} onChange={(evento) => setTitulo(evento.target.value)} maxLength={60} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.periodo' })}
          <Input value={periodo} onChange={(evento) => setPeriodo(evento.target.value)} maxLength={20} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {intl.formatMessage({ id: 'horario.datos.comunidad' })}
          <select
            value={comunidad}
            onChange={(evento) => setComunidad(evento.target.value as ComunidadAutonoma)}
            className={CLASE_SELECT}
          >
            {COMUNIDADES.map((codigo) => (
              <option key={codigo} value={codigo}>
                {intl.formatMessage({ id: `comunidad.${codigo}` })}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-3">
          <Button type="submit" size="sm" disabled={!hayCambios}>
            {intl.formatMessage({ id: 'horario.guardar' })}
          </Button>
        </div>
      </form>

      {otros.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{intl.formatMessage({ id: 'horario.otros' })}</p>
          <ul className="flex flex-col gap-2">
            {otros.map((otro) => (
              <li key={otro.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {otro.titulo} · {otro.periodo}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => despachar(actualizarHorario({ id: otro.id, activo: true }))}
                >
                  {intl.formatMessage({ id: 'horario.usarEste' })}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {creandoOtro ? (
        <div className="rounded-md border border-border p-3">
          <FormularioHorario alTerminar={() => setCreandoOtro(false)} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreandoOtro(true)}>
            {intl.formatMessage({ id: 'horario.nuevo' })}
          </Button>
          {confirmandoBorrado ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => despachar(eliminarHorario(horario.id))}
              >
                {intl.formatMessage({ id: 'horario.borrarConfirmar' })}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmandoBorrado(false)}>
                {intl.formatMessage({ id: 'horario.cancelar' })}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmandoBorrado(true)}>
              {intl.formatMessage({ id: 'horario.borrar' })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
