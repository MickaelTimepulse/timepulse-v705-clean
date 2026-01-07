/*
  # Add payment_status column to entries table

  1. Changes
    - Add payment_status column to entries table
    - Add payment_intent_id column to entries table
    - Add default values for existing records

  2. Security
    - No RLS changes needed, uses existing policies
*/

-- Add payment_status column to entries
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
  payment_status IN ('pending', 'completed', 'refunded', 'cancelled', 'paid')
);

-- Add payment_intent_id for Stripe/Lyra integration
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Create index for payment_status queries
CREATE INDEX IF NOT EXISTS idx_entries_payment_status ON entries(payment_status);

-- Update existing entries to have 'paid' status if they are confirmed
UPDATE entries
SET payment_status = 'paid'
WHERE status = 'confirmed' AND payment_status = 'pending';

COMMENT ON COLUMN entries.payment_status IS 'Status of payment: pending, completed, paid, refunded, cancelled';
COMMENT ON COLUMN entries.payment_intent_id IS 'Stripe or Lyra payment intent ID for tracking';
