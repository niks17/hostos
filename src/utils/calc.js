// ════════════════════════════════════════════════════════════════════════════
// calc.js — JEDAN izvor istine za novčane kalkulacije
// ════════════════════════════════════════════════════════════════════════════
// Pre ovoga su noći/cena/taksa bile kopirane po komponentama sa RAZLIČITIM
// formulama (negde max(0), negde max(1)) — ista rezervacija je davala različite
// brojeve na različitim ekranima. Sve ide ovde, pokriveno testovima (calc.test.js).

const MS_PO_DANU = 86_400_000

/**
 * Broj noćenja između dolaska i odlaska.
 * Minimum 1 — naplaćuje se bar jedna noć (kao i kod hotela).
 * Vraća 0 samo ako datum nedostaje (da kalkulator zna da ne prikazuje ništa).
 * @param {string|Date} dolazak
 * @param {string|Date} odlazak
 * @returns {number}
 */
export function noci(dolazak, odlazak) {
  if (!dolazak || !odlazak) return 0
  return Math.max(1, Math.round((new Date(odlazak) - new Date(dolazak)) / MS_PO_DANU))
}

/**
 * Ukupna cena rezervacije (€): noćenja × cena po noći.
 * @param {string|Date} dolazak
 * @param {string|Date} odlazak
 * @param {number} cenaPoNoci
 * @returns {number}
 */
export function cenaRezervacije(dolazak, odlazak, cenaPoNoci = 0) {
  return noci(dolazak, odlazak) * (Number(cenaPoNoci) || 0)
}

/**
 * Boravišna taksa za jednu rezervaciju (RSD): noćenja × broj gostiju × stopa.
 * @param {string|Date} dolazak
 * @param {string|Date} odlazak
 * @param {number} brGostiju
 * @param {number} stopa  taksa po osobi po noći
 * @returns {number}
 */
export function taksaRezervacije(dolazak, odlazak, brGostiju = 1, stopa = 0) {
  return noci(dolazak, odlazak) * (Number(brGostiju) || 1) * (Number(stopa) || 0)
}
