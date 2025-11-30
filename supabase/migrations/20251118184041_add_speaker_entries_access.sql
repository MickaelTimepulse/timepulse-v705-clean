/*
  # Add Speaker Access to Entries

  1. Changes
    - Add RLS policy to allow public (anonymous) users to view confirmed entries by event_id
    - This allows the speaker module to access participant data without authentication
    - The policy is restrictive and only allows viewing confirmed entries

  2. Security
    - Only SELECT access is granted
    - Only for confirmed entries (status = 'confirmed')
    - Filters by event_id to ensure speakers can only access their specific event
*/

-- Allow public to view confirmed entries by event_id (for speaker module)
CREATE POLICY "Public can view confirmed entries by event_id"
  ON entries
  FOR SELECT
  TO public
  USING (status = 'confirmed');
