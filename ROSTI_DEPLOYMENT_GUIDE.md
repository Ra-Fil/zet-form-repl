# Návod na nasazení aplikace Zetor na Rosti.cz

Tento dokument obsahuje podrobný postup, jak nasadit tuto aplikaci na hosting Rosti.cz pomocí GitHubu.

## 1. Příprava na GitHubu
1. Vytvořte si nový repozitář na svém GitHub účtu.
2. Propojte svůj lokální kód (z Replitu) s tímto repozitářem a nahrajte (push) jej.
   - *Poznámka: Replit obvykle umožňuje přímé propojení s GitHubem v sekci "Git".*

## 2. Nastavení na Rosti.cz
1. Přihlaste se do administrace Rosti.cz.
2. Vytvořte novou aplikaci typu **Node.js**.
3. V sekci **Zdrojový kód** vyberte **GitHub** a propojte svůj repozitář.

## 3. Konfigurace aplikace na Rosti.cz
V administraci Rosti.cz nastavte následující:

### A. Sestavení (Build)
- **Příkaz pro sestavení (Build command):** `npm install && npm run build`

### B. Spuštění (Run)
- **Příkaz pro spuštění (Start command):** `node server.js`

### C. Proměnné prostředí (Environment Variables)
V sekci **Environment variables** přidejte tyto klíče:
- `DATABASE_URL`: Adresa vaší produkční PostgreSQL databáze.
- `ADMIN_USERNAME`: Vaše zvolené uživatelské jméno pro administraci.
- `ADMIN_PASSWORD`: Vaše zvolené heslo pro administraci.
- `NODE_ENV`: `production`

## 4. Databáze
- Pokud používáte databázi přímo u Rosti.cz, vytvořte si ji v jejich administraci.
- Zkopírujte si údaje pro připojení a vložte je do proměnné `DATABASE_URL`.
- Aplikace je nastavena tak, že si tabulky v databázi vytvoří automaticky při prvním spuštění.

## 5. První nasazení
1. Po nastavení všech údajů klikněte na **Uložit a nasadit (Save and Deploy)**.
2. Sledujte logy sestavení. Jakmile proběhne build, aplikace bude dostupná na vaší Rosti.cz URL.

---
**Důležité upozornění:** Nikdy neukládejte hesla přímo do kódu. Vždy používejte proměnné prostředí (Secrets v Replitu / Env vars v Rosti.cz).
