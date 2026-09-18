import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { restaurarSesion } from '@/almacen/sesionSlice';
import { RutaProtegida } from '@/componentes/RutaProtegida';
import { CODIGO_LOCALE_ICU, mensajesPorIdioma } from '@/idiomas';
import { PaginaEisenhower } from '@/paginas/PaginaEisenhower';
import { PaginaEstadisticas } from '@/paginas/PaginaEstadisticas';
import { PaginaInicio } from '@/paginas/PaginaInicio';
import { PaginaKanban } from '@/paginas/PaginaKanban';
import { PaginaLogin } from '@/paginas/PaginaLogin';
import { PaginaObjetivos } from '@/paginas/PaginaObjetivos';
import { PaginaPomodoro } from '@/paginas/PaginaPomodoro';
import { PaginaRegistro } from '@/paginas/PaginaRegistro';

export function Aplicacion() {
  const despachar = usarDespachador();
  const idiomaActual = usarSelector((estado) => estado.interfaz.idioma);
  const tema = usarSelector((estado) => estado.interfaz.tema);
  const restaurandoSesion = usarSelector((estado) => estado.sesion.restaurando);

  useEffect(() => {
    despachar(restaurarSesion());
  }, [despachar]);

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
        {restaurandoSesion ? null : (
          <Routes>
            <Route path="/" element={<PaginaInicio />} />
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
          </Routes>
        )}
      </BrowserRouter>
    </IntlProvider>
  );
}
