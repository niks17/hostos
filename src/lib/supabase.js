import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Nedostaju Supabase env varijable. Kopiraj .env.example u .env i popuni VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Mappers: DB snake_case → frontend camelCase ───────────────────────────────
export function mapApartman(a) {
  return {
    ...a,
    cenaPoNoci:   a.cena_po_noci,
    wifiNaziv:    a.wifi_naziv,
    wifiSifra:    a.wifi_sifra,
    checkinInfo:  a.checkin_info,
    guestToken:   a.guest_token,
    welcomeMsg:   a.welcome_msg,
    parkingInfo:  a.parking_info,
    houseRules:   a.house_rules,
    hostContact:  a.host_contact,
  }
}

export function mapRezervacija(r) {
  return {
    ...r,
    apartmanId: r.apartman_id,
    gostId:     r.gost_id,
    brGostiju:  r.br_gostiju,
    icalImport: r.ical_import,
    icalUid:    r.ical_uid || null,
  }
}

export function mapGost(g) {
  return {
    ...g,
    brBoravaka:    g.br_boravaka,
    datumRodjenja: g.datum_rodjenja || null,
    tipDokumenta:  g.tip_dokumenta  || 'Pasoš',
    brojDokumenta: g.broj_dokumenta || null,
    // prezime, pol, drzava su isti naziv u DB i JS — dolaze kroz ...g
  }
}

// Vraća puno ime gosta (ime + prezime ako postoji)
export function punoIme(g) {
  if (!g) return '—'
  return g.prezime ? `${g.ime} ${g.prezime}` : (g.ime || '—')
}

// Da li gost ima kompletne eTurista podatke
export function eturistaKompletan(g) {
  return !!(g && g.prezime && g.datum_rodjenja && g.pol && g.drzava && g.tip_dokumenta && g.broj_dokumenta)
}

export function mapTask(t) {
  return {
    ...t,
    apartmanId: t.apartman_id,
    zavrsioTs: t.zavrsio_ts,
    stavke: (t.cistacke_stavke || []).map(s => ({ ...s, taskId: s.task_id, zavrseno: s.zavrseno, ts: s.ts }))
  }
}

export function mapTransakcija(t) {
  return { ...t, apartmanId: t.apartman_id }
}

// ── Activity Log ──────────────────────────────────────────────────────────────
// SQL to run in Supabase:
// CREATE TABLE IF NOT EXISTS activity_log (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id uuid REFERENCES auth.users NOT NULL,
//   tip text NOT NULL,
//   opis text NOT NULL,
//   meta jsonb DEFAULT '{}',
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users see own activities" ON activity_log
//   FOR ALL USING (auth.uid() = user_id);

export async function logActivity(userId, tip, opis, meta = {}) {
  if (!userId) return
  try {
    await supabase.from('activity_log').insert({ user_id: userId, tip, opis, meta })
  } catch (e) {
    // silently fail — activity log is non-critical
  }
}

// ── Podešavanja: taksa stopa (jedan izvor istine za sve ekrane) ──────────────
export const TAKSA_STOPA_DEFAULT = 150

export async function loadTaksaStopa(userId) {
  if (!userId) return TAKSA_STOPA_DEFAULT
  const { data } = await supabase
    .from('podesavanja')
    .select('taksa_stopa')
    .eq('user_id', userId)
    .maybeSingle()
  return Number(data?.taksa_stopa ?? TAKSA_STOPA_DEFAULT)
}

export async function saveTaksaStopa(userId, stopa) {
  return supabase.from('podesavanja').upsert(
    { user_id: userId, taksa_stopa: stopa, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

// ── Activity tip config (used in both Dashboard and future views) ─────────────
export const TIP_CONFIG = {
  cistenje:    { emoji: '✨', label: 'Čišćenje',       boja: '#8b5cf6' },
  rezervacija: { emoji: '📅', label: 'Rezervacija',    boja: '#3b82f6' },
  ical:        { emoji: '🔄', label: 'Sinhronizacija', boja: '#6366f1' },
  poruka:      { emoji: '💬', label: 'Poruka',         boja: '#10b981' },
  checkout:    { emoji: '🚪', label: 'Checkout',       boja: '#f59e0b' },
  checkin:     { emoji: '🏠', label: 'Check-in',       boja: '#0d9488' },
  novi_gost:   { emoji: '👤', label: 'Novi gost',      boja: '#64748b' },
  alert:       { emoji: '⚠️', label: 'Upozorenje',    boja: '#ef4444' },
}
