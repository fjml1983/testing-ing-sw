import { test, expect } from '@playwright/test';

test.describe('Pruebas de Operaciones con Limpieza', () => {
  // Definimos un título único para evitar colisiones entre tests
  const operacionTitulo = `Test-Operacion-${Date.now()}`;

  // Este bloque se ejecuta SIEMPRE al terminar cada test, incluso si fallan
  test.afterEach(async ({ request }) => {
    const response = await request.delete('http://localhost:3001/api/operations', {
      params: {
        title: 'Rapido y furioso X3', // Asegúrate de que este título coincida con el que usas en el test
      }
    });

    // Opcional: Validar que la limpieza fue exitosa o que al menos no hubo error 500
    if (response.status() !== 200 && response.status() !== 404) {
      console.error(`Error limpiando datos: ${await response.text()}`);
    }
  });

  test('test-renta-dvd-socio', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'Titulo' }).fill('Rapido y furioso X3');
    await page.getByRole('textbox', { name: 'Anio' }).fill('2005');
    await page.getByLabel('Formato').selectOption('DVD');
    await page.getByLabel('Operacion').selectOption('renta');
    await page.getByRole('textbox', { name: 'Nombre del socio' }).fill('JUAN PEREZ');
    await page.getByRole('button', { name: 'Confirmar registro' }).click();
    await expect(page.getByText('Operacion registrada')).toBeVisible();
  });

});