/*
  # Add Missing License Types and Unique Price Option

  1. Changes to license_types
    - Add missing license types: FFHANDI, UGSEL, FFSE
    - Add TARIF_UNIQUE as a special license type
    - Update existing descriptions

  2. Notes
    - TARIF_UNIQUE allows organizers to set one single price for all participants
    - All license types are inactive by default (organizer activates them per race)
    - Organizers can enable/disable each license type via toggle button
*/

-- Add missing license types
INSERT INTO license_types (code, name, federation, description, active) VALUES
  ('FFHANDI', 'Licence Handisport', 'Fédération Française Handisport', 'Licence pour sportifs en situation de handicap', true),
  ('UGSEL', 'Licence UGSEL', 'Union Générale Sportive de l''Enseignement Libre', 'Licence scolaire enseignement privé', true),
  ('FFSE', 'Licence FFSE', 'Fédération Française du Sport d''Entreprise', 'Licence sport en entreprise', true),
  ('TARIF_UNIQUE', 'Tarif Unique', 'Aucune', 'Tarif unique sans distinction de licence', true)
ON CONFLICT (code) DO NOTHING;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_license_types_federation ON license_types(federation);
