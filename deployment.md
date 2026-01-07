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


**Startovací příkaz (Start Command):**
```bash
node server.js
```

**Build:**
```bash
npm run build
```
Automaticky spustí `npm install`. Pro sestavení frontendu je potřeba zajistit, aby proběhl `npm run build`. V souboru `package.json` je tento krok nastaven v sekci `scripts`.
