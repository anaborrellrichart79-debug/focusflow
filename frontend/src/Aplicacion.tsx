import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { cargarFamilia } from '@/almacen/familiaSlice';
import { cargarEstadoGoogle, sincronizarGoogle } from '@/almacen/googleSlice';
import { cargarHorarios } from '@/almacen/horarioSlice';
import { cargarCalendarioEscolar } from '@/almacen/recordatoriosSlice';
import { restaurarSesion } from '@/almacen/sesionSlice';
import { DisenoAplicacion } from '@/componentes/DisenoAplicacion';
import { RutaProtegida } from '@/componentes/RutaProtegida';
import { VigilanteAvisos } from '@/componentes/VigilanteAvisos';
import { CODIGO_LOCALE_ICU, mensajesPorIdioma } from '@/idiomas';
import { PaginaAgenda } from '@/paginas/PaginaAgenda';
import { PaginaAjustes } from '@/paginas/PaginaAjustes';
import { PaginaConfirmarConsentimiento } from '@/paginas/PaginaConfirmarConsentimiento';
import { PaginaEisenhower } from '@/paginas/PaginaEisenhower';
import { PaginaEstadisticas } from '@/paginas/PaginaEstadisticas';
import { PaginaFamilia } from '@/paginas/PaginaFamilia';
import { PaginaHorario } from '@/paginas/PaginaHorario';
import { PaginaInicio } from '@/paginas/PaginaInicio';
import { PaginaKanban } from '@/paginas/PaginaKanban';
import { PaginaLogin } from '@/paginas/PaginaLogin';
import { PaginaObjetivos } from '@/paginas/PaginaObjetivos';
import { PaginaPlanificador } from '@/paginas/PaginaPlanificador';
import { PaginaPomodoro } from '@/paginas/PaginaPomodoro';
import { PaginaRecordatorios } from '@/paginas/PaginaRecordatorios';
import { PaginaRegistro } from '@/paginas/PaginaRegistro';
import { PaginaRevision } from '@/paginas/PaginaRevision';

// Cada cuánto se repite la sincronización automática con Google Calendar
// mientras la pestaña permanece abierta y la cuenta está conectada.
const INTERVALO_AUTOSYNC_MS = 5 * 60 * 1000;

export function Aplicacion() {
  const despachar = usarDespachador();
  const idiomaActual = usarSelector((estado) => estado.interfaz.idioma);
  const tema = usarSelector((estado) => estado.interfaz.tema);
  const restaurandoSesion = usarSelector((estado) => estado.sesion.restaurando);
  const usuario = usarSelector((estado) => estado.sesion.usuario);
  const conectadoGoogle = usarSelector((estado) => estado.google.conectado);

  useEffect(() => {
    despachar(restaurarSesion());
  }, [despachar]);

  useEffect(() => {
    if (usuario) despachar(cargarEstadoGoogle());
  }, [usuario, despachar]);

  // Los responsables vinculados hacen falta en el detalle de cualquier tarea
  // (para elegir quién la revisa), así que se cargan al entrar.
  const puedeUsarApi = usuario?.consentimientoConfirmado ?? false;
  useEffect(() => {
    if (puedeUsarApi) despachar(cargarFamilia());
  }, [puedeUsarApi, despachar]);

  // El horario activo lo usan la Agenda (clases), el Planificador y el detalle
  // de las tareas (asignatura), así que se carga una vez al entrar. El
  // calendario escolar, para no pintar clases en días no lectivos.
  const modoEscolar = usuario?.modoEscolarActivo ?? false;
  useEffect(() => {
    if (!modoEscolar) return;
    despachar(cargarHorarios());
    despachar(cargarCalendarioEscolar());
  }, [modoEscolar, despachar]);

  useEffect(() => {
    if (!usuario || !conectadoGoogle) return;
    const intervalo = setInterval(() => {
      despachar(sincronizarGoogle());
    }, INTERVALO_AUTOSYNC_MS);
    return () => clearInterval(intervalo);
  }, [usuario, conectadoGoogle, despachar]);

  useEffect(() => {
    document.documentElement.lang = CODIGO_LOCALE_ICU[idiomaActual];
  }, [idiomaActual]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'oscuro' ? '#0a0a0a' : '#ffffff');
  }, [tema]);

  return (
    <IntlProvider locale={CODIGO_LOCALE_ICU[idiomaActual]} messages={mensajesPorIdioma[idiomaActual]}>
      <BrowserRouter>
        {/* Un menor sin consentimiento confirmado recibe 403 de la API. */}
        {usuario?.consentimientoConfirmado && <VigilanteAvisos />}
        {restaurandoSesion ? null : (
          <Routes>
            <Route
              path="/"
              element={
                // Sin sesión, "/" es la portada pública; con sesión, el panel de
                // inicio dentro del mismo marco (barra lateral) que el resto.
                usuario ? (
                  <DisenoAplicacion>
                    <PaginaInicio />
                  </DisenoAplicacion>
                ) : (
                  <PaginaInicio />
                )
              }
            />
            <Route path="/confirmar-consentimiento" element={<PaginaConfirmarConsentimiento />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="/registro" element={<PaginaRegistro />} />
            <Route
              path="/objetivos"
              element={
                <RutaProtegida>
                  <PaginaObjetivos />
                </RutaProtegida>
              }
            />
            <Route
              path="/pomodoro"
              element={
                <RutaProtegida>
                  <PaginaPomodoro />
                </RutaProtegida>
              }
            />
            <Route
              path="/kanban"
              element={
                <RutaProtegida>
                  <PaginaKanban />
                </RutaProtegida>
              }
            />
            <Route
              path="/eisenhower"
              element={
                <RutaProtegida>
                  <PaginaEisenhower />
                </RutaProtegida>
              }
            />
            <Route
              path="/estadisticas"
              element={
                <RutaProtegida>
                  <PaginaEstadisticas />
                </RutaProtegida>
              }
            />
            <Route
              path="/revision"
              element={
                <RutaProtegida>
                  <PaginaRevision />
                </RutaProtegida>
              }
            />
            <Route
              path="/agenda"
              element={
                <RutaProtegida>
                  <PaginaAgenda />
                </RutaProtegida>
              }
            />
            <Route
              path="/horario"
              element={
                <RutaProtegida>
                  <PaginaHorario />
                </RutaProtegida>
              }
            />
            <Route
              path="/planificador"
              element={
                <RutaProtegida>
                  <PaginaPlanificador />
                </RutaProtegida>
              }
            />
            <Route
              path="/recordatorios"
              element={
                <RutaProtegida>
                  <PaginaRecordatorios />
                </RutaProtegida>
              }
            />
            <Route
              path="/familia"
              element={
                <RutaProtegida>
                  <PaginaFamilia />
                </RutaProtegida>
              }
            />
            <Route
              path="/ajustes"
              element={
                <RutaProtegida>
                  <PaginaAjustes />
                </RutaProtegida>
              }
            />
          </Routes>
        )}
      </BrowserRouter>
    </IntlProvider>
  );
}
