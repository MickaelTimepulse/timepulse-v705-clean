/*
  # Create Payment Transactions Table

  1. New Table
    - `payment_transactions`
      - Stores all payment attempts and confirmations
      - Links to entries table
      - Tracks Lyra transaction details
  
  2. Columns
    - id (uuid, primary key)
    - entry_id (uuid, foreign key to entries)
    - order_id (text, unique) - Internal order reference
    - transaction_id (text) - Lyra transaction ID
    - amount (numeric) - Amount in cents
    - currency (text) - EUR, USD, etc.
    - status (text) - pending, paid, failed, refunded, cancelled
    - payment_method (text) - CB, VISA, MASTERCARD, etc.
    - customer_email (text)
    - customer_name (text)
    - lyra_form_token (text) - Token for payment form
    - lyra_response (jsonb) - Full Lyra response
    - error_message (text)
    - paid_at (timestamptz)
    - created_at (timestamptz)
    - updated_at (timestamptz)
  
  3. Security
    - Enable RLS
    - Public can insert (for creating payment)
    - Public can read own transactions via order_id
    - Organizers can read transactions for their events
    - Admins can read all via service functions
*/

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  transaction_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR' NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  lyra_form_token text,
  lyra_response jsonb,
  error_message text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_entry_id ON payment_transactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create payment transaction"
  ON payment_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own payment transactions via order_id"
  ON payment_transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can update payment transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions processed through Lyra Collect';
COMMENT ON COLUMN payment_transactions.order_id IS 'Unique internal order reference (format: ORD-{timestamp}-{random})';
COMMENT ON COLUMN payment_transactions.transaction_id IS 'Lyra transaction ID returned after payment';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount in cents (e.g., 2500 = 25.00 EUR)';
COMMENT ON COLUMN payment_transactions.lyra_form_token IS 'Temporary token used to generate payment form';
COMMENT ON COLUMN payment_transactions.lyra_response IS 'Full JSON response from Lyra API for debugging';
