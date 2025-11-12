/*
  # Add Production Performance Indexes

  1. Purpose
    - Optimize frequent queries for production load
    - Support thousands of searches per day
    - Improve athlete and event search performance

  2. Indexes Created
    - `idx_entries_race_id` - Fast filtering by race
    - `idx_entries_bib_number` - Quick bib number lookups
    - `idx_athletes_search` - Full-text search on athlete names
    - `idx_events_dates` - Date range queries for event listings
    - `idx_events_status_published` - Filter published events only
    - `idx_registrations_race` - Registration queries by race
    - `idx_carpooling_event` - Carpooling offers by event
    - `idx_bib_exchange_race` - Bib exchange by race

  3. Performance Impact
    - Expected 10-100x faster queries on large datasets
    - Critical for handling thousands of concurrent users
*/

-- Entries table indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_entries_race_id ON entries(race_id);
CREATE INDEX IF NOT EXISTS idx_entries_bib_number ON entries(bib_number);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status) WHERE status = 'confirmed';

-- Athletes table full-text search
CREATE INDEX IF NOT EXISTS idx_athletes_search ON athletes
  USING gin(to_tsvector('french', coalesce(first_name, '') || ' ' || coalesce(last_name, '')));

CREATE INDEX IF NOT EXISTS idx_athletes_nationality ON athletes(nationality) WHERE nationality IS NOT NULL;

-- Events table indexes for public listings
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_status_published ON events(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- Races table
CREATE INDEX IF NOT EXISTS idx_races_event_id ON races(event_id);
CREATE INDEX IF NOT EXISTS idx_races_sport_type ON races(sport_type);

-- Registrations table (high volume)
CREATE INDEX IF NOT EXISTS idx_registrations_race ON registrations(race_id);
CREATE INDEX IF NOT EXISTS idx_registrations_athlete ON registrations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at DESC);

-- Carpooling offers (real-time queries)
CREATE INDEX IF NOT EXISTS idx_carpooling_event ON carpooling_offers(event_id);
CREATE INDEX IF NOT EXISTS idx_carpooling_departure_date ON carpooling_offers(departure_date);
CREATE INDEX IF NOT EXISTS idx_carpooling_available_seats ON carpooling_offers(available_seats)
  WHERE available_seats > 0;

-- Bib exchange (real-time listings)
CREATE INDEX IF NOT EXISTS idx_bib_exchange_race ON bib_exchange(race_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_status ON bib_exchange(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_bib_exchange_created ON bib_exchange(created_at DESC);

-- Audit logs (compliance and debugging)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- Email logs (monitoring)
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_event ON email_logs(event_id) WHERE event_id IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_entries_race_status ON entries(race_id, status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_race_created ON registrations(race_id, created_at DESC);

-- VACUUM ANALYZE to update statistics after index creation
VACUUM ANALYZE entries;
VACUUM ANALYZE athletes;
VACUUM ANALYZE events;
VACUUM ANALYZE races;
VACUUM ANALYZE registrations;
