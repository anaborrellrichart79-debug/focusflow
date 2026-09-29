import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Redacción de los avisos con un modelo local de Ollama. Es opcional: si
// OLLAMA_URL está vacía, Ollama no responde o tarda demasiado, devuelve null y
// el aviso se queda solo con su texto de reglas fijas (que siempre existe).
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  // Ollama atiende las peticiones de una en una: si se le mandan varias a la
  // vez, las últimas agotan su tiempo de espera haciendo cola en el servidor.
  // Aquí se encadenan para que cada una tenga su tiempo completo.
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: ConfigService) {}

  redactar(instrucciones: string): Promise<string | null> {
    return this.encolar(() => this.pedirAOllama(instrucciones));
  }

  // Respuesta estructurada: Ollama se ciñe al esquema JSON que se le pasa
  // (parámetro `format`). null si no está disponible o no devuelve JSON; quien
  // llama debe validar igualmente el contenido.
  async generarJson<T>(instrucciones: string, esquema: object): Promise<T | null> {
    const texto = await this.encolar(() => this.pedirAOllama(instrucciones, esquema, 4000));
    if (!texto) return null;
    try {
      return JSON.parse(texto) as T;
    } catch {
      this.logger.warn('Ollama no devolvió un JSON válido');
      return null;
    }
  }

  // Si Ollama responde, sin generar nada (para avisar en la interfaz antes de
  // que alguien espere un minuto para nada).
  async disponible() {
    const url = this.config.get<string>('OLLAMA_URL');
    if (!url) return false;
    try {
      const respuesta = await fetch(`${url.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return respuesta.ok;
    } catch {
      return false;
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
