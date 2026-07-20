-- Run this once in your Supabase project's SQL editor (Supabase dashboard -> SQL Editor -> New query)

create table if not exists households (
  id text primary key,
  password_hash text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh automatically
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists households_updated_at on households;
create trigger households_updated_at
before update on households
for each row execute procedure set_updated_at();

-- Row Level Security: since this app authenticates with its own password check
-- inside the API routes (not Supabase Auth), we access this table only from the
-- server using the service role key, which bypasses RLS. Enabling RLS here just
-- blocks any accidental direct client-side access.
alter table households enable row level security;
