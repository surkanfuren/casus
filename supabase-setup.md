# Supabase Setup for Spyfall Game

## Database Schema

You need to create the following table in your Supabase database:

### `rooms` Table

```sql
CREATE TABLE public.rooms (
    id text PRIMARY KEY,
    "inviteCode" text NOT NULL UNIQUE,
    "hostId" text NOT NULL,
    players jsonb NOT NULL DEFAULT '[]'::jsonb,
    "gameState" text NOT NULL DEFAULT 'waiting'::text,
    "currentWord" text,
    "spyId" text,
    timer integer NOT NULL DEFAULT 480,
    "maxTimer" integer NOT NULL DEFAULT 480,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
);
```

### Indexes (Optional, for performance)

```sql
CREATE INDEX idx_rooms_invite_code ON public.rooms USING btree ("inviteCode");
CREATE INDEX idx_rooms_game_state ON public.rooms USING btree ("gameState");
CREATE INDEX idx_rooms_created_at ON public.rooms USING btree ("createdAt");
```

### Real-time Subscriptions

Make sure to enable real-time subscriptions for the `rooms` table:

1. Go to your Supabase dashboard
2. Navigate to Database > Replication
3. Enable replication for the `rooms` table

### Row Level Security (RLS)

For security, you may want to enable RLS:

```sql
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Enable all operations for rooms" ON public.rooms
FOR ALL USING (true);
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Paste them into your `.env` file

## Testing the Setup

1. Start the app: `npm start`
2. Try creating a room - if successful, your setup is working!
3. Check your Supabase dashboard to see the created room data

## Database Cleanup (Optional)

To clean up old rooms, you can run this SQL periodically:

```sql
DELETE FROM public.rooms
WHERE "createdAt" < NOW() - INTERVAL '24 hours';
```
