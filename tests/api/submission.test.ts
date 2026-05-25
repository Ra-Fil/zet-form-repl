/**
 * API integrační test – POST /api/submissions
 * Spusť: npx tsx tests/api/submission.test.ts
 * Vyžaduje běžící server (npm run dev:server nebo npm start)
 */

const BASE_URL: string = process.env.API_URL ?? 'http://localhost:8080';

interface TestFile {
  name: string;
  mimeType: string;
  data: string;
}

interface SubmissionPayload {
  contactPerson: string;
  company?: string;
  email: string;
  phone: string;
  contactStreet: string;
  contactCity: string;
  contactZip: string;
  billingName: string;
  billingStreet: string;
  billingCity: string;
  billingZip: string;
  ico?: string;
  dic?: string;
  wantsPaperInvoice: boolean;
  tractorOwnerName?: string;
  tractorOwnerStreet?: string;
  tractorOwnerCity?: string;
  tractorOwnerZip?: string;
  requestDescription: string;
  documents: TestFile[];
  registrationCertificates: TestFile[];
  vehiclePlatePhotos: TestFile[];
  installationDocuments: TestFile[];
  vehicleDocumentationPhotos: TestFile[];
}

interface PostResult<T = unknown> {
  status: number;
  body: T;
}

function minimalJpegBase64(): string {
  return (
    'data:image/jpeg;base64,' +
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='
  );
}

function makeFile(name: string): TestFile {
  return { name, mimeType: 'image/jpeg', data: minimalJpegBase64() };
}

async function runTest(name: string, fn: () => Promise<void>): Promise<boolean> {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log('✓');
    return true;
  } catch (err) {
    console.log('✗');
    console.error(`    ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function post<T = unknown>(url: string, body: unknown): Promise<PostResult<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as T };
}

const validSubmission: SubmissionPayload = {
  contactPerson: 'Jan Novák',
  company: 'Novák s.r.o.',
  email: 'jan.novak@example.com',
  phone: '+420 777 123 456',
  contactStreet: 'Hlavní 123',
  contactCity: 'Brno',
  contactZip: '60200',
  billingName: 'Novák s.r.o.',
  billingStreet: 'Hlavní 123',
  billingCity: 'Brno',
  billingZip: '60200',
  ico: '12345678',
  dic: 'CZ12345678',
  wantsPaperInvoice: false,
  tractorOwnerName: 'Jan Novák',
  tractorOwnerStreet: 'Hlavní 123',
  tractorOwnerCity: 'Brno',
  tractorOwnerZip: '60200',
  requestDescription: 'Žádám o vydání prohlášení o shodě pro traktor Zetor 8.',
  documents: [makeFile('tp_kopie.jpg')],
  registrationCertificates: [makeFile('osveceni_registrace.jpg')],
  vehiclePlatePhotos: [makeFile('vyrobni_stitek.jpg')],
  installationDocuments: [],
  vehicleDocumentationPhotos: [
    makeFile('foto_1.jpg'),
    makeFile('foto_2.jpg'),
    makeFile('foto_3.jpg'),
  ],
};

console.log(`\nAPI testy – ${BASE_URL}\n`);

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const ok = await runTest(name, fn);
  ok ? passed++ : failed++;
}

// Test 1: Úspěšné odeslání
await test('POST /api/submissions – úspěšné odeslání', async () => {
  const { status, body } = await post<{ id: string }>(
    `${BASE_URL}/api/submissions`,
    validSubmission
  );
  assert(status === 201, `Očekáván status 201, dostal ${status}`);
  assert(typeof body.id === 'string', 'Odpověď musí obsahovat pole "id"');
  assert(body.id.length > 0, '"id" nesmí být prázdné');
  process.stdout.write(`(id: ${body.id}) `);
});

// Test 2: Chybějící povinné pole
await test('POST /api/submissions – chybějící contactPerson vrátí chybu', async () => {
  const { contactPerson: _removed, ...noName } = validSubmission;
  const { status } = await post(`${BASE_URL}/api/submissions`, noName);
  assert(status >= 400, `Očekáván status >= 400, dostal ${status}`);
});

// Test 3: Ověření uloženého záznamu
await test('GET /api/submissions/:id – záznam existuje po odeslání', async () => {
  const { body: createBody } = await post<{ id: string }>(
    `${BASE_URL}/api/submissions`,
    { ...validSubmission, contactPerson: 'Test Záznam ' + Date.now() }
  );
  const id = createBody.id;

  const res = await fetch(`${BASE_URL}/api/submissions/${id}`);
  assert(res.status === 200, `GET vrátil ${res.status}`);

  const data = await res.json() as {
    id: string;
    status: string;
    documents: unknown[];
    vehicleDocumentationPhotos: unknown[];
  };
  assert(data.id === id, 'Vrácené id nesouhlasí');
  assert(data.status === 'Nový požadavek', `Neočekávaný status: ${data.status}`);
  assert(Array.isArray(data.documents), 'Chybí pole documents');
  assert(data.documents.length === 1, 'Měl by být 1 dokument');
  assert(data.vehicleDocumentationPhotos.length === 3, 'Měly by být 3 foto dokumentace');
});

// Test 4: Přihlášení admina – platné údaje
await test('POST /api/login – platné přihlašovací údaje', async () => {
  const { status, body } = await post<{ success: boolean }>(
    `${BASE_URL}/api/login`,
    { username: 'z', password: '1' }
  );
  assert(status === 200, `Očekáván status 200, dostal ${status}`);
  assert(body.success === true, 'Přihlášení nebylo úspěšné');
});

// Test 5: Přihlášení admina – neplatné údaje
await test('POST /api/login – neplatné přihlašovací údaje vrátí 401', async () => {
  const { status } = await post(`${BASE_URL}/api/login`, { username: 'wrong', password: 'wrong' });
  assert(status === 401, `Očekáván status 401, dostal ${status}`);
});

console.log(`\nVýsledek: ${passed} prošlo, ${failed} selhalo\n`);
process.exit(failed > 0 ? 1 : 0);
