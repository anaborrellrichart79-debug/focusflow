import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Aplicacion } from './Aplicacion';
import { store } from './almacen/store';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Aplicacion />
    </Provider>
  </StrictMode>,
);

// En desarrollo también se registra, pero sin caché (ver sw.js): hace falta
// para poder probar los avisos Web Push en local.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const url = import.meta.env.PROD ? '/sw.js' : '/sw.js?modo=desarrollo';
    navigator.serviceWorker.register(url).catch(() => {});
  });
}
