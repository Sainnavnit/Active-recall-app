/*
      # Create concepts table

      1. New Tables
        - `concepts`
          - `id` (uuid, primary key)
          - `user_id` (uuid, not null, references auth.users.id)
          - `name` (text, not null)
          - `learned_at` (timestamp with time zone, not null)
          - `next_revision_at` (timestamp with time zone, not null)
          - `revision_interval` (integer, not null, default 1)
          - `easiness_factor` (real, not null, default 2.5)

      2. Security
        - Enable RLS on `concepts` table
        - Add policy for authenticated users to read and manage their own concepts
    */

    CREATE TABLE IF NOT EXISTS concepts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id),
      name TEXT NOT NULL,
      learned_at TIMESTAMPTZ NOT NULL,
      next_revision_at TIMESTAMPTZ NOT NULL,
      revision_interval INTEGER NOT NULL DEFAULT 1,
      easiness_factor REAL NOT NULL DEFAULT 2.5
    );

    ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can read own concepts"
      ON concepts
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own concepts"
      ON concepts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own concepts"
      ON concepts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own concepts"
      ON concepts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);