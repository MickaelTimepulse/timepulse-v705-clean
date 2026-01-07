SELECT 
  id,
  name,
  slug,
  public_registration,
  registration_url,
  registration_opens,
  registration_closes,
  status
FROM events 
WHERE name ILIKE '%RUN GREEN%'
ORDER BY created_at DESC
LIMIT 3;
