/*
  # Enable Realtime on carpooling_bookings

  1. Changes
    - Enable realtime/replica identity on carpooling_bookings table
    
  2. Purpose
    - Allow real-time updates when passengers book carpooling offers
    - Organizers can see bookings appear instantly without refreshing
*/

-- Enable realtime for carpooling_bookings
ALTER TABLE carpooling_bookings REPLICA IDENTITY FULL;

-- The table should already have realtime enabled via Supabase dashboard
-- but we ensure the replica identity is set for proper change tracking
