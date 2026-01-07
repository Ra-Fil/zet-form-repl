## 1. Příprava databáze
1. Na Rosti.cz si vytvořte novou **PostgreSQL** databázi.
2. Poznamenejte si připojovací řetězec (Connection String), bude vypadat přibližně takto:
   `postgres://uzivatel:heslo@host:port/databaze`

## 2. Nastavení v administraci Rosti.cz
V nastavení aplikace na Rosti přidejte následující **Environment Variables**:

| Proměnná | Hodnota | Popis |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Váš připojovací řetězec k DB |
| `ADMIN_USERNAME` | `z` | Uživatelské jméno pro admina |
| `ADMIN_PASSWORD` | `1` | Heslo pro admina |
| `NODE_ENV` | `production` | Nutné pro správné fungování SSL |
| `SMTP_HOST` | `smtp.vashosting.cz` | Hostitel SMTP serveru |
| `SMTP_PORT` | `587` | Port SMTP (obvykle 587 nebo 465) |
| `SMTP_USER` | `info@vasedomena.cz` | Uživatelské jméno k emailu |
| `SMTP_PASS` | `vaše-heslo` | Heslo k emailu |
| `SMTP_FROM` | `Zetor Formulář <info@vasedomena.cz>` | Odesílatel emailu |
| `NOTIFICATION_EMAILS` | `admin1@zetor.cz, admin2@zetor.cz` | Seznam emailů pro oznámení (oddělené čárkou) |

## 3. Deployment (Nasazení)
Aplikace je nakonfigurována tak, aby se při startu automaticky spustily správné procesy.

**Startovací příkaz (Start Command):**
```bash
node server.js
```

**Build:**
```bash
npm run build
```

**Buildovací příkaz (Build Command):**
Rosti automaticky spustí `npm install`. Pro sestavení frontendu je potřeba zajistit, aby proběhl `npm run build`. V souboru `package.json` je tento krok nastaven v sekci `scripts`.

## 4. Důležité poznámky
- **Port:** Aplikace automaticky detekuje port z proměnné `PORT`, kterou Rosti nastavuje (obvykle 8080).
- **SSL:** Připojení k databázi je nastaveno tak, aby v produkčním prostředí vyžadovalo SSL (podporuje Rosti i Neon.tech).
- **Static Files:** Server v souboru `server.js` automaticky servíruje soubory ze složky `dist`, kterou vytvoří build proces.