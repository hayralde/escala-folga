-- Portal de Escala de Folga: armazenamento no Supabase
-- Leitura pública; gravação apenas via funções que conferem a senha do admin.

create table public.escala_folga (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.escala_folga enable row level security;
create policy "escala_folga leitura publica" on public.escala_folga
  for select to anon, authenticated using (true);

-- Hash da senha do admin; sem policies = inacessível pela API
create table public.escala_folga_admin (
  id int primary key default 1 check (id = 1),
  password_hash text not null
);
alter table public.escala_folga_admin enable row level security;

create function public.escala_folga_check(p_password text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.escala_folga_admin
    where password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

create function public.escala_folga_save(p_password text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare v_ts timestamptz;
begin
  if not public.escala_folga_check(p_password) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  if jsonb_typeof(p_data) <> 'object' or p_data->'users' is null or p_data->'schedules' is null then
    raise exception 'Dados inválidos';
  end if;
  update public.escala_folga
     set data = p_data #- '{config,adminPassword}', updated_at = now()
   where id = 'main'
  returning updated_at into v_ts;
  return v_ts;
end;
$$;

create function public.escala_folga_change_password(p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.escala_folga_check(p_old) then
    raise exception 'Senha incorreta' using errcode = '28P01';
  end if;
  if length(coalesce(p_new, '')) < 4 then
    raise exception 'Senha deve ter ao menos 4 caracteres';
  end if;
  update public.escala_folga_admin
     set password_hash = extensions.crypt(p_new, extensions.gen_salt('bf'))
   where id = 1;
end;
$$;

revoke all on function public.escala_folga_check(text) from public;
revoke all on function public.escala_folga_save(text, jsonb) from public;
revoke all on function public.escala_folga_change_password(text, text) from public;
grant execute on function public.escala_folga_check(text) to anon, authenticated;
grant execute on function public.escala_folga_save(text, jsonb) to anon, authenticated;
grant execute on function public.escala_folga_change_password(text, text) to anon, authenticated;

-- Dados iniciais (Setembro–Dezembro/2026) e senha inicial admin123
insert into public.escala_folga (id, data) values ('main', $seed${"config":{"titulo":"Elétrica & Cogeração","mesAtivo":"2026-09","dataVersion":3},"users":[{"matricula":"779","nome":"ADRIEL SODRE DOS SANTOS"},{"matricula":"254","nome":"CARLOS JOSE BARBOSA DA SILVA"},{"matricula":"88","nome":"EDSON CARLOS SCATOLIN"},{"matricula":"750","nome":"MARINILSON GONCALVES FERREIRA","ciclo":7},{"matricula":"707","nome":"JADSON SAMPAIO DA SILVA"},{"matricula":"888","nome":"LEANDRO SOUZA SARAIVA"},{"matricula":"719","nome":"LUCAS SOARES DE OLIVEIRA DOS SANTOS"},{"matricula":"229","nome":"MARCIO IDEIGLAN DA CONCEICAO SILVA"},{"matricula":"884","nome":"NIBSON MACENA DA SILVA"},{"matricula":"195","nome":"VALTER JOSE DA SILVA CANDIDO"},{"matricula":"241","nome":"VANDERLEY DA GAMA FERREIRA"}],"schedules":{"2026-09":{"titulo":"ESCALA DE FOLGA DO MÊS DE SETEMBRO 2026","diasNoMes":30,"data":{"88":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"195":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"229":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"241":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"254":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"707":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"719":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"750":["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","",""],"779":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"884":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"888":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""]}},"2026-10":{"titulo":"ESCALA DE FOLGA DO MÊS DE OUTUBRO 2026","diasNoMes":31,"data":{"88":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"195":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"229":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"241":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"254":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"707":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"719":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"750":["","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","",""],"779":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"884":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"888":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""]}},"2026-11":{"titulo":"ESCALA DE FOLGA DO MÊS DE NOVEMBRO 2026","diasNoMes":30,"data":{"88":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"195":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"229":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"241":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"254":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"707":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"719":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"750":["F","","","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F",""],"779":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"884":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"888":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""]}},"2026-12":{"titulo":"ESCALA DE FOLGA DO MÊS DE DEZEMBRO 2026","diasNoMes":31,"data":{"88":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"195":["","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","",""],"229":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"241":["","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","",""],"254":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"707":["","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F",""],"719":["F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F"],"750":["","","","","","F","","","","","","","F","","","","","","","F","","","","","","","F","","","",""],"779":["","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","","",""],"884":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""],"888":["","","F","","","","","","F","","","","","","F","","","","","","F","","","","","","F","","","",""]}}}}$seed$::jsonb);
insert into public.escala_folga_admin (id, password_hash)
  values (1, extensions.crypt('admin123', extensions.gen_salt('bf')));
