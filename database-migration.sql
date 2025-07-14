-- Migration: Add game_started_at column to rooms table
-- Run this in your Supabase SQL editor to add the missing column

ALTER TABLE rooms ADD COLUMN game_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Optional: Add an index on game_started_at for better performance
CREATE INDEX idx_rooms_game_started_at ON rooms(game_started_at); 