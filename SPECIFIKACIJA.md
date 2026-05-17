# HostOS — Specifikacija Aplikacije
**Verzija:** 0.2.0  
**Datum:** Maj 2026  
**Status:** Aktivni razvoj (MVP)

---

## 1. Šta je HostOS?

HostOS je web aplikacija za upravljanje kratkoročnim najmom apartmana. Namenjena je vlasnicima koji iznajmljuju jedan ili više apartmana putem platformi kao što su Booking.com i Airbnb, a žele sve operacije na jednom mestu — bez Excel tabela, bez WhatsApp grupe sa čistačicama, bez zaboravljenih gostiju.

**Live URL:** https://hostos-app.vercel.app  
**Pristup:** Email + lozinka, bez instalacije

---

## 2. Problem koji rešava

Tipičan vlasnik apartmana u Srbiji danas koristi:

- **Booking.com/Airbnb** — primanje rezervacija
- **WhatsApp** — komunikacija sa gostima i čistačicama
- **Excel** — finansije i evidencija
- **Notes/papir** — podsetnici za check-in, taksa, popravke
- **Bankovni izvod** — evidencija naplate

To su **5 odvojenih sistema** koji ne komuniciraju. HostOS ih zamenjuje jednim.

---

## 3. Ciljni korisnici

| Uloga | Opis | Pristup u aplikaciji |
|-------|------|----------------------|
| **Vlasnik** (`vlasnik`) | Primarni korisnik — upravlja svim | Pun pristup |
| **Kooperant** (`kooperant`) | Pomoćnik, porodica — vidi rezervacije i kalendar | Kalendar, Rezervacije, Gosti |
| **Čistačica** (`cistacica`) | Radnica — vidi samo njene zadatke | Čistačice Hub |

---

## 4. Funkcionalnosti

### 4.1 Dashboard — Komandna tabla
Dizajniran kao **mobilni prikaz za vlasnika dok hoda gradom**.

- **Pozdrav** sa imenom i dobom dana (jutro/dan/veče/noć)
- **Statistike** (horizontalni scroll na mobu): ukupni prihod, aktivne rezervacije, dolasci danas, čišćenja
- **Dolasci danas** — action kartice po gostu: ime, apartman, cena, kontakt dugmad (WhatsApp sa pre-popunjenom porukom, Viber, poziv)
- **Odlasci danas** — kartice sa checkout podsetnikom
- **Čišćenja** — live status (čeka / u toku / završeno) sa bojom po apartmanu
- **Sutra** — collapsible sekcija s pregledom
- **Desktop prikaz**: 2-kolona layout — levo feed danas, desno activity log + grafikon + apartmani
- **Guest Portal dugme** — direktno otvaranje podešavanja portala za goste

---

### 4.2 Kalendar
- Vizualni prikaz zauzetosti po mesecima
- Podrška za više apartmana istovremeno
- Rezervacije sa iCal uvozom prikazane u drugoj boji
- Navegacija prethodni/sledeći mesec

---

### 4.3 Rezervacije
Centralni modul za upravljanje rezervacijama.

**Lista rezervacija:**
- Filter po apartmanu, statusu, periodu
- Prikaz gosta, datuma, cene, statusa, izvora (Booking/Airbnb/ručno)
- Sortiranje po dolasku

**Kreiranje/izmena rezervacije:**
- Polja: gost, kontakt, apartman, dolazak, odlazak, cena, broj gostiju, napomena, status, izvor
- Statusi: `na_cekanju`, `potvrdjeno`, `otkazano`

**InboxModal — Komunikacija po rezervaciji:**
- Tabovi: Poruke | Šabloni
- Brzi linkovi: WhatsApp, Booking inbox, Airbnb inbox, Email
- Log svih poslatih/primljenih poruka sa datumom i platformom
- Ručni unos poruke + automatsko logovanje
- Šabloni (check-in info, checkout podsetnik, custom)

**Auto Workflows** — kada rezervacija postane `potvrdjeno`:
| Workflow | Akcija |
|----------|--------|
| Čišćenje | Kreira cleaning task za dan odlaska (11:00) |
| Prihod | Dodaje prihod u finansije (iznos = cena rezervacije) |
| Boravišna taksa | Dodaje trošak u finansije (noći × gosti × 150 RSD) |
| Check-in poruka | Ostavlja napomenu da se pošalje check-in info |

- Svaki workflow se može isključiti individualno
- Toast notifikacija sa rezultatima (✓ Urađeno / ⊘ Preskočeno / ✗ Greška)

---

### 4.4 Gosti
- Baza gostiju sa brojem boravaka
- Pretraga po imenu
- Prikaz istorije rezervacija po gostu

---

### 4.5 Čistačice Hub
Modul za upravljanje čišćenjima.

**Za vlasnika:**
- Lista svih zadataka sa statusom (čeka / u toku / završeno)
- Kreiranje zadatka: apartman, datum, vreme, čeklist stavki, napomena
- Brisanje i editovanje
- Prikaz koliko stavki je završeno (npr. "3/5")

**Za čistačicu (njena uloga):**
- Vidi samo zadatke koji su joj dodeljeni na današnji dan
- Interaktivni čeklist: tap = checkbox sa animacijom
- Live tajmer koji meri koliko dugo traje čišćenje
- Status automatski prelazi iz "čeka" → "u toku" → "završeno"

---

### 4.6 Finansije
- **Prihodi i troškovi** — ručni unos sa kategorijom i datumom
- **Grafikon** — bar chart prihoda vs troškova po mesecima (6 meseci)
- **Boravišna taksa tab** — automatski obračun po rezervacijama
  - Prilagodljiva stopa (default 150 RSD/osobi/noći)
  - Praćenje plaćeno/nije plaćeno po mesecu
  - Ukupno dugovanje i uplaćeno
- Kategorije troškova: Čišćenje, Komunalije, Popravka, Provizija, Boravišna taksa, Ostalo

---

### 4.7 Izveštaji & Export
Sva 4 izveštaja generišu **PDF fajl direktno u browseru** — bez servera, bez emaila.

| Izveštaj | Sadrži |
|----------|--------|
| **Mesečni izveštaj** | Tabela rezervacija + prihodi/troškovi + popunjenost + neto profit |
| **Profit report** | Prihodi i troškovi po kategorijama sa %, profit marža, neto profit |
| **Occupancy report** | Zauzeti vs slobodni dani, popunjenost % po apartmanu, RevPAD |
| **Boravišna taksa** | Lista gostiju, noći × osobe × 150 RSD, ukupna taksa za prijavu |

**Filteri:** mesec + godina + apartman (ili svi)  
**PDF format:** A4, HostOS branding (teal header/footer), paginacija

---

### 4.8 Guest Portal — Javni portal za goste
Svaki apartman može imati javni link `/g/{token}` koji gost dobija bez prijave.

**Portal prikazuje:**
- WiFi naziv i šifra (tap-to-copy)
- Pristup apartmanu (uputstvo za ključeve)
- Parking informacije
- Pravila kuće
- Preporučeni restorani (format: Naziv — opis, vreme hoda)
- Checkout uputstvo
- Kontakt dugmad (WhatsApp + poziv)

**Host podešavanja** (GuestPortalModal):
- Edit tab — 7 sekcija sa placeholder primerima i tips
- Preview tab — simulacija kako gost vidi portal na telefonu
- Generisanje jedinstvenog tokena (16-char UUID)
- Copy link dugme

---

### 4.9 Smart Notifikacije
- Bell ikona u headeru sa brojacem
- Pametne notifikacije: dolasci, odlasci, čišćenja koja čekaju, nezadati gosti
- Browser push notifikacije (uz dozvolu) — kritične i važne
- Prioriteti: critical (crveno), high (amber), medium (plavo)
- Dismiss po notifikaciji ili sve odjednom

---

### 4.10 iCal Sinhronizacija
- Uvoz rezervacija sa Booking.com i Airbnb putem iCal URL-a
- Auto-sync na učitavanju i svakih sat vremena
- Sinhronizovane rezervacije se prikazuju u svim modulima
- Sinhronizacija badge u headeru sa loading stanjem

---

## 5. Tehnički Stack

### Frontend
| Tehnologija | Verzija | Uloga |
|-------------|---------|-------|
| **React** | 18.2 | UI framework |
| **Vite** | 5.1 | Build tool |
| **Tailwind CSS** | 3.4 | Stilizovanje |
| **Lucide React** | 0.344 | Ikone |
| **Recharts** | 2.12 | Grafikoni |
| **jsPDF** | 4.2 | PDF generisanje |
| **jspdf-autotable** | 5.0 | Tabele u PDF |
| **date-fns** | 3.3 | Rad sa datumima |

### Backend / Infrastruktura
| Tehnologija | Uloga |
|-------------|-------|
| **Supabase** | Baza podataka (PostgreSQL) + Autentikacija + Storage |
| **Vercel** | Hosting i automatski deploy |
| **GitHub** | Version control (main branch → auto deploy) |

### Arhitektura
```
GitHub (main branch)
    ↓ push → auto deploy
Vercel (CDN)
    ↓ static files
Browser (React SPA)
    ↓ API calls
Supabase (PostgreSQL + Auth)
```

Aplikacija je **100% klijentska** (Single Page Application). Nema backend servera — sve ide direktno iz browsera u Supabase.

---

## 6. Baza podataka

### Tabele

**`apartmani`** — Apartmani
```
id, naziv, lokacija, boja, kapacitet, cena_po_noci,
wifi_naziv, wifi_sifra, checkin_info, ical_url,
guest_token, welcome_msg, parking_info, house_rules,
restaurants, checkout_info, host_contact,
created_at, user_id
```

**`rezervacije`** — Rezervacije
```
id (bigint), apartman_id, gost_id, gost, kontakt,
dolazak, odlazak, cena, status, izvor,
br_gostiju, napomena, ical_import, created_at
```

**`gosti`** — Baza gostiju
```
id, ime, email, telefon, br_boravaka, created_at
```

**`cistacke_tasks`** — Zadaci čišćenja
```
id, apartman_id, datum, vreme, status, napomena,
zavrsio_ts, created_at
```

**`cistacke_stavke`** — Stavke čekliste
```
id, task_id, naziv, zavrseno, ts
```

**`transakcije`** — Finansije
```
id, apartman_id, tip (prihod/trosak), opis,
iznos, kategorija, datum, created_at, user_id
```

**`messages`** — Komunikacija po rezervaciji
```
id, rezervacija_id (bigint), platforma, tip (poslato/primljeno/napomena),
tekst, created_at, user_id
```

**`profiles`** — Korisnički profili
```
id, ime, email, role, created_at
```

**`team_members`** — Tim (čistačice, kooperanti)
```
id, vlasnik_id, email, role, ime, created_at
```

**`activity_log`** — Log aktivnosti
```
id, user_id, tip, opis, meta (jsonb), created_at
```

---

## 7. Bezbednost

### Autentikacija
- Supabase Auth (email + lozinka)
- JWT tokeni, automatski refresh
- Sva API pozivanja su autentifikovana

### Row Level Security (RLS)
- Svaki korisnik vidi **samo svoje podatke** (`user_id = auth.uid()`)
- Timski članovi vide podatke vlasnika (linked po emailu)
- Guest Portal: jedina javna ruta — SELECT samo po `guest_token`
- Anonimni pristup: isključivo za čitanje Guest Portala

### Uloge
- `vlasnik` — pun pristup svemu
- `kooperant` — čita, ne briše, ne menja finansije
- `cistacica` — vidi samo svoje zadatke čišćenja

### RLS politike za tim-member pristup
Tim-member pristup (čistačica vidi vlasnikov apartman) zahteva sledeće politike u Supabase:

```sql
-- Primer za apartmani tabelu (isti patern za rezervacije, cistacke_tasks, transakcije)
CREATE POLICY "vlasnik_i_tim" ON apartmani
FOR SELECT USING (
  auth.uid() = user_id  -- vlasnik vidi svoje
  OR
  EXISTS (              -- tim-member vidi vlasnikov
    SELECT 1 FROM team_members
    WHERE vlasnik_id = apartmani.user_id
      AND email = auth.email()
  )
);

-- Pisanje ostaje samo za vlasnika
CREATE POLICY "samo_vlasnik_menja" ON apartmani
FOR ALL USING (auth.uid() = user_id);
```

---

## 8. UX principi

1. **Mobile-first** — dizajniran za telefon, skalira na desktop
2. **Brzina > kompleksnost** — svaka akcija maksimalno 2 tapa
3. **Offline-tolerantan** — UI ne puca ako mreža zakaže
4. **Srpski jezik** — sav UI na srpskom (PDF latinizovan za kompatibilnost)
5. **Dark mode** — sistem ili manualni toggle
6. **Progressive disclosure** — ne pokazuje sve odjednom

---

## 9. Deployment & DevOps

- **Hosting:** Vercel (free tier)
- **Deploy:** automatski na svaki push na `main` granu
- **Build:** `pnpm run build` → Vite → `/dist`
- **Bundle:** ~1.3MB / 385KB gzip
- **Custom domain:** može se podesiti u Vercel dashboardu
- **HTTPS:** automatski (Let's Encrypt via Vercel)

---

## 10. Poznata ograničenja (v0.2)

| Ograničenje | Napomena |
|-------------|----------|
| RLS za tim-member pristup | Cross-user RLS politike (čistačica vidi vlasnikov apartman) moraju biti manuelno postavljene u Supabase dashboardu — arhitektura je ispravna, politike su kritične |
| iCal proxy | Implementiran kao Vercel Serverless Function (`/api/sync-ical.js`) — rešeno |
| PDF bez srpske dijakritike | Helvetica ne podržava č/ć/š/ž — karakteri su normalizovani (latinizovani) |
| Bez native mobile appa | Web app, nije u App Store/Google Play |
| Bez real-time sinhronizacije | Podaci se osvežavaju na učitavanju stranice, nema WebSocket live updata |

> **Napomena o multi-tenancy:** Aplikacija JE multi-tenant. Jedan Supabase projekat, `user_id` na svim tabelama, RLS politike po korisniku, `team_members` tabela sa `vlasnik_id` za tim-member linking. Svaki novi korisnik koji se registruje automatski dobija izolovane podatke bez ikakve ručne intervencije.

---

## 11. Roadmap

### Sledeće (v0.3)
- [ ] Real-time chat sa gostima (Supabase Realtime)
- [ ] Slanje emaila iz aplikacije (Resend API)
- [ ] Višejezički Guest Portal (EN, DE, RU)
- [ ] Fotografije apartmana u profilu
- [ ] Multi-tenant arhitektura (jedan Supabase za sve korisnike)

### Buduće (v1.0)
- [ ] Native iOS/Android app (React Native ili PWA)
- [ ] Direktna integracija sa Booking.com API
- [ ] Automatsko slanje check-in poruke 24h pre dolaska
- [ ] Analitika i trendovi (sezonalnost, prosečna cena)
- [ ] Automatska naplate putem Stripe
- [ ] Više korisnika po nalogu (timovi)
- [ ] AI asistent za odgovore gostima
- [ ] OCR uvoz računa u finansije (foto → trošak)

---

## 12. Kontakt & Repozitorijum

- **GitHub:** https://github.com/niks17/hostos
- **Live aplikacija:** https://hostos-app.vercel.app
- **Stack:** React + Supabase + Vercel

---

*Dokument generisan iz koda — sve funkcionalnosti opisane u ovom dokumentu su implementirane i deployovane.*
