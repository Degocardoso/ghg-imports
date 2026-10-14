-- =============================================================================
-- GHD Imports — Migração inicial
-- Tabelas, funções transacionais, Row Level Security e buckets de Storage.
--
-- Executar no SQL Editor do Supabase (ou `supabase db push`).
-- Idempotente onde é razoável; pensado para uma base de dados nova.
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'aguardando_contato', 'em_negociacao', 'confirmado', 'pago', 'enviado', 'concluido', 'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_gender as enum ('masculino', 'feminino', 'unissex', 'infantil');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_badge as enum ('lancamento', 'oferta', 'destaque');
exception when duplicate_object then null; end $$;

-- Tipo de variante: define o rótulo mostrado na loja (Tamanho / Numeração / Volume).
do $$ begin
  create type public.variant_kind as enum ('vestuario', 'calcado', 'volume', 'unico');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Utilitário: updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Administradores
-- Estar autenticado NÃO basta: só utilizadores presentes nesta tabela
-- têm privilégios de gestão (protege contra sign-ups abertos no Auth).
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Categorias (suporta subcategorias via parent_id)
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 500),
  image_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);
create index if not exists categories_parent_idx on public.categories (parent_id);
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Produtos
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references public.categories (id) on delete set null,
  name             text not null check (char_length(name) between 2 and 140),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description      text check (char_length(description) <= 5000),
  brand            text check (char_length(brand) <= 80),
  gender           public.product_gender,
  variant_kind     public.variant_kind not null default 'vestuario',
  price            numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  images           text[] not null default '{}',
  badge            public.product_badge,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  sales_count      int not null default 0 check (sales_count >= 0),
  tags             text[] not null default '{}',
  deleted_at       timestamptz,               -- eliminação lógica (soft delete)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_listing_idx on public.products (is_active, deleted_at, created_at desc);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Variantes (tamanho / numeração / volume em ml + cor), com stock individual
-- -----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products (id) on delete cascade,
  size             text check (char_length(size) <= 30),   -- "M", "42", "100 ml"
  color            text check (char_length(color) <= 40),
  sku              text unique check (char_length(sku) <= 60),
  price            numeric(10, 2) check (price is null or price >= 0),            -- sobrepõe o preço do produto (ex.: perfumes por ml)
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  stock            int not null default 0 check (stock >= 0),
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint product_variants_unique_option unique nulls not distinct (product_id, size, color)
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);
drop trigger if exists product_variants_updated_at on public.product_variants;
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Banners do Hero (montra inicial)
-- -----------------------------------------------------------------------------
create table if not exists public.banners (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 120),
  subtitle         text check (char_length(subtitle) <= 240),
  eyebrow          text check (char_length(eyebrow) <= 40),     -- etiqueta curta acima do título
  cta_label        text check (char_length(cta_label) <= 40),
  cta_href         text check (char_length(cta_href) <= 300),
  image_url        text not null,
  mobile_image_url text,
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
drop trigger if exists banners_updated_at on public.banners;
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Definições da loja (linha única, id = 1). Todos os campos são de natureza
-- pública (aparecem no rodapé/checkout), por isso a leitura é pública.
-- -----------------------------------------------------------------------------
create table if not exists public.store_settings (
  id               int primary key default 1 check (id = 1),
  store_name       text not null default 'GHD Imports',
  tagline          text default 'Importados premium. Atendimento VIP.',
  announcement     text default 'Atendimento personalizado via WhatsApp • Enviamos para todo o Brasil',
  whatsapp_number  text not null default '5511999999999' check (whatsapp_number ~ '^[0-9]{10,15}$'),
  logo_url         text,
  contact_email    text,
  contact_phone    text,
  address          text,
  business_hours   text default 'Seg a Sáb, 9h às 19h',
  instagram_url    text,
  facebook_url     text,
  tiktok_url       text,
  about_text       text,
  shipping_policy  text,
  returns_policy   text,
  privacy_policy   text,
  terms_of_service text,
  updated_at       timestamptz not null default now()
);
drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Encomendas
-- -----------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       bigint not null unique default nextval('public.order_number_seq'),
  code               text generated always as ('GHD-' || order_number::text) stored,
  status             public.order_status not null default 'aguardando_contato',
  -- Cliente
  customer_name      text not null check (char_length(customer_name) between 3 and 120),
  customer_phone     text not null check (customer_phone ~ '^[0-9]{10,13}$'),
  customer_email     text check (char_length(customer_email) <= 160),
  customer_document  text check (customer_document ~ '^[0-9]{11}$'),        -- CPF (opcional)
  -- Entrega
  delivery_method    text not null check (delivery_method in ('entrega', 'retirada')),
  postal_code        text check (postal_code ~ '^[0-9]{8}$'),
  street             text check (char_length(street) <= 160),
  street_number      text check (char_length(street_number) <= 20),
  complement         text check (char_length(complement) <= 80),
  district           text check (char_length(district) <= 80),
  city               text check (char_length(city) <= 80),
  state              text check (state ~ '^[A-Z]{2}$'),
  -- Qualificação comercial (lead)
  payment_preference text check (payment_preference in ('pix', 'cartao', 'boleto', 'dinheiro')),
  lead_source        text check (char_length(lead_source) <= 40),
  notes              text check (char_length(notes) <= 500),
  marketing_opt_in   boolean not null default false,
  -- Montantes congelados no momento do pedido
  subtotal           numeric(10, 2) not null check (subtotal >= 0),   -- soma a preço "de" (antes de descontos)
  discount_total     numeric(10, 2) not null default 0 check (discount_total >= 0),
  total              numeric(10, 2) not null check (total >= 0),
  items_count        int not null check (items_count > 0),
  -- Controlo interno
  stock_committed    boolean not null default false,
  client_ip_hash     text,
  admin_notes        text check (char_length(admin_notes) <= 2000),
  status_updated_at  timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint orders_address_required check (
    delivery_method = 'retirada'
    or (postal_code is not null and street is not null and street_number is not null
        and city is not null and state is not null)
  )
);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (customer_phone, created_at desc);
create index if not exists orders_ip_idx on public.orders (client_ip_hash, created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  variant_id       uuid references public.product_variants (id) on delete set null,
  product_name     text not null,
  variant_label    text,
  sku              text,
  image_url        text,
  unit_price       numeric(10, 2) not null check (unit_price >= 0),
  compare_at_price numeric(10, 2),
  quantity         int not null check (quantity between 1 and 20),
  line_total       numeric(10, 2) not null check (line_total >= 0),
  created_at       timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- -----------------------------------------------------------------------------
-- Stock: só é abatido quando a encomenda passa a um estado "comprometido"
-- (confirmado/pago/enviado/concluído) e é reposto se voltar atrás ou for
-- cancelada. Assim pedidos abandonados no WhatsApp não bloqueiam stock.
-- -----------------------------------------------------------------------------
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  committed_states constant public.order_status[] :=
    array['confirmado', 'pago', 'enviado', 'concluido']::public.order_status[];
  should_commit boolean;
  item record;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  new.status_updated_at := now();
  should_commit := new.status = any (committed_states);

  if should_commit and not old.stock_committed then
    for item in
      select oi.variant_id, oi.product_id, oi.product_name, oi.variant_label, oi.quantity
      from public.order_items oi where oi.order_id = new.id
    loop
      if item.variant_id is not null then
        update public.product_variants
          set stock = stock - item.quantity
          where id = item.variant_id and stock >= item.quantity;
        if not found then
          raise exception 'Estoque insuficiente para "%" (%)', item.product_name, coalesce(item.variant_label, 'única')
            using errcode = 'P0001';
        end if;
      end if;
      if item.product_id is not null then
        update public.products set sales_count = sales_count + item.quantity where id = item.product_id;
      end if;
    end loop;
    new.stock_committed := true;

  elsif not should_commit and old.stock_committed then
    for item in
      select oi.variant_id, oi.product_id, oi.quantity
      from public.order_items oi where oi.order_id = new.id
    loop
      if item.variant_id is not null then
        update public.product_variants set stock = stock + item.quantity where id = item.variant_id;
      end if;
      if item.product_id is not null then
        update public.products set sales_count = greatest(sales_count - item.quantity, 0) where id = item.product_id;
      end if;
    end loop;
    new.stock_committed := false;
  end if;

  return new;
end $$;

drop trigger if exists orders_status_change on public.orders;
create trigger orders_status_change before update of status on public.orders
  for each row execute function public.handle_order_status_change();

create or replace function public.log_order_status()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (new.id, null, new.status, null);
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end $$;

drop trigger if exists orders_status_log on public.orders;
create trigger orders_status_log after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- -----------------------------------------------------------------------------
-- create_order: ÚNICA via de criação de encomendas.
-- Recalcula preços a partir da base de dados (o cliente nunca define preços),
-- valida disponibilidade/stock, congela montantes e aplica rate limiting.
-- Executável apenas pelo service_role (chamada a partir da API do Next.js).
-- -----------------------------------------------------------------------------
create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c            jsonb := payload -> 'customer';
  v_ip_hash    text  := nullif(payload ->> 'ip_hash', '');
  v_order      public.orders%rowtype;
  v_line       record;
  v_subtotal   numeric(10, 2) := 0;
  v_total      numeric(10, 2) := 0;
  v_count      int := 0;
  v_lines      int;
  v_recent     int;
begin
  if jsonb_typeof(payload -> 'items') <> 'array' then
    raise exception 'Carrinho inválido.' using errcode = 'P0001';
  end if;

  v_lines := jsonb_array_length(payload -> 'items');
  if v_lines = 0 or v_lines > 30 then
    raise exception 'O carrinho deve ter entre 1 e 30 artigos.' using errcode = 'P0001';
  end if;

  -- Rate limiting persistente (funciona em ambiente serverless)
  select count(*) into v_recent from public.orders
    where created_at > now() - interval '10 minutes'
      and (customer_phone = c ->> 'phone' or (v_ip_hash is not null and client_ip_hash = v_ip_hash));
  if v_recent >= 5 then
    raise exception 'Muitos pedidos em pouco tempo. Aguarde alguns minutos ou fale conosco pelo WhatsApp.'
      using errcode = 'P0002';
  end if;

  -- Linhas repetidas da mesma variante são somadas; quantidades validadas.
  if exists (
    select 1 from (
      select sum((i ->> 'quantity')::int) as q
      from jsonb_array_elements(payload -> 'items') i
      group by (i ->> 'variant_id')
    ) s where s.q is null or s.q < 1 or s.q > 20
  ) then
    raise exception 'Quantidade inválida (1 a 20 unidades por artigo).' using errcode = 'P0001';
  end if;

  -- Bloqueia as variantes envolvidas para evitar condições de corrida no stock.
  perform 1 from public.product_variants
    where id in (select (i ->> 'variant_id')::uuid from jsonb_array_elements(payload -> 'items') i)
    order by id
    for update;

  insert into public.orders (
    customer_name, customer_phone, customer_email, customer_document,
    delivery_method, postal_code, street, street_number, complement, district, city, state,
    payment_preference, lead_source, notes, marketing_opt_in,
    subtotal, discount_total, total, items_count, client_ip_hash
  ) values (
    c ->> 'name', c ->> 'phone', nullif(c ->> 'email', ''), nullif(c ->> 'document', ''),
    c ->> 'delivery_method', nullif(c ->> 'postal_code', ''), nullif(c ->> 'street', ''),
    nullif(c ->> 'street_number', ''), nullif(c ->> 'complement', ''), nullif(c ->> 'district', ''),
    nullif(c ->> 'city', ''), nullif(c ->> 'state', ''),
    nullif(c ->> 'payment_preference', ''), nullif(c ->> 'lead_source', ''), nullif(c ->> 'notes', ''),
    coalesce((c ->> 'marketing_opt_in')::boolean, false),
    0, 0, 0, 1, v_ip_hash
  ) returning * into v_order;

  for v_line in
    with lines as (
      select (i ->> 'variant_id')::uuid as variant_id, sum((i ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(payload -> 'items') i
      group by 1
    )
    select ol.quantity, pv.id as variant_id, pv.size, pv.color, pv.sku, pv.stock,
           pv.is_active as variant_active,
           p.id as product_id, p.name, p.images, p.is_active as product_active, p.deleted_at,
           coalesce(pv.price, p.price) as unit_price,
           coalesce(pv.compare_at_price, p.compare_at_price) as compare_at_price
    from lines ol
    left join public.product_variants pv on pv.id = ol.variant_id
    left join public.products p on p.id = pv.product_id
    order by p.name
  loop
    if v_line.variant_id is null or v_line.product_id is null
       or not v_line.variant_active or not v_line.product_active or v_line.deleted_at is not null then
      raise exception 'Um dos artigos do carrinho já não está disponível. Atualize o carrinho.' using errcode = 'P0001';
    end if;
    if v_line.stock < v_line.quantity then
      raise exception 'Estoque insuficiente para "%"%: restam % unidade(s).',
        v_line.name,
        coalesce(' (' || nullif(concat_ws(' / ', v_line.size, v_line.color), '') || ')', ''),
        v_line.stock
        using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label, sku, image_url,
      unit_price, compare_at_price, quantity, line_total
    ) values (
      v_order.id, v_line.product_id, v_line.variant_id, v_line.name,
      nullif(concat_ws(' / ', v_line.size, v_line.color), ''), v_line.sku, (v_line.images)[1],
      v_line.unit_price,
      case when v_line.compare_at_price > v_line.unit_price then v_line.compare_at_price end,
      v_line.quantity, v_line.unit_price * v_line.quantity
    );

    v_subtotal := v_subtotal + greatest(coalesce(v_line.compare_at_price, 0), v_line.unit_price) * v_line.quantity;
    v_total    := v_total + v_line.unit_price * v_line.quantity;
    v_count    := v_count + v_line.quantity;
  end loop;

  update public.orders
    set subtotal = v_subtotal, discount_total = v_subtotal - v_total, total = v_total, items_count = v_count
    where id = v_order.id
    returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'code', v_order.code,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'discount_total', v_order.discount_total,
    'total', v_order.total,
    'items_count', v_order.items_count,
    'created_at', v_order.created_at,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name, 'variant_label', oi.variant_label, 'sku', oi.sku,
        'unit_price', oi.unit_price, 'compare_at_price', oi.compare_at_price,
        'quantity', oi.quantity, 'line_total', oi.line_total
      ) order by oi.product_name), '[]'::jsonb)
      from public.order_items oi where oi.order_id = v_order.id
    )
  );
end $$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

-- -----------------------------------------------------------------------------
-- Vista de catálogo (security_invoker => respeita o RLS de quem consulta)
-- -----------------------------------------------------------------------------
create or replace view public.product_catalog with (security_invoker = true) as
select
  p.id, p.category_id, p.name, p.slug, p.description, p.brand, p.gender, p.variant_kind,
  p.price, p.compare_at_price, p.images, p.badge, p.is_featured, p.is_active, p.sales_count,
  p.tags, p.created_at, p.updated_at,
  c.slug  as category_slug,
  c.name  as category_name,
  pc.slug as parent_category_slug,
  coalesce(v.min_price, p.price) as min_price,
  coalesce(v.max_compare_at_price, p.compare_at_price) as max_compare_at_price,
  coalesce(v.total_stock, 0) as total_stock,
  coalesce(v.sizes, '{}') as sizes,
  coalesce(v.variant_count, 0) as variant_count
from public.products p
left join public.categories c  on c.id = p.category_id
left join public.categories pc on pc.id = c.parent_id
left join lateral (
  select
    min(coalesce(pv.price, p.price)) as min_price,
    max(coalesce(pv.compare_at_price, p.compare_at_price)) as max_compare_at_price,
    sum(pv.stock)::int as total_stock,
    array_agg(distinct pv.size) filter (where pv.size is not null and pv.stock > 0) as sizes,
    count(*)::int as variant_count
  from public.product_variants pv
  where pv.product_id = p.id and pv.is_active
) v on true
where p.deleted_at is null;

grant select on public.product_catalog to anon, authenticated;

-- Pesquisa instantânea (sem acentos, segura contra wildcards injetados)
create or replace function public.search_products(term text, max_results int default 8)
returns setof public.product_catalog
language sql stable security invoker set search_path = '' as $$
  with q as (
    select '%' || replace(replace(replace(
             extensions.unaccent('extensions.unaccent'::regdictionary, lower(trim(term))),
             '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select pc.* from public.product_catalog pc, q
  where pc.is_active
    and char_length(trim(term)) >= 2
    and (
      extensions.unaccent('extensions.unaccent'::regdictionary, lower(pc.name)) like q.pattern
      or extensions.unaccent('extensions.unaccent'::regdictionary, lower(coalesce(pc.brand, ''))) like q.pattern
      or extensions.unaccent('extensions.unaccent'::regdictionary, lower(coalesce(pc.category_name, ''))) like q.pattern
      or exists (select 1 from unnest(pc.tags) t
                 where extensions.unaccent('extensions.unaccent'::regdictionary, lower(t)) like q.pattern)
    )
  order by pc.is_featured desc, pc.sales_count desc, pc.created_at desc
  limit least(greatest(max_results, 1), 100);
$$;

grant execute on function public.search_products(text, int) to anon, authenticated;

-- Gravação atómica de produto + variantes (painel admin).
-- security invoker: corre com a identidade do admin, logo o RLS continua a aplicar-se.
create or replace function public.admin_save_product(p_id uuid, p_product jsonb, p_variants jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  r     public.products%rowtype;
  v     record;
  v_id  uuid;
  v_idx int := 0;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 then
    raise exception 'Adicione pelo menos uma variante.' using errcode = 'P0001';
  end if;

  r := jsonb_populate_record(null::public.products, p_product);

  if p_id is null then
    insert into public.products (
      category_id, name, slug, description, brand, gender, variant_kind, price, compare_at_price,
      images, badge, is_featured, is_active, tags
    ) values (
      r.category_id, r.name, r.slug, r.description, r.brand, r.gender, r.variant_kind, r.price, r.compare_at_price,
      coalesce(r.images, '{}'), r.badge, coalesce(r.is_featured, false), coalesce(r.is_active, true), coalesce(r.tags, '{}')
    ) returning id into v_id;
  else
    update public.products set
      category_id = r.category_id, name = r.name, slug = r.slug, description = r.description, brand = r.brand,
      gender = r.gender, variant_kind = r.variant_kind, price = r.price, compare_at_price = r.compare_at_price,
      images = coalesce(r.images, '{}'), badge = r.badge, is_featured = coalesce(r.is_featured, false),
      is_active = coalesce(r.is_active, true), tags = coalesce(r.tags, '{}')
    where id = p_id and deleted_at is null
    returning id into v_id;
    if v_id is null then
      raise exception 'Produto não encontrado.' using errcode = 'P0001';
    end if;
  end if;

  -- Remove variantes que saíram do formulário (só as deste produto)
  delete from public.product_variants pv
  where pv.product_id = v_id
    and pv.id not in (
      select (e ->> 'id')::uuid from jsonb_array_elements(p_variants) e
      where nullif(e ->> 'id', '') is not null
    );

  for v in
    select * from jsonb_to_recordset(p_variants) as x(
      id uuid, size text, color text, sku text, price numeric, compare_at_price numeric, stock int, is_active boolean
    )
  loop
    if v.id is not null and exists (select 1 from public.product_variants where id = v.id and product_id = v_id) then
      update public.product_variants set
        size = v.size, color = v.color, sku = v.sku, price = v.price, compare_at_price = v.compare_at_price,
        stock = coalesce(v.stock, 0), is_active = coalesce(v.is_active, true), sort_order = v_idx
      where id = v.id;
    else
      insert into public.product_variants (product_id, size, color, sku, price, compare_at_price, stock, is_active, sort_order)
      values (v_id, v.size, v.color, v.sku, v.price, v.compare_at_price, coalesce(v.stock, 0), coalesce(v.is_active, true), v_idx);
    end if;
    v_idx := v_idx + 1;
  end loop;

  return v_id;
end $$;

revoke all on function public.admin_save_product(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_product(uuid, jsonb, jsonb) to authenticated;

-- Indicadores do painel
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products_active',   (select count(*) from public.products where deleted_at is null and is_active),
    'products_hidden',   (select count(*) from public.products where deleted_at is null and not is_active),
    'variants_out',      (select count(*) from public.product_variants pv join public.products p on p.id = pv.product_id
                            where pv.is_active and pv.stock = 0 and p.deleted_at is null),
    'variants_low',      (select count(*) from public.product_variants pv join public.products p on p.id = pv.product_id
                            where pv.is_active and pv.stock between 1 and 3 and p.deleted_at is null),
    'orders_total',      (select count(*) from public.orders),
    'orders_open',       (select count(*) from public.orders where status in ('aguardando_contato', 'em_negociacao')),
    'orders_today',      (select count(*) from public.orders where created_at >= date_trunc('day', now())),
    'revenue_confirmed', (select coalesce(sum(total), 0) from public.orders where stock_committed),
    'categories_active', (select count(*) from public.categories where is_active)
  );
end $$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- =============================================================================
-- PRIVILÉGIOS (explícitos; o RLS abaixo decide que linhas cada papel vê)
-- =============================================================================
grant select on public.categories, public.products, public.product_variants,
                public.banners, public.store_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products,
                public.product_variants, public.banners to authenticated;
grant update on public.store_settings to authenticated;
grant select on public.admin_users, public.orders, public.order_items,
                public.order_status_history to authenticated;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.admin_users          enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.banners              enable row level security;
alter table public.store_settings       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;

-- admin_users: cada utilizador só consegue ver a sua própria linha.
-- Gestão de administradores apenas via SQL / service_role.
drop policy if exists "admin_users: ver própria linha" on public.admin_users;
create policy "admin_users: ver própria linha" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

-- categories
drop policy if exists "categories: leitura pública das ativas" on public.categories;
create policy "categories: leitura pública das ativas" on public.categories
  for select to anon, authenticated using (is_active or (select public.is_admin()));
drop policy if exists "categories: escrita admin" on public.categories;
create policy "categories: escrita admin" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- products: público só vê ativos e não eliminados
drop policy if exists "products: leitura pública dos ativos" on public.products;
create policy "products: leitura pública dos ativos" on public.products
  for select to anon, authenticated
  using ((is_active and deleted_at is null) or (select public.is_admin()));
drop policy if exists "products: escrita admin" on public.products;
create policy "products: escrita admin" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- product_variants: herdam a visibilidade do produto
drop policy if exists "variants: leitura pública" on public.product_variants;
create policy "variants: leitura pública" on public.product_variants
  for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.deleted_at is null))
    or (select public.is_admin())
  );
drop policy if exists "variants: escrita admin" on public.product_variants;
create policy "variants: escrita admin" on public.product_variants
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- banners: público vê ativos dentro da janela de datas
drop policy if exists "banners: leitura pública" on public.banners;
create policy "banners: leitura pública" on public.banners
  for select to anon, authenticated
  using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_admin())
  );
drop policy if exists "banners: escrita admin" on public.banners;
create policy "banners: escrita admin" on public.banners
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- store_settings: leitura pública (dados de contacto/políticas), escrita admin
drop policy if exists "settings: leitura pública" on public.store_settings;
create policy "settings: leitura pública" on public.store_settings
  for select to anon, authenticated using (true);
drop policy if exists "settings: atualização admin" on public.store_settings;
create policy "settings: atualização admin" on public.store_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- orders: sem acesso público. Inserção só via create_order (service_role).
drop policy if exists "orders: leitura admin" on public.orders;
create policy "orders: leitura admin" on public.orders
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "orders: atualização admin" on public.orders;
create policy "orders: atualização admin" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Preços congelados: o admin só pode alterar estado e notas internas.
revoke insert, update, delete on public.orders from anon, authenticated;
grant update (status, admin_notes) on public.orders to authenticated;

drop policy if exists "order_items: leitura admin" on public.order_items;
create policy "order_items: leitura admin" on public.order_items
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.order_items from anon, authenticated;

drop policy if exists "order_history: leitura admin" on public.order_status_history;
create policy "order_history: leitura admin" on public.order_status_history
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.order_status_history from anon, authenticated;

revoke usage on sequence public.order_number_seq from anon, authenticated;

-- =============================================================================
-- STORAGE: buckets públicos `products` e `banners` (logótipo em banners/branding)
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('banners',  'banners',  true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Buckets públicos servem ficheiros por URL sem política de SELECT;
-- não criamos SELECT para anon para impedir a listagem dos ficheiros.
drop policy if exists "storage: admin lê" on storage.objects;
create policy "storage: admin lê" on storage.objects
  for select to authenticated
  using (bucket_id in ('products', 'banners') and (select public.is_admin()));
drop policy if exists "storage: admin carrega" on storage.objects;
create policy "storage: admin carrega" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('products', 'banners') and (select public.is_admin()));
drop policy if exists "storage: admin atualiza" on storage.objects;
create policy "storage: admin atualiza" on storage.objects
  for update to authenticated
  using (bucket_id in ('products', 'banners') and (select public.is_admin()));
drop policy if exists "storage: admin elimina" on storage.objects;
create policy "storage: admin elimina" on storage.objects
  for delete to authenticated
  using (bucket_id in ('products', 'banners') and (select public.is_admin()));

-- =============================================================================
-- REALTIME: stock das variantes atualizado ao vivo na página de produto
-- =============================================================================
do $$ begin
  alter publication supabase_realtime add table public.product_variants;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- =============================================================================
-- Categorias iniciais (editáveis no /admin)
-- =============================================================================
insert into public.categories (name, slug, sort_order) values
  ('Camisas de Futebol', 'camisas-de-futebol', 1),
  ('Vestuário',          'vestuario',          2),
  ('Tênis',              'tenis',              3),
  ('Perfumes',           'perfumes',           4),
  ('Acessórios',         'acessorios',         5)
on conflict (slug) do nothing;

insert into public.categories (name, slug, sort_order, parent_id)
select s.name, s.slug, s.sort_order, p.id
from (values
  ('Clubes Brasileiros',     'clubes-brasileiros',     1, 'camisas-de-futebol'),
  ('Clubes Internacionais',  'clubes-internacionais',  2, 'camisas-de-futebol'),
  ('Seleções',               'selecoes',               3, 'camisas-de-futebol'),
  ('Camisetas',              'camisetas',              1, 'vestuario'),
  ('Calças',                 'calcas',                 2, 'vestuario'),
  ('Bermudas e Shorts',      'bermudas-e-shorts',      3, 'vestuario'),
  ('Moletons',               'moletons',               4, 'vestuario'),
  ('Jaquetas',               'jaquetas',               5, 'vestuario'),
  ('Perfumes Masculinos',    'perfumes-masculinos',    1, 'perfumes'),
  ('Perfumes Femininos',     'perfumes-femininos',     2, 'perfumes'),
  ('Perfumes Unissex',       'perfumes-unissex',       3, 'perfumes'),
  ('Bonés',                  'bones',                  1, 'acessorios'),
  ('Relógios',               'relogios',               2, 'acessorios'),
  ('Bolsas e Mochilas',      'bolsas-e-mochilas',      3, 'acessorios'),
  ('Carteiras',              'carteiras',              4, 'acessorios'),
  ('Óculos',                 'oculos',                 5, 'acessorios')
) as s(name, slug, sort_order, parent_slug)
join public.categories p on p.slug = s.parent_slug
on conflict (slug) do nothing;

-- =============================================================================
-- PRIMEIRO ADMINISTRADOR
-- 1) Supabase → Authentication → Users → "Add user" (email + palavra-passe)
-- 2) Executar (substituir o email):
--    insert into public.admin_users (user_id)
--    select id from auth.users where email = 'admin@ghdimports.com.br';
-- 3) Recomendado: Authentication → Providers → Email → desativar "Allow new users to sign up".
-- =============================================================================
