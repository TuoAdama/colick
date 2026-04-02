-- Seed data for the locations reference table.
-- Uses ON CONFLICT to remain idempotent across restarts.

-- ===================== COUNTRIES =====================
INSERT INTO locations (name, country, type) VALUES ('France', 'France', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Côte d''Ivoire', 'Côte d''Ivoire', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Sénégal', 'Sénégal', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Mali', 'Mali', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Cameroun', 'Cameroun', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Maroc', 'Maroc', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Belgique', 'Belgique', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Allemagne', 'Allemagne', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Guinée', 'Guinée', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Togo', 'Togo', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Bénin', 'Bénin', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Gabon', 'Gabon', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Tunisie', 'Tunisie', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Algérie', 'Algérie', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Congo', 'Congo', 'COUNTRY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — France =====================
INSERT INTO locations (name, country, type) VALUES ('Paris', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Lyon', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Marseille', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Toulouse', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Nice', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Bordeaux', 'France', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Côte d'Ivoire =====================
INSERT INTO locations (name, country, type) VALUES ('Abidjan', 'Côte d''Ivoire', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Yamoussoukro', 'Côte d''Ivoire', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Bouaké', 'Côte d''Ivoire', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('San-Pédro', 'Côte d''Ivoire', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Sénégal =====================
INSERT INTO locations (name, country, type) VALUES ('Dakar', 'Sénégal', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Saint-Louis', 'Sénégal', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Thiès', 'Sénégal', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Mali =====================
INSERT INTO locations (name, country, type) VALUES ('Bamako', 'Mali', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Sikasso', 'Mali', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Cameroun =====================
INSERT INTO locations (name, country, type) VALUES ('Douala', 'Cameroun', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Yaoundé', 'Cameroun', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Maroc =====================
INSERT INTO locations (name, country, type) VALUES ('Casablanca', 'Maroc', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Rabat', 'Maroc', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Marrakech', 'Maroc', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Belgique =====================
INSERT INTO locations (name, country, type) VALUES ('Bruxelles', 'Belgique', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Anvers', 'Belgique', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Allemagne =====================
INSERT INTO locations (name, country, type) VALUES ('Berlin', 'Allemagne', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Munich', 'Allemagne', 'CITY') ON CONFLICT (name, country) DO NOTHING;
INSERT INTO locations (name, country, type) VALUES ('Francfort', 'Allemagne', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Guinée =====================
INSERT INTO locations (name, country, type) VALUES ('Conakry', 'Guinée', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Togo =====================
INSERT INTO locations (name, country, type) VALUES ('Lomé', 'Togo', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Bénin =====================
INSERT INTO locations (name, country, type) VALUES ('Cotonou', 'Bénin', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Gabon =====================
INSERT INTO locations (name, country, type) VALUES ('Libreville', 'Gabon', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Tunisie =====================
INSERT INTO locations (name, country, type) VALUES ('Tunis', 'Tunisie', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Algérie =====================
INSERT INTO locations (name, country, type) VALUES ('Alger', 'Algérie', 'CITY') ON CONFLICT (name, country) DO NOTHING;

-- ===================== CITIES — Congo =====================
INSERT INTO locations (name, country, type) VALUES ('Brazzaville', 'Congo', 'CITY') ON CONFLICT (name, country) DO NOTHING;
