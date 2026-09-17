import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { usarDespachador, usarSelector } from '@/almacen/hooks';
import { restaurarSesion } from '@/almacen/sesionSlice';
import { RutaProtegida } from '@/componentes/RutaProtegida';
import { mensajesPorIdioma } from '@/idiomas';
import { PaginaInicio } from '@/paginas/PaginaInicio';
import { PaginaLogin } from '@/paginas/PaginaLogin';
import { PaginaObjetivos } from '@/paginas/PaginaObjetivos';
import { PaginaPomodoro } from '@/paginas/PaginaPomodoro';
import { PaginaRegistro } from '@/paginas/PaginaRegistro';

export function Aplicacion() {
  const despachar = usarDespachador();
  const idiomaActual = usarSelector((estado) => estado.interfaz.idioma);
  const restaurandoSesion = usarSelector((estado) => estado.sesion.restaurando);

  useEffect(() => {
    despachar(restaurarSesion());
  }, [despachar]);

  return (
    <IntlProvider locale={idiomaActual} messages={mensajesPorIdioma[idiomaActual]}>
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
          </Routes>
        )}
      </BrowserRouter>
    </IntlProvider>
  );
}
