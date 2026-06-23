-- ════════════════════════════════════════════════════════════════════════════
-- Taksa stopa u bazi (umesto localStorage) — da je svi ekrani čitaju isto
-- ════════════════════════════════════════════════════════════════════════════
-- Pre ovoga je Finansije čuvala stopu u localStorage (po pregledaču/uređaju),
-- a Izveštaji su imali hardkodovanih 150 → mogli su se razići. Sad oba čitaju
-- iz jedne tabele po korisniku.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.podesavanja (
  user_id     uuid primary key references auth.users on delete cascade,
  taksa_stopa numeric not null default 150,
  updated_at  timestamptz default now()
);

alter table public.podesavanja enable row level security;

drop policy if exists "Korisnik upravlja svojim podešavanjima" on public.podesavanja;
create policy "Korisnik upravlja svojim podešavanjima"
  on public.podesavanja
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
