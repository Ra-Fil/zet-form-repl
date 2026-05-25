import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Pomocné funkce pro vytvoření dočasných testovacích souborů
function createTempJpeg(name: string): string {
  const filePath = path.join(os.tmpdir(), name);
  // Minimální validní JPEG (1x1 pixel)
  const jpegBytes = Buffer.from(
    'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000000013f00ffd9',
    'hex'
  );
  fs.writeFileSync(filePath, jpegBytes);
  return filePath;
}

async function uploadFile(page: Page, inputId: string, filePath: string) {
  const fileInput = page.locator(`#${inputId}`);
  await fileInput.setInputFiles(filePath);
}

test.describe('Formulář pro zadání údajů', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('úspěšné odeslání formuláře se všemi povinnými poli', async ({ page }) => {
    // Vytvořit dočasné soubory
    const doc1 = createTempJpeg('tp_kopie.jpg');
    const reg1 = createTempJpeg('osveceni_registrace.jpg');
    const plate1 = createTempJpeg('vyrobni_stitek.jpg');
    const veh1 = createTempJpeg('foto_vozidla_1.jpg');
    const veh2 = createTempJpeg('foto_vozidla_2.jpg');
    const veh3 = createTempJpeg('foto_vozidla_3.jpg');

    try {
      // === Kontaktní údaje ===
      await page.fill('#contactPerson', 'Jan Novák');
      await page.fill('#company', 'Novák s.r.o.');
      await page.fill('#contactStreet', 'Hlavní 123');
      await page.fill('#contactCity', 'Brno');
      await page.fill('#contactZip', '60200');
      await page.fill('#email', 'jan.novak@example.com');
      await page.fill('#phone', '+420 777 123 456');

      // === Majitel traktoru ===
      await page.fill('#tractorOwnerName', 'Jan Novák');
      await page.fill('#tractorOwnerStreet', 'Hlavní 123');
      await page.fill('#tractorOwnerCity', 'Brno');
      await page.fill('#tractorOwnerZip', '60200');

      // === Fakturační údaje ===
      await page.fill('#billingName', 'Novák s.r.o.');
      await page.fill('#billingStreet', 'Hlavní 123');
      await page.fill('#billingCity', 'Brno');
      await page.fill('#billingZip', '60200');
      await page.fill('#ico', '12345678');
      await page.fill('#dic', 'CZ12345678');

      // === Popis požadavku ===
      await page.fill('#requestDescription', 'Žádám o vydání prohlášení o shodě pro traktor Zetor 8.');

      // === Přílohy ===
      await uploadFile(page, 'document-upload', doc1);
      await uploadFile(page, 'registration-certificate-upload', reg1);
      await uploadFile(page, 'vehicle-plate-photo-upload', plate1);
      // Fotodokumentace – minimum 3 soubory
      await uploadFile(page, 'vehicle-documentation-upload', veh1);
      await uploadFile(page, 'vehicle-documentation-upload', veh2);
      await uploadFile(page, 'vehicle-documentation-upload', veh3);

      // === Souhlas se zpracováním osobních údajů ===
      await page.check('#consent');

      // === Odeslat formulář ===
      await page.click('button[type="submit"]');

      // Ověřit úspěšné odeslání – modal s potvrzením
      await expect(page.getByText('Odeslání úspěšné')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Vaše údaje byly úspěšně odeslány. Děkujeme.')).toBeVisible();

    } finally {
      [doc1, reg1, plate1, veh1, veh2, veh3].forEach(f => {
        try { fs.unlinkSync(f); } catch {}
      });
    }
  });

  test('zkratka "stejné údaje" zkopíruje kontaktní data do všech sekcí', async ({ page }) => {
    await page.fill('#contactPerson', 'Petr Svoboda');
    await page.fill('#contactStreet', 'Nová 5');
    await page.fill('#contactCity', 'Praha');
    await page.fill('#contactZip', '11000');

    await page.check('#sameAsContact');

    await expect(page.locator('#billingName')).toHaveValue('Petr Svoboda');
    await expect(page.locator('#billingStreet')).toHaveValue('Nová 5');
    await expect(page.locator('#billingCity')).toHaveValue('Praha');
    await expect(page.locator('#billingZip')).toHaveValue('11000');
  });

  test('validace zobrazí chybu při chybějících povinných polích', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.getByText('Chyba ve formuláři')).toBeVisible();
    await expect(page.getByText(/vyplňte všechna povinná pole/i)).toBeVisible();
  });

  test('validace vyžaduje minimálně 3 soubory fotodokumentace', async ({ page }) => {
    const veh1 = createTempJpeg('veh_test_1.jpg');
    const veh2 = createTempJpeg('veh_test_2.jpg');

    try {
      // Vyplnit jen fotodokumentaci (jen 2 soubory – nestačí)
      await uploadFile(page, 'vehicle-documentation-upload', veh1);
      await uploadFile(page, 'vehicle-documentation-upload', veh2);

      await page.click('button[type="submit"]');

      await expect(page.getByText(/alespoň 3 soubory/i)).toBeVisible();
    } finally {
      [veh1, veh2].forEach(f => {
        try { fs.unlinkSync(f); } catch {}
      });
    }
  });

  test('soubor v nesprávném formátu je odmítnut', async ({ page }) => {
    const tmpTxt = path.join(os.tmpdir(), 'invalid_test.txt');
    fs.writeFileSync(tmpTxt, 'tohle neni obrazek');

    try {
      const fileInput = page.locator('#document-upload');
      await fileInput.setInputFiles(tmpTxt);

      await expect(page.getByText('Chybný formát souboru')).toBeVisible();
      await expect(page.getByText(/Přijímáme pouze JPG a PDF/i)).toBeVisible();
    } finally {
      try { fs.unlinkSync(tmpTxt); } catch {}
    }
  });
});
