/* Bilingual copy (sv / en).
 * NOTE: bio/DJ text below is a first DRAFT — refine names of gigs, links and
 * exact wording to taste. Structure is stable; just edit the strings. */

export const translations = {
  sv: {
    topbar: { mark: 'JK' },
    hero: {
      name: 'Jens Klemets',
      roles: ['Utvecklare', 'AI', 'DJ'],
      intro:
        'Erfaren mjukvaruutvecklare med ett brinnande intresse för AI. Utanför koden spelar jag på fester, bröllop och event i Stockholmsområdet.',
      ctaBook: 'Skicka bokningsförfrågan',
      ctaWork: 'Vad jag gör',
    },
    dev: {
      kicker: '01 — Utvecklare & AI',
      title: 'Bygger mjukvara. Besatt av AI.',
      lede:
        'Jag har byggt produkter i över ett decennium — från idé till drift — och de senaste åren har handlat om att ta AI från demo till något som faktiskt håller i produktion.',
      body: 'Jag arbetar helst nära problemet: förstår behovet, skissar snabbt och itererar mot något som är enkelt, snabbt och pålitligt. Just nu ligger fokus på tillämpad AI — LLM-drivna produkter, RAG, agent-arbetsflöden och den infrastruktur som får dem att fungera på riktigt.',
      railTitle: 'Inriktning',
      rail: [
        ['Fokus', 'Tillämpad AI & produkt'],
        ['Stack', 'Full-stack, LLM-infra'],
        ['Bas', 'Stockholm'],
      ],
    },
    dj: {
      kicker: '02 — DJ',
      title: 'Musik till din fest.',
      lede:
        'Jag spelar alla typer av musik och har spelat på otaliga fester, bröllop och event i Stockholmsområdet — helst i Nacka och Värmdö. Skicka en Spotify-lista veckan innan med det ni gillar att dansa till — jag sköter resten.',
      body: 'Jag utgår från Nacka och Värmdö och tar mig gärna runt i hela Stockholmsområdet. Med mig har jag komplett DJ-utrustning och högtalare som räcker för 50–150 gäster, och riggen är på plats på en halvtimme till timme. Vid behov fixar jag rökmaskin och ljus via mina DJ-kompisar. Berätta om er kväll i formuläret nedan så återkommer jag med tillgänglighet och pris.',
      railTitle: 'Bokning',
      rail: [
        ['Passar', 'Fest · Bröllop · Event'],
        ['Musik', 'Alla genrer · Open Format'],
        ['Område', 'Nacka · Värmdö · Stockholm'],
        ['Så funkar det', 'Er Spotify-lista i förväg'],
        ['Utrustning', 'DJ-rigg + PA, 50–150 gäster'],
      ],
    },
    booking: {
      kicker: '03 — Bokning',
      title: 'Skicka en bokningsförfrågan',
      lede:
        'Fyll i formuläret så återkommer jag så snart jag kan. Förfrågan skickas till min inkorg och läggs som en preliminär notering i min kalender för det datum du väljer.',
      name: 'Namn',
      email: 'E-post',
      date: 'Önskat datum',
      location: 'Plats / lokal',
      message: 'Meddelande',
      messagePlaceholder: 'Tider, längd på set, budget, övrigt …',
      submit: 'Skicka förfrågan',
      submitting: 'Skickar …',
      successTitle: 'Tack!',
      successBody:
        'Din bokningsförfrågan är skickad. Jag återkommer så snart jag kan.',
      errorTitle: 'Något gick fel',
      errorBody: 'Det gick inte att skicka just nu. Mejla mig gärna direkt:',
      errNotConfigured:
        'Formuläret är inte kopplat ännu (ingen endpoint konfigurerad).',
      errName: 'Ange ditt namn',
      errEmail: 'Ogiltig e-postadress',
      errDate: 'Välj ett datum',
      errDatePast: 'Datumet har redan passerat',
      errLocation: 'Ange plats eller lokal',
    },
    footer: {
      kicker: 'Kontakt',
      tagline: 'Utvecklare med AI-fokus. DJ för fester, bröllop & event i Stockholm.',
      email: 'jechnotechno@gmail.com',
      linkedin: 'LinkedIn',
      soundcloud: 'SoundCloud',
      book: 'Boka',
      rights: 'Jens Klemets',
    },
  },

  en: {
    topbar: { mark: 'JK' },
    hero: {
      name: 'Jens Klemets',
      roles: ['Developer', 'AI', 'DJ'],
      intro:
        'Experienced software developer with a burning interest in AI. Away from the keyboard I DJ parties, weddings and events around Stockholm.',
      ctaBook: 'Send a booking request',
      ctaWork: 'What I do',
    },
    dev: {
      kicker: '01 — Developer & AI',
      title: 'Building software. Obsessed with AI.',
      lede:
        'I’ve been shipping products for over a decade — from idea to production — and the last few years have been about taking AI from demo to something that actually holds up in production.',
      body: 'I like to work close to the problem: understand the need, sketch fast, and iterate toward something simple, fast and reliable. Right now my focus is applied AI — LLM-driven products, RAG, agent workflows, and the infrastructure that makes them real.',
      railTitle: 'Focus',
      rail: [
        ['Focus', 'Applied AI & product'],
        ['Stack', 'Full-stack, LLM infra'],
        ['Based', 'Stockholm'],
      ],
    },
    dj: {
      kicker: '02 — DJ',
      title: 'Music for your party.',
      lede:
        'I play all kinds of music and have DJ’d countless parties, weddings and events around Stockholm — ideally in Nacka and Värmdö. Send a Spotify playlist the week before with what you love to dance to — I take care of the rest.',
      body: 'I’m based around Nacka and Värmdö and happily travel across the greater Stockholm area. I bring a full DJ setup and speakers that cover 50–150 guests, up and running in half an hour to an hour. I can also arrange a smoke machine and lighting through my DJ friends. Tell me about your evening in the form below and I’ll get back to you with availability and price.',
      railTitle: 'Booking',
      rail: [
        ['Great for', 'Party · Wedding · Event'],
        ['Music', 'Any genre · Open Format'],
        ['Area', 'Nacka · Värmdö · Stockholm'],
        ['How it works', 'Your Spotify list in advance'],
        ['Gear', 'DJ rig + PA, 50–150 guests'],
      ],
    },
    booking: {
      kicker: '03 — Booking',
      title: 'Send a booking request',
      lede:
        'Fill in the form and I’ll get back to you as soon as I can. Your request is sent to my inbox and added as a tentative note in my calendar for the date you pick.',
      name: 'Name',
      email: 'Email',
      date: 'Preferred date',
      location: 'Place / venue',
      message: 'Message',
      messagePlaceholder: 'Times, set length, budget, anything else …',
      submit: 'Send request',
      submitting: 'Sending …',
      successTitle: 'Thank you!',
      successBody: 'Your booking request has been sent. I’ll get back to you soon.',
      errorTitle: 'Something went wrong',
      errorBody: 'Couldn’t send right now. Feel free to email me directly:',
      errNotConfigured: 'The form isn’t connected yet (no endpoint configured).',
      errName: 'Enter your name',
      errEmail: 'Invalid email address',
      errDate: 'Pick a date',
      errDatePast: 'That date has already passed',
      errLocation: 'Enter a place or venue',
    },
    footer: {
      kicker: 'Contact',
      tagline: 'Developer with an AI focus. DJ for parties, weddings & events in Stockholm.',
      email: 'jechnotechno@gmail.com',
      linkedin: 'LinkedIn',
      soundcloud: 'SoundCloud',
      book: 'Book',
      rights: 'Jens Klemets',
    },
  },
};
