/*
  # Fix Security Issues - Part 4b: Optimize Race Pricing RLS (Corrected)

  1. Performance Optimization
    - Fix race_pricing policies with correct column name
    - Use pricing_period_id instead of period_id
*/

-- Optimize race_pricing organizer policies (corrected)
DROP POLICY IF EXISTS "Organizers can manage their race pricing" ON race_pricing;
CREATE POLICY "Organizers can manage their race pricing"
  ON race_pricing
  FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can view their race pricing" ON race_pricing;
CREATE POLICY "Organizers can view their race pricing"
  ON race_pricing
  FOR SELECT
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );
