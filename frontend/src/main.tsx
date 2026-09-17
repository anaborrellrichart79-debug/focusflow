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
