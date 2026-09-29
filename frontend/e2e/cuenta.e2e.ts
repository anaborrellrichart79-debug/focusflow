import { expect, test } from '@playwright/test';
import { CONTRASENA, correoUnico, NACIMIENTO_ADULTO } from './apoyo';

test('una estudiante se registra, completa el asistente de bienvenida con su horario y vuelve a entrar', async ({
  page,
}) => {
  const correo = correoUnico('marta');

  await page.goto('/registro');
  await page.getByLabel('Nombre').fill('Marta');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(CONTRASENA);
  await page.getByLabel('Fecha de nacimiento').fill(NACIMIENTO_ADULTO);
  await page.getByRole('button', { name: 'Registrarme' }).click();

  // Una persona adulta entra directamente, sin esperar a ningún tutor, y lo
  // primero es el asistente de bienvenida.
  await expect(page.getByText('¡Hola, Marta! ¿Para qué vas a usar FocusFlow?')).toBeVisible();
  await page.getByRole('checkbox', { name: /Estudiante/ }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Sí, activarlo' }).click();
  await page.getByLabel('Grupo').fill('4º B');
  // El nombre de un desplegable incluye la opción elegida ("Curso Elige…").
  await page.getByRole('combobox', { name: /^Curso/ }).selectOption('primaria-4');
  await page.getByRole('combobox', { name: /^Comunidad autónoma/ }).selectOption('COMUNITAT_VALENCIANA');
  await page.getByRole('button', { name: 'Crear horario' }).click();
  await expect(page.getByText('¡Todo listo!')).toBeVisible();
  await page.getByRole('button', { name: 'Rellenar mi horario' }).click();

  // Lleva a su horario ya creado, con el modo escolar activo.
  await expect(page).toHaveURL(/\/horario$/);
  await expect(page.getByText('4º B')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Planificador escolar' })).toBeVisible();

  await page.getByRole('link', { name: 'Inicio' }).click();
  await expect(page.getByText('Hola, Marta')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  // Cerrar sesión lleva a la portada pública, con el enlace para entrar.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  // Con una contraseña equivocada no entra, y el error sale traducido.
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill('Equivocada1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();

  await page.getByLabel('Contraseña').fill(CONTRASENA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // El asistente ya no vuelve a salir.
  await expect(page.getByText('Hola, Marta')).toBeVisible();

  // La sesión sigue al recargar.
  await page.reload();
  await expect(page.getByText('Hola, Marta')).toBeVisible();
});
