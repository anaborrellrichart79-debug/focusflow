import { expect, test } from '@playwright/test';
import { CONTRASENA, correoUnico, NACIMIENTO_ADULTO } from './apoyo';

test('una persona adulta se registra, cierra sesión y vuelve a entrar', async ({ page }) => {
  const correo = correoUnico('marta');

  await page.goto('/registro');
  await page.getByLabel('Nombre').fill('Marta');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(CONTRASENA);
  await page.getByLabel('Fecha de nacimiento').fill(NACIMIENTO_ADULTO);
  await page.getByRole('button', { name: 'Registrarme' }).click();

  // Una persona adulta entra directamente, sin esperar a ningún tutor.
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
  await expect(page.getByText('Hola, Marta')).toBeVisible();

  // La sesión sigue al recargar.
  await page.reload();
  await expect(page.getByText('Hola, Marta')).toBeVisible();
});
