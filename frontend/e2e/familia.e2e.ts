import { expect, test } from '@playwright/test';
import { API_E2E } from './entorno';
import { CONTRASENA, correoUnico, entrarComo, llamarApi, NACIMIENTO_MENOR, registrarPorApi, tokenDe } from './apoyo';

test('un menor se registra, su madre confirma la cuenta con el código y revisa su tarea', async ({
  page,
  browser,
  request,
}) => {
  const madre = await registrarPorApi(request, { nombre: 'Elena' });

  // 1. El menor se registra por la interfaz: queda pendiente de confirmar.
  await page.goto('/registro');
  await page.getByLabel('Nombre').fill('Pablo');
  await page.getByLabel('Correo electrónico').fill(correoUnico('pablo'));
  await page.getByLabel('Contraseña').fill(CONTRASENA);
  await page.getByLabel('Fecha de nacimiento').fill(NACIMIENTO_MENOR);
  await page.getByLabel('Correo de tu padre, madre o tutor legal').fill(correoUnico('tutor'));
  await page.getByRole('button', { name: 'Registrarme' }).click();
  await expect(page.getByText('Tu cuenta está pendiente de confirmación')).toBeVisible();

  // 2. Genera el código de vínculo en la pantalla de cuenta pendiente.
  await page.getByRole('button', { name: 'Generar código' }).click();
  const codigo = (await page.getByLabel('Código de vínculo').textContent())!.trim();
  expect(codigo).toMatch(/^[A-Z0-9]{6}$/);

  // 3. La madre, en su propio navegador, lo introduce en Familia.
  const contextoMadre = await browser.newContext();
  const paginaMadre = await contextoMadre.newPage();
  await entrarComo(paginaMadre, madre.tokenAcceso, '/familia');
  await paginaMadre.getByLabel('Código', { exact: true }).fill(codigo);
  await paginaMadre.getByRole('button', { name: 'Vincular' }).click();
  await expect(paginaMadre.getByText('Has confirmado la cuenta de Pablo: ya puede usar FocusFlow.')).toBeVisible();

  // 4. El menor ya puede entrar (se salta el asistente de bienvenida).
  await page.getByRole('button', { name: 'Ya lo ha confirmado' }).click();
  await page.getByRole('button', { name: 'Saltar' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  // 5. Apunta una tarea, pide que la revise su madre y la marca como hecha.
  await page.getByPlaceholder('¿Qué tienes en mente?').fill('Maqueta del volcán');
  await page.getByRole('button', { name: 'Capturar' }).click();
  await page.goto('/kanban');
  await page.getByRole('button', { name: 'Maqueta del volcán' }).click();
  const ficha = page.getByRole('dialog');
  // Cada cambio se guarda al momento; se espera a que llegue al servidor,
  // como pasaría con una persona de verdad.
  const guardado = () => page.waitForResponse((r) => r.url().includes('/tareas/') && r.request().method() === 'PATCH');
  await Promise.all([guardado(), ficha.getByLabel('Revisión').selectOption({ label: 'Elena' })]);
  await Promise.all([guardado(), ficha.getByLabel('Estado').selectOption({ label: 'Hecha' })]);
  await page.keyboard.press('Escape');

  // 6. La madre la ve pendiente de revisión y la aprueba.
  await paginaMadre.reload();
  await expect(paginaMadre.getByText('Por revisar (1)')).toBeVisible();
  await paginaMadre.getByRole('button', { name: 'Aprobar' }).click();
  await expect(paginaMadre.getByText('No hay nada pendiente de revisar.')).toBeVisible();

  // 7. Al menor le llega el aviso de que está aprobada.
  const tokenMenor = (await tokenDe(page))!;
  const tareas = await llamarApi(request, tokenMenor, 'get', '/tareas');
  expect(tareas.find((tarea: { titulo: string }) => tarea.titulo === 'Maqueta del volcán')).toMatchObject({
    estado: 'HECHA',
    estadoRevision: 'APROBADA',
  });
  await page.goto('/recordatorios');
  await expect(page.getByText('Elena ha aprobado «Maqueta del volcán»')).toBeVisible();

  await contextoMadre.close();
});

test('un menor con la cuenta pendiente no puede usar el código de otro menor para confirmarse', async ({
  request,
}) => {
  const menorPendiente = await registrarPorApi(request, {
    nombre: 'Lucas',
    fechaNacimiento: NACIMIENTO_MENOR,
    correoTutor: correoUnico('tutor'),
  });
  const { codigo } = await llamarApi(request, menorPendiente.tokenAcceso, 'post', '/familia/codigo');

  // Dos menores sin confirmar no pueden confirmarse el uno al otro: vincular
  // exige tener la cuenta confirmada (y, además, ser adulto).
  const otroMenor = await registrarPorApi(request, {
    nombre: 'Hugo',
    fechaNacimiento: NACIMIENTO_MENOR,
    correoTutor: correoUnico('tutor'),
  });
  const respuesta = await request.post(`${API_E2E}/familia/vincular`, {
    headers: { Authorization: `Bearer ${otroMenor.tokenAcceso}` },
    data: { codigo },
  });
  expect(respuesta.status()).toBe(403);
  expect((await respuesta.json()).codigo).toBe('CONSENTIMIENTO_PENDIENTE');
});
