
# EQUO - Siamo pari - CLOUD SYNC come MotoGarage

SQL DA ESEGUIRE SU SUPABASE:
```
drop table if exists expenses;
drop table if exists groups;
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  members jsonb not null default '[]'::jsonb,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);
create table expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null,
  paid_by text not null,
  category text not null,
  split_type text not null,
  split_data jsonb,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id) not null,
  is_recurring boolean default false,
  frequency text,
  created_at timestamp with time zone default now()
);
alter table groups enable row level security;
alter table expenses enable row level security;
create policy "user_own_groups" on groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_own_expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

ENV su Bolt:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
