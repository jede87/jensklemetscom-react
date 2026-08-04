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

## Not om `SHARED_SECRET`

Om du sätter en hemlighet i skriptet måste formuläret skicka med samma värde.
Lägg då till ett dolt fält i payloaden i `src/components/BookingForm.jsx`
(`body: JSON.stringify({ ...form, lang, token: 'DIN_HEMLIGHET' })`). Eftersom
värdet bakas in i klientkoden är det ett lätt spamfilter, inte en riktig
autentisering.
