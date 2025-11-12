/*
  # Seed European Cities
  
  Ajout des principales villes européennes avec codes postaux.
  Focus sur France, Espagne, Italie, Allemagne, Belgique, Suisse, Portugal.
*/

INSERT INTO european_cities (city_name, postal_code, country_code, country_name, region) VALUES
-- FRANCE (principales villes)
('Paris', '75001', 'FR', 'France', 'Île-de-France'),
('Marseille', '13001', 'FR', 'France', 'Provence-Alpes-Côte d''Azur'),
('Lyon', '69001', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Toulouse', '31000', 'FR', 'France', 'Occitanie'),
('Nice', '06000', 'FR', 'France', 'Provence-Alpes-Côte d''Azur'),
('Nantes', '44000', 'FR', 'France', 'Pays de la Loire'),
('Montpellier', '34000', 'FR', 'France', 'Occitanie'),
('Strasbourg', '67000', 'FR', 'France', 'Grand Est'),
('Bordeaux', '33000', 'FR', 'France', 'Nouvelle-Aquitaine'),
('Lille', '59000', 'FR', 'France', 'Hauts-de-France'),
('Rennes', '35000', 'FR', 'France', 'Bretagne'),
('Reims', '51100', 'FR', 'France', 'Grand Est'),
('Saint-Étienne', '42000', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Toulon', '83000', 'FR', 'France', 'Provence-Alpes-Côte d''Azur'),
('Grenoble', '38000', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Dijon', '21000', 'FR', 'France', 'Bourgogne-Franche-Comté'),
('Angers', '49000', 'FR', 'France', 'Pays de la Loire'),
('Nîmes', '30000', 'FR', 'France', 'Occitanie'),
('Villeurbanne', '69100', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Le Mans', '72000', 'FR', 'France', 'Pays de la Loire'),
('Aix-en-Provence', '13100', 'FR', 'France', 'Provence-Alpes-Côte d''Azur'),
('Clermont-Ferrand', '63000', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Brest', '29200', 'FR', 'France', 'Bretagne'),
('Tours', '37000', 'FR', 'France', 'Centre-Val de Loire'),
('Amiens', '80000', 'FR', 'France', 'Hauts-de-France'),
('Limoges', '87000', 'FR', 'France', 'Nouvelle-Aquitaine'),
('Annecy', '74000', 'FR', 'France', 'Auvergne-Rhône-Alpes'),
('Perpignan', '66000', 'FR', 'France', 'Occitanie'),
('Boulogne-Billancourt', '92100', 'FR', 'France', 'Île-de-France'),
('Metz', '57000', 'FR', 'France', 'Grand Est'),
('Besançon', '25000', 'FR', 'France', 'Bourgogne-Franche-Comté'),
('Orléans', '45000', 'FR', 'France', 'Centre-Val de Loire'),
('Rouen', '76000', 'FR', 'France', 'Normandie'),
('Mulhouse', '68100', 'FR', 'France', 'Grand Est'),
('Caen', '14000', 'FR', 'France', 'Normandie'),
('Nancy', '54000', 'FR', 'France', 'Grand Est'),
('Argenteuil', '95100', 'FR', 'France', 'Île-de-France'),
('Montreuil', '93100', 'FR', 'France', 'Île-de-France'),
('Saint-Denis', '93200', 'FR', 'France', 'Île-de-France'),

-- ESPAGNE (principales villes)
('Madrid', '28001', 'ES', 'Espagne', 'Comunidad de Madrid'),
('Barcelona', '08001', 'ES', 'Espagne', 'Cataluña'),
('Valencia', '46001', 'ES', 'Espagne', 'Comunidad Valenciana'),
('Sevilla', '41001', 'ES', 'Espagne', 'Andalucía'),
('Zaragoza', '50001', 'ES', 'Espagne', 'Aragón'),
('Málaga', '29001', 'ES', 'Espagne', 'Andalucía'),
('Murcia', '30001', 'ES', 'Espagne', 'Región de Murcia'),
('Palma', '07001', 'ES', 'Espagne', 'Islas Baleares'),
('Las Palmas', '35001', 'ES', 'Espagne', 'Canarias'),
('Bilbao', '48001', 'ES', 'Espagne', 'País Vasco'),

-- ITALIE (principales villes)
('Roma', '00100', 'IT', 'Italie', 'Lazio'),
('Milano', '20100', 'IT', 'Italie', 'Lombardia'),
('Napoli', '80100', 'IT', 'Italie', 'Campania'),
('Torino', '10100', 'IT', 'Italie', 'Piemonte'),
('Palermo', '90100', 'IT', 'Italie', 'Sicilia'),
('Genova', '16100', 'IT', 'Italie', 'Liguria'),
('Bologna', '40100', 'IT', 'Italie', 'Emilia-Romagna'),
('Firenze', '50100', 'IT', 'Italie', 'Toscana'),
('Bari', '70100', 'IT', 'Italie', 'Puglia'),
('Catania', '95100', 'IT', 'Italie', 'Sicilia'),
('Venezia', '30100', 'IT', 'Italie', 'Veneto'),
('Verona', '37100', 'IT', 'Italie', 'Veneto'),

-- ALLEMAGNE (principales villes)
('Berlin', '10115', 'DE', 'Allemagne', 'Berlin'),
('Hamburg', '20095', 'DE', 'Allemagne', 'Hamburg'),
('München', '80331', 'DE', 'Allemagne', 'Bayern'),
('Köln', '50667', 'DE', 'Allemagne', 'Nordrhein-Westfalen'),
('Frankfurt', '60311', 'DE', 'Allemagne', 'Hessen'),
('Stuttgart', '70173', 'DE', 'Allemagne', 'Baden-Württemberg'),
('Düsseldorf', '40210', 'DE', 'Allemagne', 'Nordrhein-Westfalen'),
('Dortmund', '44135', 'DE', 'Allemagne', 'Nordrhein-Westfalen'),
('Essen', '45127', 'DE', 'Allemagne', 'Nordrhein-Westfalen'),
('Leipzig', '04103', 'DE', 'Allemagne', 'Sachsen'),

-- BELGIQUE (principales villes)
('Bruxelles', '1000', 'BE', 'Belgique', 'Région de Bruxelles-Capitale'),
('Anvers', '2000', 'BE', 'Belgique', 'Flandre'),
('Gand', '9000', 'BE', 'Belgique', 'Flandre'),
('Charleroi', '6000', 'BE', 'Belgique', 'Wallonie'),
('Liège', '4000', 'BE', 'Belgique', 'Wallonie'),
('Bruges', '8000', 'BE', 'Belgique', 'Flandre'),
('Namur', '5000', 'BE', 'Belgique', 'Wallonie'),
('Louvain', '3000', 'BE', 'Belgique', 'Flandre'),

-- SUISSE (principales villes)
('Zürich', '8001', 'CH', 'Suisse', 'Zürich'),
('Genève', '1200', 'CH', 'Suisse', 'Genève'),
('Basel', '4001', 'CH', 'Suisse', 'Basel-Stadt'),
('Lausanne', '1003', 'CH', 'Suisse', 'Vaud'),
('Bern', '3011', 'CH', 'Suisse', 'Bern'),
('Winterthur', '8400', 'CH', 'Suisse', 'Zürich'),
('Luzern', '6003', 'CH', 'Suisse', 'Luzern'),

-- PORTUGAL (principales villes)
('Lisboa', '1000-001', 'PT', 'Portugal', 'Lisboa'),
('Porto', '4000-001', 'PT', 'Portugal', 'Porto'),
('Braga', '4700-001', 'PT', 'Portugal', 'Braga'),
('Coimbra', '3000-001', 'PT', 'Portugal', 'Coimbra'),
('Funchal', '9000-001', 'PT', 'Portugal', 'Madeira'),

-- PAYS-BAS (principales villes)
('Amsterdam', '1011', 'NL', 'Pays-Bas', 'Noord-Holland'),
('Rotterdam', '3011', 'NL', 'Pays-Bas', 'Zuid-Holland'),
('Den Haag', '2511', 'NL', 'Pays-Bas', 'Zuid-Holland'),
('Utrecht', '3511', 'NL', 'Pays-Bas', 'Utrecht'),
('Eindhoven', '5611', 'NL', 'Pays-Bas', 'Noord-Brabant'),

-- AUTRICHE (principales villes)
('Wien', '1010', 'AT', 'Autriche', 'Wien'),
('Graz', '8010', 'AT', 'Autriche', 'Steiermark'),
('Linz', '4020', 'AT', 'Autriche', 'Oberösterreich'),
('Salzburg', '5020', 'AT', 'Autriche', 'Salzburg'),
('Innsbruck', '6020', 'AT', 'Autriche', 'Tirol')

ON CONFLICT DO NOTHING;
