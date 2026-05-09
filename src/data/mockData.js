export const apartmani = [
  { id: 1, naziv: 'Apartman Centar', lokacija: 'Beograd, Stari Grad', kapacitet: 4, cenaPoNoci: 85, ocena: 4.8, boja: '#01696f' },
  { id: 2, naziv: 'Studio Lux', lokacija: 'Novi Sad, Centar', kapacitet: 2, cenaPoNoci: 65, ocena: 4.9, boja: '#8b5cf6' },
  { id: 3, naziv: 'Vila Sunce', lokacija: 'Zlatibor, Centar', kapacitet: 6, cenaPoNoci: 120, ocena: 4.7, boja: '#f59e0b' },
]

export const gosti = [
  { id: 1, ime: 'Marko Petrović', email: 'marko.petrovic@gmail.com', telefon: '+381 64 123 4567', brBoravaka: 3, ocena: 4.9, drzava: 'Srbija', napomena: 'VIP gost, uvek uredan' },
  { id: 2, ime: 'Jovana Stojanović', email: 'jovana.s@gmail.com', telefon: '+381 63 987 6543', brBoravaka: 1, ocena: 5.0, drzava: 'Srbija', napomena: '' },
  { id: 3, ime: 'Stefan Nikolić', email: 'stefan.n@outlook.com', telefon: '+381 65 456 7890', brBoravaka: 2, ocena: 4.7, drzava: 'Srbija', napomena: 'Alergia na perje' },
  { id: 4, ime: 'Ana Đorđević', email: 'ana.dj@yahoo.com', telefon: '+381 62 111 2222', brBoravaka: 4, ocena: 4.8, drzava: 'Srbija', napomena: 'Redovni gost' },
  { id: 5, ime: 'Nikola Jovanović', email: 'nikola.j@gmail.com', telefon: '+381 64 333 4444', brBoravaka: 2, ocena: 4.6, drzava: 'Srbija', napomena: '' },
  { id: 6, ime: 'Milica Popović', email: 'milica.p@gmail.com', telefon: '+381 65 555 6666', brBoravaka: 1, ocena: 4.9, drzava: 'Srbija', napomena: '' },
  { id: 7, ime: 'Ivan Lazović', email: 'ivan.l@hotmail.com', telefon: '+381 64 777 8888', brBoravaka: 3, ocena: 4.5, drzava: 'Srbija', napomena: 'Kasni check-in' },
  { id: 8, ime: 'Katarina Đurić', email: 'katarina.d@gmail.com', telefon: '+381 62 999 0000', brBoravaka: 2, ocena: 5.0, drzava: 'Srbija', napomena: 'Vegetarijanka' },
]

export const rezervacije = [
  { id: 1, apartmanId: 1, gostId: 1, gost: 'Marko Petrović', dolazak: '2026-05-10', odlazak: '2026-05-14', cena: 340, status: 'potvrdjeno', izvor: 'Booking.com', kontakt: '+381 64 123 4567', napomena: 'Kasni dolazak oko 22h' },
  { id: 2, apartmanId: 2, gostId: 2, gost: 'Jovana Stojanović', dolazak: '2026-05-12', odlazak: '2026-05-15', cena: 195, status: 'potvrdjeno', izvor: 'Airbnb', kontakt: '+381 63 987 6543', napomena: '' },
  { id: 3, apartmanId: 3, gostId: 3, gost: 'Stefan Nikolić', dolazak: '2026-05-18', odlazak: '2026-05-25', cena: 840, status: 'potvrdjeno', izvor: 'Direktno', kontakt: '+381 65 456 7890', napomena: 'Žele roštilj opremu' },
  { id: 4, apartmanId: 1, gostId: 4, gost: 'Ana Đorđević', dolazak: '2026-05-20', odlazak: '2026-05-23', cena: 255, status: 'potvrdjeno', izvor: 'Booking.com', kontakt: '+381 62 111 2222', napomena: '' },
  { id: 5, apartmanId: 2, gostId: 5, gost: 'Nikola Jovanović', dolazak: '2026-05-09', odlazak: '2026-05-12', cena: 195, status: 'potvrdjeno', izvor: 'Airbnb', kontakt: '+381 64 333 4444', napomena: '' },
  { id: 6, apartmanId: 3, gostId: 6, gost: 'Milica Popović', dolazak: '2026-04-20', odlazak: '2026-04-25', cena: 600, status: 'zavrseno', izvor: 'Direktno', kontakt: '+381 65 555 6666', napomena: '' },
  { id: 7, apartmanId: 1, gostId: 7, gost: 'Ivan Lazović', dolazak: '2026-04-10', odlazak: '2026-04-14', cena: 340, status: 'zavrseno', izvor: 'Booking.com', kontakt: '+381 64 777 8888', napomena: '' },
  { id: 8, apartmanId: 2, gostId: 8, gost: 'Katarina Đurić', dolazak: '2026-05-28', odlazak: '2026-06-02', cena: 325, status: 'cekanje', izvor: 'Airbnb', kontakt: '+381 62 999 0000', napomena: 'Čeka potvrdu plaćanja' },
  { id: 9, apartmanId: 1, gostId: 1, gost: 'Marko Petrović', dolazak: '2026-06-10', odlazak: '2026-06-15', cena: 425, status: 'potvrdjeno', izvor: 'Direktno', kontakt: '+381 64 123 4567', napomena: 'Ponovni gost' },
  { id: 10, apartmanId: 3, gostId: 4, gost: 'Ana Đorđević', dolazak: '2026-05-05', odlazak: '2026-05-09', cena: 480, status: 'otkazano', izvor: 'Booking.com', kontakt: '+381 62 111 2222', napomena: 'Otkazano 3 dana pre' },
]

export const mesecniPodaci = [
  { mesec: 'Dec', prihod: 1850, troskovi: 620 },
  { mesec: 'Jan', prihod: 2300, troskovi: 840 },
  { mesec: 'Feb', prihod: 2850, troskovi: 760 },
  { mesec: 'Mar', prihod: 3600, troskovi: 920 },
  { mesec: 'Apr', prihod: 4100, troskovi: 1050 },
  { mesec: 'Maj', prihod: 5200, troskovi: 980 },
]

export const transakcije = [
  { id: 1, datum: '2026-05-09', opis: 'Rezervacija - Nikola Jovanović', iznos: 195, tip: 'prihod', kategorija: 'Rezervacija', apartmanId: 2 },
  { id: 2, datum: '2026-05-08', opis: 'Čišćenje - Apartman Centar', iznos: -35, tip: 'trosak', kategorija: 'Čišćenje', apartmanId: 1 },
  { id: 3, datum: '2026-05-07', opis: 'Komunalije april - Studio Lux', iznos: -68, tip: 'trosak', kategorija: 'Komunalije', apartmanId: 2 },
  { id: 4, datum: '2026-05-06', opis: 'Boravišna taksa april', iznos: -124, tip: 'trosak', kategorija: 'Boravišna taksa', apartmanId: null },
  { id: 5, datum: '2026-05-05', opis: 'Rezervacija - Ana Đorđević (Maj)', iznos: 480, tip: 'prihod', kategorija: 'Rezervacija', apartmanId: 3 },
  { id: 6, datum: '2026-05-04', opis: 'Popravka bojlera - Vila Sunce', iznos: -185, tip: 'trosak', kategorija: 'Popravka', apartmanId: 3 },
  { id: 7, datum: '2026-05-03', opis: 'Rezervacija - Marko Petrović', iznos: 340, tip: 'prihod', kategorija: 'Rezervacija', apartmanId: 1 },
  { id: 8, datum: '2026-05-02', opis: 'Booking.com provizija', iznos: -51, tip: 'trosak', kategorija: 'Provizija', apartmanId: null },
  { id: 9, datum: '2026-05-01', opis: 'Komunalije maj - Apartman Centar', iznos: -72, tip: 'trosak', kategorija: 'Komunalije', apartmanId: 1 },
  { id: 10, datum: '2026-04-30', opis: 'Rezervacija - Milica Popović', iznos: 600, tip: 'prihod', kategorija: 'Rezervacija', apartmanId: 3 },
]

export const cistaceTasks = [
  {
    id: 1, apartmanId: 1, datum: '2026-05-09', status: 'u_toku', vreme: '10:00',
    stavke: [
      { id: 1, naziv: 'Posteljina i peškiri', zavrseno: true, ts: '10:23' },
      { id: 2, naziv: 'Kupatilo', zavrseno: true, ts: '10:41' },
      { id: 3, naziv: 'Kuhinja i sudovi', zavrseno: false, ts: null },
      { id: 4, naziv: 'Usisavanje i brisanje', zavrseno: false, ts: null },
      { id: 5, naziv: 'Terasa', zavrseno: false, ts: null },
    ],
  },
  {
    id: 2, apartmanId: 2, datum: '2026-05-09', status: 'zavrseno', vreme: '09:00',
    zavrsioTs: '11:15',
    stavke: [
      { id: 1, naziv: 'Posteljina i peškiri', zavrseno: true, ts: '09:25' },
      { id: 2, naziv: 'Kupatilo', zavrseno: true, ts: '09:45' },
      { id: 3, naziv: 'Kuhinja i sudovi', zavrseno: true, ts: '10:10' },
      { id: 4, naziv: 'Usisavanje i brisanje', zavrseno: true, ts: '10:45' },
      { id: 5, naziv: 'Terasa', zavrseno: true, ts: '11:10' },
    ],
  },
  {
    id: 3, apartmanId: 1, datum: '2026-05-10', status: 'ceka', vreme: '11:00',
    stavke: [
      { id: 1, naziv: 'Posteljina i peškiri', zavrseno: false, ts: null },
      { id: 2, naziv: 'Kupatilo', zavrseno: false, ts: null },
      { id: 3, naziv: 'Kuhinja i sudovi', zavrseno: false, ts: null },
      { id: 4, naziv: 'Usisavanje i brisanje', zavrseno: false, ts: null },
      { id: 5, naziv: 'Terasa', zavrseno: false, ts: null },
    ],
  },
  {
    id: 4, apartmanId: 3, datum: '2026-05-10', status: 'ceka', vreme: '12:00',
    stavke: [
      { id: 1, naziv: 'Posteljina i peškiri', zavrseno: false, ts: null },
      { id: 2, naziv: 'Kupatilo', zavrseno: false, ts: null },
      { id: 3, naziv: 'Kuhinja i sudovi', zavrseno: false, ts: null },
      { id: 4, naziv: 'Usisavanje i brisanje', zavrseno: false, ts: null },
      { id: 5, naziv: 'Terasa + bazenska zona', zavrseno: false, ts: null },
    ],
  },
]

export const notifikacije = [
  { id: 1, tekst: 'Nova rezervacija: Katarina Đurić — Studio Lux', vreme: '10 min', procitano: false, tip: 'rezervacija' },
  { id: 2, tekst: 'Check-out danas: Nikola Jovanović', vreme: '1h', procitano: false, tip: 'checkout' },
  { id: 3, tekst: 'Čišćenje Apartman Centar u toku', vreme: '2h', procitano: true, tip: 'cistenje' },
]
