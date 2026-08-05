# Bokningsbackend — Google Apps Script

Formuläret på sajten POST:ar till en liten Apps Script som körs på ditt
`jechnotechno@gmail.com`-konto. Skriptet **mejlar dig** förfrågan och lägger en
**preliminär kalenderhändelse** på önskat datum. Gratis, ingen server.

## Engångs-setup

1. Gå till <https://script.google.com> — **inloggad som `jechnotechno@gmail.com`**.
2. **New project**. Klistra in innehållet från [`booking.gs`](./booking.gs) i `Code.gs`.
3. (Valfritt) Sätt `SHARED_SECRET` till en hemlig sträng för att blockera spam,
   och lägg samma värde i formulärets payload (se not nedan).
4. **Deploy → New deployment → Type: Web app**
   - **Description:** `booking endpoint`
   - **Execute as:** `Me (jechnotechno@gmail.com)`
   - **Who has access:** `Anyone`
5. **Deploy** → **Authorize access** → välj `jechnotechno`-kontot → godkänn
   Gmail- (skicka mejl) och Calendar-behörigheterna. (Ser du "unverified app":
   *Advanced → Go to project (unsafe)* — det är din egen kod.)
6. Kopiera **Web app URL** (slutar på `/exec`).
7. I projektroten: skapa `.env` (kopiera från `.env.example`) och klistra in:
   ```
   VITE_BOOKING_ENDPOINT=https://script.google.com/macros/s/XXXX/exec
   ```
8. Starta om `yarn dev` (Vite läser `.env` vid start).

## Uppdatera koden senare

Ändra i editorn → **Deploy → Manage deployments → (pennan) → New version → Deploy**.
Redigera **samma** deployment så att `/exec`-URL:en är oförändrad — då behöver du
inte röra `.env`.

## Testa utan frontend

```bash
curl -L -X POST "https://script.google.com/macros/s/XXXX/exec" \
  -H "Content-Type: text/plain" \
  -d '{"name":"Test","email":"test@example.com","date":"2026-09-01","location":"Under Bron","message":"Testset"}'
```

Kolla att ett mejl landar i `jechnotechno@gmail.com` och att en händelse dyker
upp i kontots standardkalender på datumet.

## Spamskydd

Ingen captcha, ingen tredjepart. Sju lager, alla i `booking.gs`:

| Lager | Vad som händer |
| --- | --- |
| Delad hemlighet | `SHARED_SECRET` måste matcha `VITE_BOOKING_TOKEN` — stoppar skript som aldrig laddat sajten |
| Honeypot | Dolda fälten `company`/`website` måste vara tomma |
| Tidsspärr | Under 3 s ifyllnadstid (eller äldre flik än 6 h) = bot |
| Storleksgränser | Body > 8 kB, meddelande > 2 000 tecken, radbrytningar i namn/e-post → avvisas |
| Frekvensgränser | 3 per e-postadress/6 h, 15/timme, 40/dygn (skyddar även Gmails sändkvot) |
| Dubblettspärr | Identisk förfrågan inom en timme skickas inte igen |
| Länkheuristik | Länkspam **flaggas** med `[MÖJLIG SPAM]` i ämnesraden och hoppar över kalendern — kastas inte, så äkta bokningar aldrig försvinner |

Avvisade anrop får alltid `{ok:true}` tillbaka, så en bot lär sig inget om
varför. Orsaken loggas i Apps Script → **Executions**.

**Sätt hemligheten** (gör detta, annars är lager 1 avstängt):

1. Generera: `openssl rand -hex 24`
2. `booking.gs`: `var SHARED_SECRET = '<värdet>';` → deploya ny version
3. `.env`: `VITE_BOOKING_TOKEN=<samma värde>` → bygg om och deploya sajten

Värdet bakas in i klientkoden och går att läsa i webbläsaren — det är ett
spamfilter, inte autentisering. Byt det om spammen ändå hittar in.

Vill du justera trösklarna ligger de samlade högst upp i `booking.gs`
(`MIN_FILL_MS`, `MAX_PER_EMAIL_PER_6H`, `MAX_TOTAL_PER_HOUR`, …).
