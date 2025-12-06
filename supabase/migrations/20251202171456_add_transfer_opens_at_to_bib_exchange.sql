/*
  # Add opening date to Bib Exchange
  
  1. Changes
    - Add `transfer_opens_at` column to `bib_exchange_settings`
    - Allows organizers to control when the bib exchange marketplace opens
    - Nullable to maintain backward compatibility
  
  2. Notes
    - If NULL, the bib exchange is considered always open (when enabled)
    - If set, listings are only visible after this date/time
    - Works in conjunction with `transfer_deadline` for a complete window
*/

-- Add transfer_opens_at column
ALTER TABLE bib_exchange_settings
ADD COLUMN IF NOT EXISTS transfer_opens_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN bib_exchange_settings.transfer_opens_at IS 
'Date and time when the bib exchange opens. If NULL, opens immediately when enabled.';

COMMENT ON COLUMN bib_exchange_settings.transfer_deadline IS 
'Date and time when the bib exchange closes. No more transfers accepted after this date.';
