/*
  # Add federation logos

  1. Updates
    - Add logo_url for each federation (FFA, FFTRI, UFOLEP, UNSS, UGSEL)
    - Logos are stored in public folder and served as static assets

  2. Notes
    - Logo files are already in /public/ folder
    - URLs point to public static files
    - UGSEL doesn't have a logo yet (can be added later)
*/

-- Update federation logos
UPDATE federations SET logo_url = '/LOGO FFA.webp' WHERE code = 'FFA';
UPDATE federations SET logo_url = '/LOGO FFTRI.png' WHERE code = 'FFTRI';
UPDATE federations SET logo_url = '/LOGO UFOLEP.png' WHERE code = 'UFOLEP';
UPDATE federations SET logo_url = '/LOGO UNSS.png' WHERE code = 'UNSS';
