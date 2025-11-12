/*
  # Fix FFA Settings Storage
  
  1. Changes
    - Insert a dedicated row for FFA settings if it doesn't exist
    - This row will hold ffa_api_uid and ffa_api_password in the columns
    - Update frontend to target this specific row
    
  2. Security
    - Maintain existing RLS policies
*/

-- Insert a dedicated row for FFA settings if it doesn't exist
INSERT INTO settings (id, key, category, description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ffa_credentials',
  'integrations',
  'FFA/SIFFA webservice credentials'
)
ON CONFLICT (key) DO NOTHING;

-- Ensure the row exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM settings WHERE key = 'ffa_credentials') THEN
    INSERT INTO settings (id, key, category, description)
    VALUES (
      gen_random_uuid(),
      'ffa_credentials',
      'integrations',
      'FFA/SIFFA webservice credentials'
    );
  END IF;
END $$;