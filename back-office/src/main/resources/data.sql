-- Seed data for the locations reference table.
-- Uses ON CONFLICT to remain idempotent across restarts.

-- ===================== COUNTRIES =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('France', 'France', 'FR', 'EUROPE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Belgique', 'Belgique', 'BE', 'EUROPE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Italie', 'Italie', 'IT', 'EUROPE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Espagne', 'Espagne', 'ES', 'EUROPE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Allemagne', 'Allemagne', 'DE', 'EUROPE', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;

INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Côte d''Ivoire', 'Côte d''Ivoire', 'CI', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Burkina Faso', 'Burkina Faso', 'BF', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Mali', 'Mali', 'ML', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Guinée', 'Guinée', 'GN', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Sénégal', 'Sénégal', 'SN', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bénin', 'Bénin', 'BJ', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Cameroun', 'Cameroun', 'CM', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Maroc', 'Maroc', 'MA', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Togo', 'Togo', 'TG', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Gabon', 'Gabon', 'GA', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Tunisie', 'Tunisie', 'TN', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Algérie', 'Algérie', 'DZ', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Congo', 'Congo', 'CG', 'AFRICA', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — France =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Paris', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Marseille', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Lyon', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Toulouse', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nice', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nantes', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Strasbourg', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Montpellier', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bordeaux', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Lille', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Saint-Denis', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Aubervilliers', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Argenteuil', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Montreuil', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Créteil', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nanterre', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Vitry-sur-Seine', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Saint-Ouen', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Drancy', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Clichy-sous-Bois', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Rouen', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Le Havre', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Caen', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Reims', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Metz', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nancy', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Dijon', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Orléans', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Tours', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Clermont-Ferrand', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Grenoble', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Saint-Étienne', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Toulon', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Avignon', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Perpignan', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nîmes', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Angers', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Le Mans', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Brest', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Rennes', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Mulhouse', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Besançon', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Amiens', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Limoges', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Poitiers', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Annecy', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Chambéry', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Valence', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Pau', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bayonne', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('La Rochelle', 'France', 'FR', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Belgique =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bruxelles', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Anvers', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Gand', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Charleroi', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Liège', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Namur', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Louvain', 'Belgique', 'BE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Italie =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Rome', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Milan', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Naples', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Turin', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Palermo', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Gênes', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bologne', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Florence', 'Italie', 'IT', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Espagne =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Madrid', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Barcelone', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Valence', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Séville', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Saragosse', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Malaga', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bilbao', 'Espagne', 'ES', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Allemagne =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Berlin', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Hambourg', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Munich', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Cologne', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Francfort', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Stuttgart', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Düsseldorf', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Dortmund', 'Allemagne', 'DE', 'EUROPE', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Côte d'Ivoire =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Abidjan', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Yamoussoukro', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bouaké', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Daloa', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('San-Pédro', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Korhogo', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Man', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Gagnoa', 'Côte d''Ivoire', 'CI', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Burkina Faso =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Ouagadougou', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bobo-Dioulasso', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Koudougou', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Banfora', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Ouahigouya', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Fada N''Gourma', 'Burkina Faso', 'BF', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Mali =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bamako', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Sikasso', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Mopti', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Ségou', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Kayes', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Gao', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Tombouctou', 'Mali', 'ML', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Guinée =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Conakry', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Kankan', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Labé', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Kindia', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Nzérékoré', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Boké', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Mamou', 'Guinée', 'GN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Sénégal =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Dakar', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Thiès', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Saint-Louis', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Kaolack', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Ziguinchor', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Diourbel', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Tambacounda', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Mbour', 'Sénégal', 'SN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Bénin =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Cotonou', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Porto-Novo', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Parakou', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Djougou', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Bohicon', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Abomey', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Natitingou', 'Bénin', 'BJ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Existing African reference data =====================
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Douala', 'Cameroun', 'CM', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Yaoundé', 'Cameroun', 'CM', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Casablanca', 'Maroc', 'MA', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Rabat', 'Maroc', 'MA', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Marrakech', 'Maroc', 'MA', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Lomé', 'Togo', 'TG', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Libreville', 'Gabon', 'GA', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Tunis', 'Tunisie', 'TN', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Alger', 'Algérie', 'DZ', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, iso_code, continent, type) VALUES ('Brazzaville', 'Congo', 'CG', 'AFRICA', 'CITY') ON CONFLICT (name, country) DO NOTHING;
