# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: form.spec.ts >> Formulář pro zadání údajů >> validace zobrazí chybu při chybějících povinných polích
- Location: tests\e2e\form.spec.ts:108:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/vyplňte všechna povinná pole/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/vyplňte všechna povinná pole/i)

```

```yaml
- banner:
  - img "Logo Zetor"
  - navigation:
    - button "Přejít na formulář": Formulář
    - button "Přejít na ceník": Ceník
    - button "Přejít na admin": Admin
- main:
  - dialog "Chyba ve formuláři":
    - heading "Chyba ve formuláři" [level=3]
    - paragraph: Do pole "Fotodokumentace vozidla" je nutné nahrát alespoň 3 soubory.
    - button "Zavřít"
  - heading "Formulář pro zadání údajů" [level=2]
  - paragraph: Pole označená * jsou povinná.
  - heading "Kontaktní údaje" [level=3]
  - text: Kontaktní osoba *
  - textbox "Kontaktní osoba *"
  - text: Firma
  - textbox "Firma"
  - text: Ulice a číslo popisné *
  - textbox "Ulice a číslo popisné *"
  - text: Město *
  - textbox "Město *"
  - text: PSČ *
  - textbox "PSČ *"
  - text: Email *
  - textbox "Email *"
  - text: Telefon *
  - textbox "Telefon *"
  - checkbox "Kontaktní údaje, majitel a fakturační údaje jsou stejné"
  - text: Kontaktní údaje, majitel a fakturační údaje jsou stejné
  - heading "Majitel traktoru" [level=3]
  - text: Jméno/Firma
  - textbox "Jméno/Firma"
  - text: Ulice a číslo popisné
  - textbox "Ulice a číslo popisné"
  - text: Město
  - textbox "Město"
  - text: PSČ
  - textbox "PSČ"
  - checkbox "Majitel a fakturační údaje jsou stejné"
  - text: Majitel a fakturační údaje jsou stejné
  - heading "Fakturační údaje" [level=3]
  - text: Jméno/Firma *
  - textbox "Jméno/Firma *"
  - text: Ulice a číslo popisné *
  - textbox "Ulice a číslo popisné *"
  - text: Město *
  - textbox "Město *"
  - text: PSČ *
  - textbox "PSČ *"
  - text: IČO
  - textbox "IČO"
  - text: DIČ
  - textbox "DIČ"
  - checkbox "Chci papírovou fakturu"
  - text: Chci papírovou fakturu
  - heading "Popis požadavku" [level=3]
  - text: Váš požadavek *
  - textbox "Váš požadavek *":
    - /placeholder: Popište prosím co nejpodrobněji Váš požadavek...
  - heading "Přílohy" [level=3]
  - text: Kopie technického průkazu (JPG, PDF) * Nahrát soubory
  - button "Nahrát soubory"
  - paragraph: nebo přetáhněte
  - paragraph: JPG nebo PDF
  - text: Osvědčení o registraci vozidla (JPG, PDF) * Nahrát soubory
  - button "Nahrát soubory"
  - paragraph: nebo přetáhněte
  - paragraph: JPG nebo PDF
  - text: Fotka výrobního štítku vozidla (JPG, PDF) * Nahrát soubory
  - button "Nahrát soubory"
  - paragraph: nebo přetáhněte
  - paragraph: JPG nebo PDF
  - text: Doklad o montáži od autorizovaného servisu (JPG, PDF) Nahrát soubory
  - button "Nahrát soubory"
  - paragraph: nebo přetáhněte
  - paragraph: JPG nebo PDF
  - text: Fotodokumentace vozidla (minimálně 3 soubory) * Nahrát soubory
  - button "Nahrát soubory"
  - paragraph: nebo přetáhněte
  - paragraph: JPG nebo PDF
  - checkbox "Souhlasím se zpracováním osobních údajů *"
  - text: Souhlasím se zpracováním osobních údajů *
  - button "Odeslat"
- contentinfo:
  - heading "Něco nefunguje?" [level=3]
  - list:
    - listitem:
      - link "pomuzu@vam.cz":
        - /url: mailto:pomuzu@vam.cz
    - listitem:
      - link "tel:+ 123 456 789":
        - /url: tel:+420123456789
```

# Test source

```ts
  12  |   const filePath = path.join(os.tmpdir(), name);
  13  |   // Minimální validní JPEG (1x1 pixel)
  14  |   const jpegBytes = Buffer.from(
  15  |     'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000000013f00ffd9',
  16  |     'hex'
  17  |   );
  18  |   fs.writeFileSync(filePath, jpegBytes);
  19  |   return filePath;
  20  | }
  21  | 
  22  | async function uploadFile(page: Page, inputId: string, filePath: string) {
  23  |   const fileInput = page.locator(`#${inputId}`);
  24  |   await fileInput.setInputFiles(filePath);
  25  | }
  26  | 
  27  | test.describe('Formulář pro zadání údajů', () => {
  28  |   test.beforeEach(async ({ page }) => {
  29  |     await page.goto('/');
  30  |   });
  31  | 
  32  |   test('úspěšné odeslání formuláře se všemi povinnými poli', async ({ page }) => {
  33  |     // Vytvořit dočasné soubory
  34  |     const doc1 = createTempJpeg('tp_kopie.jpg');
  35  |     const reg1 = createTempJpeg('osveceni_registrace.jpg');
  36  |     const plate1 = createTempJpeg('vyrobni_stitek.jpg');
  37  |     const veh1 = createTempJpeg('foto_vozidla_1.jpg');
  38  |     const veh2 = createTempJpeg('foto_vozidla_2.jpg');
  39  |     const veh3 = createTempJpeg('foto_vozidla_3.jpg');
  40  | 
  41  |     try {
  42  |       // === Kontaktní údaje ===
  43  |       await page.fill('#contactPerson', 'Jan Novák');
  44  |       await page.fill('#company', 'Novák s.r.o.');
  45  |       await page.fill('#contactStreet', 'Hlavní 123');
  46  |       await page.fill('#contactCity', 'Brno');
  47  |       await page.fill('#contactZip', '60200');
  48  |       await page.fill('#email', 'jan.novak@example.com');
  49  |       await page.fill('#phone', '+420 777 123 456');
  50  | 
  51  |       // === Majitel traktoru ===
  52  |       await page.fill('#tractorOwnerName', 'Jan Novák');
  53  |       await page.fill('#tractorOwnerStreet', 'Hlavní 123');
  54  |       await page.fill('#tractorOwnerCity', 'Brno');
  55  |       await page.fill('#tractorOwnerZip', '60200');
  56  | 
  57  |       // === Fakturační údaje ===
  58  |       await page.fill('#billingName', 'Novák s.r.o.');
  59  |       await page.fill('#billingStreet', 'Hlavní 123');
  60  |       await page.fill('#billingCity', 'Brno');
  61  |       await page.fill('#billingZip', '60200');
  62  |       await page.fill('#ico', '12345678');
  63  |       await page.fill('#dic', 'CZ12345678');
  64  | 
  65  |       // === Popis požadavku ===
  66  |       await page.fill('#requestDescription', 'Žádám o vydání prohlášení o shodě pro traktor Zetor 8.');
  67  | 
  68  |       // === Přílohy ===
  69  |       await uploadFile(page, 'document-upload', doc1);
  70  |       await uploadFile(page, 'registration-certificate-upload', reg1);
  71  |       await uploadFile(page, 'vehicle-plate-photo-upload', plate1);
  72  |       // Fotodokumentace – minimum 3 soubory
  73  |       await uploadFile(page, 'vehicle-documentation-upload', veh1);
  74  |       await uploadFile(page, 'vehicle-documentation-upload', veh2);
  75  |       await uploadFile(page, 'vehicle-documentation-upload', veh3);
  76  | 
  77  |       // === Souhlas se zpracováním osobních údajů ===
  78  |       await page.check('#consent');
  79  | 
  80  |       // === Odeslat formulář ===
  81  |       await page.click('button[type="submit"]');
  82  | 
  83  |       // Ověřit úspěšné odeslání – modal s potvrzením
  84  |       await expect(page.getByText('Odeslání úspěšné')).toBeVisible({ timeout: 10000 });
  85  |       await expect(page.getByText('Vaše údaje byly úspěšně odeslány. Děkujeme.')).toBeVisible();
  86  | 
  87  |     } finally {
  88  |       [doc1, reg1, plate1, veh1, veh2, veh3].forEach(f => {
  89  |         try { fs.unlinkSync(f); } catch {}
  90  |       });
  91  |     }
  92  |   });
  93  | 
  94  |   test('zkratka "stejné údaje" zkopíruje kontaktní data do všech sekcí', async ({ page }) => {
  95  |     await page.fill('#contactPerson', 'Petr Svoboda');
  96  |     await page.fill('#contactStreet', 'Nová 5');
  97  |     await page.fill('#contactCity', 'Praha');
  98  |     await page.fill('#contactZip', '11000');
  99  | 
  100 |     await page.check('#sameAsContact');
  101 | 
  102 |     await expect(page.locator('#billingName')).toHaveValue('Petr Svoboda');
  103 |     await expect(page.locator('#billingStreet')).toHaveValue('Nová 5');
  104 |     await expect(page.locator('#billingCity')).toHaveValue('Praha');
  105 |     await expect(page.locator('#billingZip')).toHaveValue('11000');
  106 |   });
  107 | 
  108 |   test('validace zobrazí chybu při chybějících povinných polích', async ({ page }) => {
  109 |     await page.click('button[type="submit"]');
  110 | 
  111 |     await expect(page.getByText('Chyba ve formuláři')).toBeVisible();
> 112 |     await expect(page.getByText(/vyplňte všechna povinná pole/i)).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  113 |   });
  114 | 
  115 |   test('validace vyžaduje minimálně 3 soubory fotodokumentace', async ({ page }) => {
  116 |     const veh1 = createTempJpeg('veh_test_1.jpg');
  117 |     const veh2 = createTempJpeg('veh_test_2.jpg');
  118 | 
  119 |     try {
  120 |       // Vyplnit jen fotodokumentaci (jen 2 soubory – nestačí)
  121 |       await uploadFile(page, 'vehicle-documentation-upload', veh1);
  122 |       await uploadFile(page, 'vehicle-documentation-upload', veh2);
  123 | 
  124 |       await page.click('button[type="submit"]');
  125 | 
  126 |       await expect(page.getByText(/alespoň 3 soubory/i)).toBeVisible();
  127 |     } finally {
  128 |       [veh1, veh2].forEach(f => {
  129 |         try { fs.unlinkSync(f); } catch {}
  130 |       });
  131 |     }
  132 |   });
  133 | 
  134 |   test('soubor v nesprávném formátu je odmítnut', async ({ page }) => {
  135 |     const tmpTxt = path.join(os.tmpdir(), 'invalid_test.txt');
  136 |     fs.writeFileSync(tmpTxt, 'tohle neni obrazek');
  137 | 
  138 |     try {
  139 |       const fileInput = page.locator('#document-upload');
  140 |       await fileInput.setInputFiles(tmpTxt);
  141 | 
  142 |       await expect(page.getByText('Chybný formát souboru')).toBeVisible();
  143 |       await expect(page.getByText(/Přijímáme pouze JPG a PDF/i)).toBeVisible();
  144 |     } finally {
  145 |       try { fs.unlinkSync(tmpTxt); } catch {}
  146 |     }
  147 |   });
  148 | });
  149 | 
```