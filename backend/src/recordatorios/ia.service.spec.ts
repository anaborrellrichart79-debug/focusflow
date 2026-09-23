import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IaService } from './ia.service.js';

describe('IaService', () => {
  let servicio: IaService;
  const configFalso = { get: vi.fn() };
  const fetchFalso = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchFalso);
    configFalso.get.mockImplementation((clave: string) =>
      clave === 'OLLAMA_URL' ? 'http://localhost:11434/' : undefined,
    );

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [IaService, { provide: ConfigService, useValue: configFalso }],
    }).compile();
    servicio = modulo.get(IaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve el texto de Ollama, sin razonamiento, con el modelo por defecto y sin "pensar"', async () => {
    fetchFalso.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: '<think>hmm</think>  Revisa el examen hoy. ',
      }),
    });

    expect(await servicio.redactar('instrucciones')).toBe(
      'Revisa el examen hoy.',
    );
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(JSON.parse(opciones.body)).toMatchObject({
      model: 'qwen3.5:4b',
      prompt: 'instrucciones',
      stream: false,
      think: false,
    });
  });

  it('sin OLLAMA_URL no llama a nada y devuelve null', async () => {
    configFalso.get.mockReturnValue(undefined);

    expect(await servicio.redactar('instrucciones')).toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('si Ollama no responde o da error, devuelve null en vez de fallar', async () => {
    fetchFalso.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await servicio.redactar('instrucciones')).toBeNull();

    fetchFalso.mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await servicio.redactar('instrucciones')).toBeNull();
  });

  it('encadena las peticiones: la segunda no sale hasta que acaba la primera', async () => {
    let terminarPrimera: () => void = () => {};
    fetchFalso
      .mockReturnValueOnce(
        new Promise((resolver) => {
          terminarPrimera = () =>
            resolver({ ok: true, json: async () => ({ response: 'uno' }) });
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'dos' }),
      });

    const primera = servicio.redactar('a');
    const segunda = servicio.redactar('b');
    await Promise.resolve();
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    terminarPrimera();
    expect(await primera).toBe('uno');
    expect(await segunda).toBe('dos');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });
});
