import '@testing-library/jest-dom/vitest';

// jsdom no implementa matchMedia; se simula para que el código que lo usa
// (p. ej. la preferencia de modo oscuro del sistema) no falle en los tests.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom tampoco implementa ResizeObserver, que la casilla de Radix usa cuando
// está dentro de un <form> (para medir su input oculto).
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
