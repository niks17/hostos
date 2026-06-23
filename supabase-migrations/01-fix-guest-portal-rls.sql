-- ════════════════════════════════════════════════════════════════════════════
-- FIX: Guest Portal RLS — zatvori curenje guest_token / wifi_sifra iz apartmani
-- ════════════════════════════════════════════════════════════════════════════
-- Pokreni JEDNOM u Supabase → SQL Editor → New query → Run.
--
-- Šta radi:
--   1) Pravi funkciju get_guest_portal(token) koja vraća SAMO guest-facing kolone
--      za JEDAN apartman koji odgovara tačno tom tokenu (SECURITY DEFINER
--      zaobilazi RLS na kontrolisan način).
--   2) Uklanja "svako sme da čita" SELECT pravilo sa apartmani (uzrok curenja).
--   3) Garantuje da vlasnik i dalje vidi SVOJE apartmane u glavnoj aplikaciji.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1) RPC funkcija za guest portal ─────────────────────────────────────────
-- Vraća json objekat (ili NULL ako token ne postoji). json_build_object
-- automatski hvata sve tipove kolona — nema potrebe da pogađamo tipove.
create or replace function public.get_guest_portal(p_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'naziv',         naziv,
    'lokacija',      lokacija,
    'wifi_naziv',    wifi_naziv,
    'wifi_sifra',    wifi_sifra,
    'checkin_info',  checkin_info,
    'checkout_info', checkout_info,
    'welcome_msg',   welcome_msg,
    'parking_info',  parking_info,
    'house_rules',   house_rules,
    'restaurants',   restaurants,
    'host_contact',  host_contact
  )
  from apartmani
  where guest_token = p_token
  limit 1;
$$;

-- Dozvoli neprijavljenim gostima (i prijavljenim) da zovu samo OVU funkciju
grant execute on function public.get_guest_portal(text) to anon, authenticated;

-- ── 2) Ukloni nezaštićeno "svako sme da čita" pravilo sa apartmani ──────────
-- Briše samo SELECT/ALL pravila čiji je USING uslov bukvalno `true`
-- (to je curenje). Vlasnička pravila (auth.uid() = user_id) ostaju netaknuta.
do $$
declare pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'apartmani'
      and cmd in ('SELECT', 'ALL')
      and qual = 'true'
  loop
    execute format('drop policy if exists %I on public.apartmani', pol.policyname);
  end loop;
end $$;

-- ── 3) Garantuj da vlasnik čita SVOJE apartmane (glavna aplikacija) ─────────
-- Ako je jedino SELECT pravilo bilo ono javno (sad obrisano), vlasnik bi
-- ostao bez pristupa — zato eksplicitno (re)kreiramo ispravno pravilo.
drop policy if exists "Vlasnik cita svoje apartmane" on public.apartmani;
create policy "Vlasnik cita svoje apartmane"
  on public.apartmani
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- PROVERA (opciono — pokreni odvojeno da potvrdiš da curenje više ne postoji):
--   select * from apartmani;        -- kao anon: treba 0 redova
--   select public.get_guest_portal('<pravi-token>');  -- treba da vrati json
-- ════════════════════════════════════════════════════════════════════════════
