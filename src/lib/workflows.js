import { supabase, logActivity } from './supabase'

// ─── Workflow definitions ────────────────────────────────────────────────────
export const WORKFLOW_DEFS = [
  {
    id: 'cleaning',
    naziv: 'Kreiraj čišćenje',
    opis: 'Zakazuje čišćenje na dan odjave (11:00)',
    ikona: '🧹',
  },
  {
    id: 'income',
    naziv: 'Dodaj prihod',
    opis: 'Unosi prihod od rezervacije u finansije',
    ikona: '💰',
  },
  {
    id: 'tourist_tax',
    naziv: 'Boravišna taksa',
    opis: 'Dodaje trošak boravišne takse (150 RSD/osoba/noć)',
    ikona: '🏛️',
  },
  {
    id: 'checkin_msg',
    naziv: 'Podsetnik check-in',
    opis: 'Beleži zadatak da se pošalje check-in poruka gostu',
    ikona: '📩',
  },
]

// ─── Settings (localStorage) ─────────────────────────────────────────────────
const STORAGE_KEY = 'hostos_workflows_v1'

export function loadWorkflowSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  // All enabled by default
  return Object.fromEntries(WORKFLOW_DEFS.map(d => [d.id, true]))
}

export function saveWorkflowSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function noći(dolazak, odlazak) {
  return Math.max(1, Math.round((new Date(odlazak) - new Date(dolazak)) / 86400000))
}

// ─── Workflow handlers ────────────────────────────────────────────────────────

async function runCleaning({ rez, apt, userId }) {
  // Skip if task already exists for this apartment + checkout day
  const { data: existing } = await supabase
    .from('cistacke_tasks')
    .select('id')
    .eq('apartman_id', Number(rez.apartmanId))
    .eq('datum', rez.odlazak)
    .maybeSingle()

  if (existing) return { success: true, skipped: true, info: 'Čišćenje već postoji' }

  const { error } = await supabase.from('cistacke_tasks').insert({
    user_id: userId,
    apartman_id: Number(rez.apartmanId),
    datum: rez.odlazak,
    vreme: '11:00',
    status: 'ceka',
    napomena: `Auto: odjava ${rez.gost}`,
  })

  if (error) return { success: false, error: error.message }

  await logActivity(userId, 'cistenje',
    `Čišćenje auto-zakazano — ${apt?.naziv || 'Apartman'}`,
    { datum: rez.odlazak }
  )
  return { success: true, info: `${apt?.naziv || ''} · ${rez.odlazak}` }
}

async function runIncome({ rez, apt, userId }) {
  const { error } = await supabase.from('transakcije').insert({
    user_id: userId,
    datum: rez.dolazak,
    opis: `Rezervacija — ${rez.gost}${apt ? ` (${apt.naziv})` : ''}`,
    iznos: rez.cena,
    tip: 'prihod',
    kategorija: 'Rezervacija',
    apartman_id: Number(rez.apartmanId) || null,
  })

  if (error) return { success: false, error: error.message }

  await logActivity(userId, 'rezervacija',
    `Prihod dodat — €${rez.cena}`,
    { gost: rez.gost }
  )
  return { success: true, info: `€${rez.cena}` }
}

async function runTouristTax({ rez, apt, userId }) {
  const nights = noći(rez.dolazak, rez.odlazak)
  const guests = rez.brGostiju || 1
  const rateRsd = 150
  const iznos = nights * guests * rateRsd

  const { error } = await supabase.from('transakcije').insert({
    user_id: userId,
    datum: rez.dolazak,
    opis: `Boravišna taksa — ${rez.gost} (${nights} noći × ${guests} gos.)`,
    iznos: -iznos,
    tip: 'trosak',
    kategorija: 'Boravišna taksa',
    apartman_id: Number(rez.apartmanId) || null,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, info: `${iznos.toLocaleString()} RSD` }
}

async function runCheckinMsg({ rez, apt, userId }) {
  if (!rez.id) return { success: true, skipped: true, info: 'Nema ID rezervacije' }

  const { error } = await supabase.from('messages').insert({
    user_id: userId,
    rezervacija_id: rez.id,
    kanal: 'napomena',
    smer: 'napomena',
    tekst: `⏰ Podsetnik: pošalji check-in info gostu dan pre dolaska (${rez.dolazak})`,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, info: `dan pre ${rez.dolazak}` }
}

const HANDLERS = {
  cleaning:    runCleaning,
  income:      runIncome,
  tourist_tax: runTouristTax,
  checkin_msg: runCheckinMsg,
}

// ─── Main runner ─────────────────────────────────────────────────────────────
export async function runWorkflows({ rez, apt, userId, settings }) {
  const activeSettings = settings || loadWorkflowSettings()
  const results = []

  for (const def of WORKFLOW_DEFS) {
    if (activeSettings[def.id] === false) {
      // Silently skip disabled workflows (don't show in toast)
      continue
    }
    const handler = HANDLERS[def.id]
    if (!handler) continue

    try {
      const result = await handler({ rez, apt, userId })
      results.push({ ...def, ...result })
    } catch (e) {
      results.push({ ...def, success: false, error: e.message })
    }
  }

  return results
}
