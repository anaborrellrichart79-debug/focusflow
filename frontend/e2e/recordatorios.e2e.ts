import { expect, test } from '@playwright/test';
import { entrarComo, llamarApi, registrarPorApi } from './apoyo';

// Las fechas límite se guardan como "hora de reloj" de Madrid codificada en
// UTC (las 10:00 de aquí se guardan como 10:00Z): dentro de 3 horas, así.
function dentroDeHoras(horas: number) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(Date.now() + horas * 60 * 60 * 1000))
      .map((parte) => [parte.type, parte.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:00.000Z`;
}

test('una alarma de entrega avisa de la tarea que vence pronto', async ({ page, request }) => {
  const { tokenAcceso } = await registrarPorApi(request, { nombre: 'Irene' });
  await llamarApi(request, tokenAcceso, 'post', '/tareas', {
    titulo: 'Entregar la redacción',
    fechaLimite: dentroDeHoras(3),
  });

  await entrarComo(page, tokenAcceso, '/recordatorios');
  await expect(page.getByText('Todavía no tienes avisos. Crea una alarma abajo para empezar.')).toBeVisible();

  const formulario = page.getByRole('form', { name: 'Nueva alarma' });
  await formulario.getByLabel('Tipo de alarma').selectOption({ label: 'Entrega de tarea' });
  await formulario.getByLabel('Horas antes de la entrega:').fill('24');
  await formulario.getByRole('button', { name: 'Añadir alarma' }).click();
  await expect(page.getByText('24 horas antes de cada fecha límite')).toBeVisible();

  await page.getByRole('button', { name: 'Comprobar ahora' }).click();
  await expect(page.getByText('1 aviso nuevo.')).toBeVisible();
  await expect(page.getByText(/Entrega en \d+ h: Entregar la redacción/).first()).toBeVisible();

  // Una segunda comprobación no repite el mismo aviso.
  await page.getByRole('button', { name: 'Comprobar ahora' }).click();
  await expect(page.getByText('No hay avisos nuevos.')).toBeVisible();
});
