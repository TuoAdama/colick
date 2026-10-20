-- Seed data for the locations reference table.
-- Uses ON CONFLICT to remain idempotent across restarts.

-- ===================== COUNTRIES =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('France', 'France', 'FR', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Belgique', 'Belgique', 'BE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Italie', 'Italie', 'IT', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Espagne', 'Espagne', 'ES', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Allemagne', 'Allemagne', 'DE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;

INSERT INTO locations (name, country, iso_code, type) VALUES ('Côte d''Ivoire', 'Côte d''Ivoire', 'CI', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Burkina Faso', 'Burkina Faso', 'BF', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Mali', 'Mali', 'ML', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Guinée', 'Guinée', 'GN', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Sénégal', 'Sénégal', 'SN', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bénin', 'Bénin', 'BJ', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Cameroun', 'Cameroun', 'CM', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Maroc', 'Maroc', 'MA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Togo', 'Togo', 'TG', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Gabon', 'Gabon', 'GA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Tunisie', 'Tunisie', 'TN', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Algérie', 'Algérie', 'DZ', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Congo', 'Congo', 'CG', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — France =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Paris', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Marseille', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Lyon', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Toulouse', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nice', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nantes', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Strasbourg', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Montpellier', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bordeaux', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Lille', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Saint-Denis', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Aubervilliers', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Argenteuil', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Montreuil', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Créteil', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nanterre', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Vitry-sur-Seine', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Saint-Ouen', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Drancy', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Clichy-sous-Bois', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Rouen', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Le Havre', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Caen', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Reims', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Metz', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nancy', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Dijon', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Orléans', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Tours', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Clermont-Ferrand', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Grenoble', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Saint-Étienne', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Toulon', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Avignon', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Perpignan', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nîmes', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Angers', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Le Mans', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Brest', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Rennes', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Mulhouse', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Besançon', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Amiens', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Limoges', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Poitiers', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Annecy', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Chambéry', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Valence', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Pau', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bayonne', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('La Rochelle', 'France', 'FR', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Belgique =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bruxelles', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Anvers', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Gand', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Charleroi', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Liège', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Namur', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Louvain', 'Belgique', 'BE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Italie =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Rome', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Milan', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Naples', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Turin', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Palermo', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Gênes', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bologne', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Florence', 'Italie', 'IT', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Espagne =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Madrid', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Barcelone', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Valence', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Séville', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Saragosse', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Malaga', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bilbao', 'Espagne', 'ES', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Allemagne =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Berlin', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Hambourg', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Munich', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Cologne', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Francfort', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Stuttgart', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Düsseldorf', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Dortmund', 'Allemagne', 'DE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Côte d'Ivoire =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Abidjan', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Yamoussoukro', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bouaké', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Daloa', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('San-Pédro', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Korhogo', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Man', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Gagnoa', 'Côte d''Ivoire', 'CI', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Burkina Faso =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Ouagadougou', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bobo-Dioulasso', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Koudougou', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Banfora', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Ouahigouya', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Fada N''Gourma', 'Burkina Faso', 'BF', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Mali =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bamako', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Sikasso', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Mopti', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Ségou', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Kayes', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Gao', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Tombouctou', 'Mali', 'ML', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Guinée =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Conakry', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Kankan', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Labé', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Kindia', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Nzérékoré', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Boké', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Mamou', 'Guinée', 'GN', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Sénégal =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Dakar', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Thiès', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Saint-Louis', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Kaolack', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Ziguinchor', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Diourbel', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Tambacounda', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Mbour', 'Sénégal', 'SN', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Bénin =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Cotonou', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Porto-Novo', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Parakou', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Djougou', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Bohicon', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Abomey', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Natitingou', 'Bénin', 'BJ', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Existing African reference data =====================
INSERT INTO locations (name, country, iso_code, type) VALUES ('Douala', 'Cameroun', 'CM', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Yaoundé', 'Cameroun', 'CM', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Casablanca', 'Maroc', 'MA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Rabat', 'Maroc', 'MA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Marrakech', 'Maroc', 'MA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Lomé', 'Togo', 'TG', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Libreville', 'Gabon', 'GA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Tunis', 'Tunisie', 'TN', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Alger', 'Algérie', 'DZ', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, type) VALUES ('Brazzaville', 'Congo', 'CG', 'CITY') ON CONFLICT (name, country) DO NOTHING;
