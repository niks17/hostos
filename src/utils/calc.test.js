import { describe, it, expect } from 'vitest'
import { noci, cenaRezervacije, taksaRezervacije } from './calc'

describe('noci', () => {
  it('računa broj noćenja između dva datuma', () => {
    expect(noci('2026-06-01', '2026-06-03')).toBe(2)
    expect(noci('2026-06-01', '2026-06-08')).toBe(7)
  })

  it('jedna noć = 1', () => {
    expect(noci('2026-06-01', '2026-06-02')).toBe(1)
  })

  it('isti dan se naplaćuje kao 1 noć (ne 0)', () => {
    // Ovo je bio bug: kalkulator je prikazivao 0, a snimao 1
    expect(noci('2026-06-01', '2026-06-01')).toBe(1)
  })

  it('vraća 0 kad datum nedostaje', () => {
    expect(noci('', '2026-06-03')).toBe(0)
    expect(noci('2026-06-01', '')).toBe(0)
    expect(noci(null, null)).toBe(0)
  })

  it('radi preko granice meseca', () => {
    expect(noci('2026-06-29', '2026-07-02')).toBe(3)
  })

  it('radi preko prelaska na letnje/zimsko vreme (DST)', () => {
    // EU DST prelaz krajem marta — dan ima 23h, ali računamo cele dane
    expect(noci('2026-03-28', '2026-03-30')).toBe(2)
  })
})

describe('cenaRezervacije', () => {
  it('cena = noćenja × cena po noći', () => {
    expect(cenaRezervacije('2026-06-01', '2026-06-04', 50)).toBe(150)
  })

  it('jedna noć', () => {
    expect(cenaRezervacije('2026-06-01', '2026-06-02', 80)).toBe(80)
  })

  it('prikazana cena = snimljena cena (isti izvor istine)', () => {
    // Pre fiksa: prikaz je koristio max(0), snimanje max(1) → različito
    const prikaz   = cenaRezervacije('2026-06-01', '2026-06-01', 50)
    const snimanje = cenaRezervacije('2026-06-01', '2026-06-01', 50)
    expect(prikaz).toBe(snimanje)
    expect(prikaz).toBe(50)
  })

  it('bez cene po noći → 0', () => {
    expect(cenaRezervacije('2026-06-01', '2026-06-04')).toBe(0)
    expect(cenaRezervacije('2026-06-01', '2026-06-04', null)).toBe(0)
  })
})

describe('taksaRezervacije', () => {
  it('taksa = noćenja × gostiju × stopa', () => {
    // 3 noći × 2 gosta × 150 RSD = 900
    expect(taksaRezervacije('2026-06-01', '2026-06-04', 2, 150)).toBe(900)
  })

  it('podrazumeva 1 gosta ako broj nije zadat', () => {
    expect(taksaRezervacije('2026-06-01', '2026-06-03', undefined, 150)).toBe(300)
    expect(taksaRezervacije('2026-06-01', '2026-06-03', 0, 150)).toBe(300)
  })

  it('jedna noć, jedan gost', () => {
    expect(taksaRezervacije('2026-06-01', '2026-06-02', 1, 150)).toBe(150)
  })

  it('bez stope → 0', () => {
    expect(taksaRezervacije('2026-06-01', '2026-06-04', 2)).toBe(0)
  })
})
