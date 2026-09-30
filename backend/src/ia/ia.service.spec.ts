import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IaService } from './ia.service.js';

// El SDK de Anthropic, falso: ningún test hace peticiones de verdad (ni gasta).
const anthropicFalso = vi.hoisted(() => ({ crear: vi.fn(), crearBeta: vi.fn(), opciones: [] as unknown[] }));
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status = 500;
  }
  class AuthenticationError extends APIError {}
  class RateLimitError extends APIError {}
  class Anthropic {
    static APIError = APIError;
    static AuthenticationError = AuthenticationError;
    static RateLimitError = RateLimitError;
    messages = { create: anthropicFalso.crear };
    beta = { messages: { create: anthropicFalso.crearBeta } };
    constructor(opciones: unknown) {
      anthropicFalso.opciones.push(opciones);
    }
  }
  return { default: Anthropic };
});

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
      model: 'qwen3.5:2b',
      prompt: 'instrucciones',
      stream: false,
      think: false,
    });
  });

  it('generarJson pide el formato con el esquema y devuelve el JSON ya leído', async () => {
    fetchFalso.mockResolvedValue({ ok: true, json: async () => ({ response: '{"pasos":["Leer el tema"]}' }) });
    const esquema = { type: 'object', properties: { pasos: { type: 'array' } } };

    expect(await servicio.generarJson('instrucciones', esquema)).toEqual({ pasos: ['Leer el tema'] });
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toMatchObject({ format: esquema, think: false });

    fetchFalso.mockResolvedValue({ ok: true, json: async () => ({ response: 'esto no es JSON' }) });
    expect(await servicio.generarJson('instrucciones', esquema)).toBeNull();
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

describe('IaService con Anthropic', () => {
  let servicio: IaService;
  const fetchFalso = vi.fn();
  const configFalso = { get: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchFalso);
    configFalso.get.mockImplementation(
      (clave: string) =>
        ({ ANTHROPIC_API_KEY: 'clave-de-prueba', OLLAMA_URL: 'http://localhost:11434' } as Record<string, string>)[clave],
    );
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [IaService, { provide: ConfigService, useValue: configFalso }],
    }).compile();
    servicio = modulo.get(IaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con clave, los avisos los redacta Haiku 4.5 y Ollama no se usa', async () => {
    anthropicFalso.crear.mockResolvedValue({
      content: [{ type: 'text', text: '  Revisa el examen hoy. ' }],
      stop_reason: 'end_turn',
    });

    expect(await servicio.redactar('instrucciones')).toBe('Revisa el examen hoy.');
    expect(anthropicFalso.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5',
        messages: [{ role: 'user', content: 'instrucciones' }],
      }),
    );
    expect(fetchFalso).not.toHaveBeenCalled();
    expect(await servicio.disponible()).toBe(true);
  });

  it('las propuestas del asistente las hace Sonnet 5.5 con salida estructurada y fallbacks', async () => {
    anthropicFalso.crearBeta.mockResolvedValue({
      content: [{ type: 'text', text: '{"pasos":["Leer el tema"]}' }],
      stop_reason: 'end_turn',
    });
    const esquema = { type: 'object', properties: {}, additionalProperties: false };

    expect(await servicio.generarJson('instrucciones', esquema)).toEqual({ pasos: ['Leer el tema'] });
    expect(anthropicFalso.crearBeta).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-5-5',
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: esquema } },
      }),
    );
  });

  it('los modelos se pueden cambiar en .env', async () => {
    configFalso.get.mockImplementation(
      (clave: string) => ({ ANTHROPIC_API_KEY: 'clave', IA_MODELO_AVISOS: 'claude-sonnet-5-5' })[clave],
    );
    anthropicFalso.crear.mockResolvedValue({ content: [{ type: 'text', text: 'Hola' }], stop_reason: 'end_turn' });

    await servicio.redactar('instrucciones');

    expect(anthropicFalso.crear).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-sonnet-5-5' }));
  });

  it('un rechazo o una respuesta cortada no sirven: null', async () => {
    anthropicFalso.crearBeta.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"pasos":[' }], stop_reason: 'max_tokens' });
    expect(await servicio.generarJson('instrucciones', {})).toBeNull();

    anthropicFalso.crear.mockResolvedValueOnce({ content: [], stop_reason: 'refusal' });
    expect(await servicio.redactar('instrucciones')).toBeNull();
  });

  it('si Anthropic falla (clave mala, límite, caída), devuelve null en vez de fallar', async () => {
    anthropicFalso.crear.mockRejectedValue(new Error('Connection error'));
    expect(await servicio.redactar('instrucciones')).toBeNull();

    anthropicFalso.crearBeta.mockRejectedValue(new Error('Connection error'));
    expect(await servicio.generarJson('instrucciones', {})).toBeNull();
  });
});
