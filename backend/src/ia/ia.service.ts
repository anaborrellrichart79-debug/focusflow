import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Modelos por defecto con Anthropic: uno rápido y barato para el texto de los
// avisos (muchos y sencillos) y uno mejor para el asistente de tareas, donde
// más se nota la calidad. Se pueden cambiar en .env sin tocar código.
const MODELO_AVISOS_POR_DEFECTO = 'claude-haiku-4-5';
const MODELO_ASISTENTE_POR_DEFECTO = 'claude-sonnet-5-5';

// Texto y respuestas estructuradas generadas por IA. Hay dos proveedores:
// - Anthropic (Claude), si ANTHROPIC_API_KEY está en .env: el del plan de pago
//   en producción; solo se paga lo que se usa.
// - Ollama, un modelo local, si no hay clave y OLLAMA_URL está puesta: para
//   desarrollar sin gasto.
// Todo es opcional: sin ninguno, o si fallan o tardan, se devuelve null y quien
// llama sigue sin IA (los avisos, con su texto de reglas fijas). Qué usuarios
// tienen derecho a la IA lo decide PlanesService, no este servicio.
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly anthropic: Anthropic | null;

  // Ollama atiende las peticiones de una en una: si se le mandan varias a la
  // vez, las últimas agotan su tiempo de espera haciendo cola en el servidor.
  // Aquí se encadenan para que cada una tenga su tiempo completo.
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: ConfigService) {
    const clave = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = clave
      ? new Anthropic({
          apiKey: clave,
          timeout: Number(this.config.get('ANTHROPIC_TIMEOUT_MS')) || 60_000,
          maxRetries: 2,
        })
      : null;
  }

  redactar(instrucciones: string): Promise<string | null> {
    if (this.anthropic) return this.redactarConClaude(this.anthropic, instrucciones);
    return this.encolar(() => this.pedirAOllama(instrucciones));
  }

  // Respuesta que se ciñe al esquema JSON que se le pasa. null si no hay IA o
  // no devuelve JSON; quien llama debe validar igualmente el contenido.
  async generarJson<T>(instrucciones: string, esquema: object): Promise<T | null> {
    const texto = this.anthropic
      ? await this.generarJsonConClaude(this.anthropic, instrucciones, esquema)
      : await this.encolar(() => this.pedirAOllama(instrucciones, esquema, 4000));
    if (!texto) return null;
    try {
      return JSON.parse(texto) as T;
    } catch {
      this.logger.warn('La IA no devolvió un JSON válido');
      return null;
    }
  }

  // Si se le puede pedir algo ahora mismo, sin generar nada (para avisar en la
  // interfaz antes de que alguien espere para nada). Con Anthropic basta con
  // tener la clave: un fallo puntual ya se trata como "sin propuesta".
  async disponible() {
    if (this.anthropic) return true;
    const url = this.config.get<string>('OLLAMA_URL');
    if (!url) return false;
    try {
      const respuesta = await fetch(`${url.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return respuesta.ok;
    } catch {
      return false;
    }
  }

  // Haiku 4.5, sin razonamiento extendido: frases cortas de un aviso.
  private async redactarConClaude(cliente: Anthropic, instrucciones: string) {
    try {
      const respuesta = await cliente.messages.create({
        model: this.config.get<string>('IA_MODELO_AVISOS') || MODELO_AVISOS_POR_DEFECTO,
        max_tokens: 1000,
        messages: [{ role: 'user', content: instrucciones }],
      });
      return textoDe(respuesta.content, respuesta.stop_reason, 1000);
    } catch (error) {
      this.avisarFallo(error);
      return null;
    }
  }

  // Sonnet 5.5 con salida estructurada (el JSON siempre cumple el esquema) y
  // esfuerzo bajo: son propuestas cortas. `fallbacks: "default"` hace que, si el
  // modelo rechazara la petición por sus filtros de seguridad, la API la repita
  // con otro modelo dentro de la misma llamada.
  private async generarJsonConClaude(cliente: Anthropic, instrucciones: string, esquema: object) {
    try {
      const respuesta = await cliente.beta.messages.create({
        model: this.config.get<string>('IA_MODELO_ASISTENTE') || MODELO_ASISTENTE_POR_DEFECTO,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: esquema as Record<string, unknown> },
        },
        messages: [{ role: 'user', content: instrucciones }],
      });
      return textoDe(respuesta.content, respuesta.stop_reason, 8000);
    } catch (error) {
      this.avisarFallo(error);
      return null;
    }
  }

  private avisarFallo(error: unknown) {
    if (error instanceof Anthropic.AuthenticationError) {
      this.logger.error('La clave de Anthropic (ANTHROPIC_API_KEY) no es válida');
    } else if (error instanceof Anthropic.RateLimitError) {
      this.logger.warn('Anthropic: demasiadas peticiones, se sigue sin IA');
    } else if (error instanceof Anthropic.APIError) {
      this.logger.warn(`Anthropic respondió ${error.status}: ${error.message}`);
    } else {
      this.logger.warn(`Anthropic no disponible: ${(error as Error).message}`);
    }
  }

  private encolar<T>(tarea: () => Promise<T>): Promise<T> {
    const resultado = this.cola.then(tarea);
    this.cola = resultado.catch(() => null);
    return resultado;
  }

  private async pedirAOllama(
    instrucciones: string,
    esquema?: object,
    maximo = 1000,
  ): Promise<string | null> {
    const url = this.config.get<string>('OLLAMA_URL');
    if (!url) return null;

    try {
      const respuesta = await fetch(`${url.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.get<string>('OLLAMA_MODELO') || 'qwen3.5:2b',
          prompt: instrucciones,
          stream: false,
          // Los modelos qwen3.5 "piensan" en voz alta por defecto; aquí solo
          // interesa la respuesta final.
          think: false,
          // Cargar el modelo en frío puede tardar más que el tiempo de espera:
          // se mantiene en memoria un rato entre peticiones.
          keep_alive: this.config.get<string>('OLLAMA_KEEP_ALIVE') || '30m',
          ...(esquema ? { format: esquema } : {}),
          options: { temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(
          Number(this.config.get('OLLAMA_TIMEOUT_MS')) || 90_000,
        ),
      });
      if (!respuesta.ok)
        throw new Error(`Ollama respondió ${respuesta.status}`);

      const cuerpo = (await respuesta.json()) as { response?: string };
      const texto = (cuerpo.response ?? '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();
      return texto ? texto.slice(0, maximo) : null;
    } catch (error) {
      this.logger.warn(
        `Ollama no disponible, se usa el texto por reglas: ${(error as Error).message}`,
      );
      return null;
    }
  }
}

// Une los bloques de texto de la respuesta. Un rechazo o una respuesta cortada
// por max_tokens no sirven (el JSON quedaría a medias): null.
function textoDe(
  bloques: ReadonlyArray<{ type: string; text?: string }>,
  motivoFin: string | null,
  maximo: number,
) {
  if (motivoFin === 'refusal' || motivoFin === 'max_tokens') return null;
  const texto = bloques
    .filter((bloque) => bloque.type === 'text')
    .map((bloque) => bloque.text ?? '')
    .join('')
    .trim();
  return texto ? texto.slice(0, maximo) : null;
}
