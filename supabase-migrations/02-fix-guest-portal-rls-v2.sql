-- ════════════════════════════════════════════════════════════════════════════
-- FIX v2: Ukloni SVA SELECT pravila sa apartmani, vrati samo vlasničko
-- ════════════════════════════════════════════════════════════════════════════
-- Prva verzija (qual='true') nije uhvatila pravilo jer mu je USING izraz
-- zapisan drugačije (verovatno napravljeno kroz Supabase UI). Pošto guest
-- portal sad koristi RPC get_guest_portal(), anon-u NE TREBA nikakav direktan
-- SELECT na tabeli — pa brišemo sva SELECT pravila i vraćamo samo vlasničko.
--
-- Briše samo cmd='SELECT' pravila → NE dira INSERT/UPDATE/DELETE,
-- tako da vlasnik i dalje može da dodaje/menja apartmane.
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'apartmani'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.apartmani', pol.policyname);
  end loop;
end $$;

-- Vrati JEDINO ispravno SELECT pravilo: vlasnik vidi svoje apartmane
create policy "Vlasnik cita svoje apartmane"
  on public.apartmani
  for select
  to authenticated
  using (auth.uid() = user_id);
