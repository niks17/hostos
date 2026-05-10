import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hsbgxunrslsbeyjwmeou.supabase.co',
  'sb_publishable_spBwQ9O2iOjRnfRbxVh95g_op31CPt4'
)

// Mappers: DB snake_case → frontend camelCase
export function mapApartman(a) {
  return { ...a, cenaPoNoci: a.cena_po_noci }
}

export function mapRezervacija(r) {
  return { ...r, apartmanId: r.apartman_id, gostId: r.gost_id, brGostiju: r.br_gostiju, icalImport: r.ical_import }
}

export function mapGost(g) {
  return { ...g, brBoravaka: g.br_boravaka }
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
