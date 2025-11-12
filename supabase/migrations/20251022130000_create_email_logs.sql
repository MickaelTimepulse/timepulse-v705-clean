/*
  # Create Email Logs Table for Monitoring

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `to_email` (text) - Recipient email address
      - `from_email` (text) - Sender email address
      - `subject` (text) - Email subject
      - `status` (text) - Status of the email (success, failed, pending)
      - `error_message` (text, nullable) - Error message if failed
      - `message_id` (text, nullable) - OxiMailing message ID
      - `metadata` (jsonb, nullable) - Additional metadata
      - `created_at` (timestamptz) - When the log was created
      - `sent_at` (timestamptz, nullable) - When the email was actually sent

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for authenticated admin users to read logs
    - No public access

  3. Indexes
    - Index on `status` for filtering
    - Index on `created_at` for sorting
    - Index on `to_email` for searching
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  message_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read all logs
CREATE POLICY "Admin users can read all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
