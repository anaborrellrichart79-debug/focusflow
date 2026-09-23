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
    const resultado = this.cola.then(() => this.pedirAOllama(instrucciones));
    this.cola = resultado;
    return resultado;
  }

  private async pedirAOllama(instrucciones: string): Promise<string | null> {
    const url = this.config.get<string>('OLLAMA_URL');
    if (!url) return null;

    try {
      const respuesta = await fetch(`${url.replace(/\/$/, '')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.get<string>('OLLAMA_MODELO') || 'qwen3.5:4b',
          prompt: instrucciones,
          stream: false,
          // Los modelos qwen3.5 "piensan" en voz alta por defecto; aquí solo
          // interesa la respuesta final.
          think: false,
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
      return texto ? texto.slice(0, 1000) : null;
    } catch (error) {
      this.logger.warn(
        `Ollama no disponible, se usa el texto por reglas: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
