create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists password_resets (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists security_audit_events (
  id text primary key,
  ip_address text,
  user_agent text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
