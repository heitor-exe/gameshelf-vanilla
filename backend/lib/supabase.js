import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/*
  Run this SQL in your Supabase SQL editor:

  create table profiles (
    id uuid references auth.users primary key,
    username text unique not null,
    bio text,
    avatar_url text,
    created_at timestamptz default now()
  );

  create table shelf_entries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade,
    rawg_game_id integer not null,
    game_title text not null,
    game_cover_url text,
    game_genres text[],
    status text check (status in ('playing','completed','dropped','wishlist')),
    rating integer check (rating between 1 and 5),
    review text,
    created_at timestamptz default now()
  );

  alter table shelf_entries enable row level security;
  create policy "Users can manage own entries"
    on shelf_entries for all
    using (user_id = auth.uid());
  create policy "Entries are publicly readable"
    on shelf_entries for select
    using (true);
*/
