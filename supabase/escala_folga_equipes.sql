-- Equipes separadas: cada equipe tem seu registro em escala_folga e sua senha de admin.
-- 'main' = Elétrica & Cogeração (registro já existente); 'casaforca' = Casa de Força.

alter table public.escala_folga_admin drop constraint escala_folga_admin_id_check;
alter table public.escala_folga_admin add column team text;
update public.escala_folga_admin set team = 'main' where id = 1;
alter table public.escala_folga_admin alter column team set not null;
alter table public.escala_folga_admin add constraint escala_folga_admin_team_key unique (team);

-- Funções por equipe
create function public.escala_folga_check(p_team text, p_password text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.escala_folga_admin
    where team = p_team and password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

create function public.escala_folga_save(p_team text, p_password text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare v_ts timestamptz;
begin
  if not public.escala_folga_check(p_team, p_password) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  if jsonb_typeof(p_data) <> 'object' or p_data->'users' is null or p_data->'schedules' is null then
    raise exception 'Dados inválidos';
  end if;
  update public.escala_folga
     set data = p_data #- '{config,adminPassword}', updated_at = now()
   where id = p_team
  returning updated_at into v_ts;
  if v_ts is null then raise exception 'Equipe não encontrada'; end if;
  return v_ts;
end;
$$;

create function public.escala_folga_change_password(p_team text, p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.escala_folga_check(p_team, p_old) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  if length(coalesce(p_new, '')) < 4 then
    raise exception 'Senha deve ter ao menos 4 caracteres';
  end if;
  update public.escala_folga_admin
     set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf'))
   where team = p_team;
end;
$$;

-- Versões antigas (sem equipe), usadas pelo site anterior: passam a valer só para 'main'
create or replace function public.escala_folga_check(p_password text)
returns boolean
language sql
security definer
set search_path = ''
as $$ select public.escala_folga_check('main', p_password); $$;

create or replace function public.escala_folga_save(p_password text, p_data jsonb)
returns timestamptz
language sql
security definer
set search_path = ''
as $$ select public.escala_folga_save('main', p_password, p_data); $$;

create or replace function public.escala_folga_change_password(p_old text, p_new text)
returns void
language sql
security definer
set search_path = ''
as $$ select public.escala_folga_change_password('main', p_old, p_new); $$;

revoke all on function public.escala_folga_check(text, text) from public;
revoke all on function public.escala_folga_save(text, text, jsonb) from public;
revoke all on function public.escala_folga_change_password(text, text, text) from public;
grant execute on function public.escala_folga_check(text, text) to anon, authenticated;
grant execute on function public.escala_folga_save(text, text, jsonb) to anon, authenticated;
grant execute on function public.escala_folga_change_password(text, text, text) to anon, authenticated;

-- Casa de Força: dados iniciais (Set–Dez/2026, a partir da planilha 15/09–15/10) e senha provisória
insert into public.escala_folga (id, data) values ('casaforca', $seed${"config":{"titulo":"Casa de Força"},"users":[{"matricula":"196","nome":"TIAGO BOER DE OLIVEIRA","turno":"ADM","ciclo":7},{"matricula":"224","nome":"BRUNO JHONATAN SILVA SOUZA","turno":"A"},{"matricula":"757","nome":"WANDERSON FERREIRA","turno":"B"},{"matricula":"203","nome":"FABIANO DOS SANTOS CORREIA JUNIOR","turno":"B"},{"matricula":"776","nome":"MAYCON SILVA DE OLIVEIRA","turno":"C"},{"matricula":"189","nome":"LUIZ ALVES DA MATA","turno":"C"}],"schedules":{"2026-09":{"titulo":"ESCALA DE FOLGA DO MÊS DE SETEMBRO 2026","diasNoMes":30,"data":{"196":["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","",""],"224":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"757":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"203":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"776":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"189":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"]}},"2026-10":{"titulo":"ESCALA DE FOLGA DO MÊS DE OUTUBRO 2026","diasNoMes":31,"data":{"196":["","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","",""],"224":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"757":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"203":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"776":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"189":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""]}},"2026-11":{"titulo":"ESCALA DE FOLGA DO MÊS DE NOVEMBRO 2026","diasNoMes":30,"data":{"196":["F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F",""],"224":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"757":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"203":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"776":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"189":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""]}},"2026-12":{"titulo":"ESCALA DE FOLGA DO MÊS DE DEZEMBRO 2026","diasNoMes":31,"data":{"196":["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","",""],"224":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"757":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"203":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"776":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"189":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""]}}}}$seed$::jsonb);
insert into public.escala_folga_admin (id, team, password_hash)
  values (2, 'casaforca', extensions.crypt('casaforca123', extensions.gen_salt('bf')));
