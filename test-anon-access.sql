-- Test anonymous access to bib_exchange_settings
-- This simulates what happens when an unauthenticated user tries to access the data

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'bib_exchange_settings'
ORDER BY policyname;

-- Now test as anonymous user
SET ROLE anon;
SET request.jwt.claims TO '{}';

-- Try to select the settings (this is what the frontend does)
SELECT id, event_id, is_enabled, transfer_deadline, allow_gender_mismatch, rules_text
FROM bib_exchange_settings
WHERE event_id = 'e9deadf9-62c6-402a-9f7f-3990044edba8';

RESET ROLE;
