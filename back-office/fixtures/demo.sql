-- Coliclic demo v1 -- PostgreSQL 16, existing Hibernate schema required.
-- Run the ENTIRE file with autocommit enabled. No application startup hook.
-- Reserved IDs: -910000001 .. -910001000 (independently in each table).
-- Password for every account: ColiclicDemo2026! (BCrypt).
BEGIN;

-- Serialize fixture runs and prevent a concurrent write between checks/inserts.
LOCK TABLE users, trips, trip_bookings, traveler_reviews, parcel_requests,
    conversations, messages, trip_alerts IN SHARE ROW EXCLUSIVE MODE;

-- Curated fictional identities, with realistic names and non-deliverable email addresses.
CREATE TEMP TABLE fixture_people (n integer, first_name text, last_name text, email text) ON COMMIT DROP;
INSERT INTO fixture_people VALUES
 (1,'Aïcha','Koné','aicha.kone@example.test'),
 (2,'Thomas','Martin','thomas.martin@example.test'),
 (3,'Fatou','Diallo','fatou.diallo@example.test'),
 (4,'Jean','Dupont','jean.dupont@example.test'),
 (5,'Aminata','Traoré','aminata.traore@example.test'),
 (6,'Moussa','Diop','moussa.diop@example.test'),
 (7,'Chloé','Bernard','chloe.bernard@example.test'),
 (8,'Koffi','Kouassi','koffi.kouassi@example.test'),
 (9,'Mariama','Ndiaye','mariama.ndiaye@example.test'),
 (10,'Ibrahim','Ouédraogo','ibrahim.ouedraogo@example.test'),
 (11,'Sarah','Moreau','sarah.moreau@example.test'),
 (12,'Yao','Nguessan','yao.nguessan@example.test'),
 (13,'Awa','Coulibaly','awa.coulibaly@example.test'),
 (14,'Lucas','Petit','lucas.petit@example.test'),
 (15,'Adama','Ouattara','adama.ouattara@example.test'),
 (16,'Nadia','Benali','nadia.benali@example.test'),
 (17,'Ousmane','Sow','ousmane.sow@example.test'),
 (18,'Camille','Laurent','camille.laurent@example.test'),
 (19,'Grace','Mensah','grace.mensah@example.test'),
 (20,'Karim','Elmansouri','karim.elmansouri@example.test'),
 (21,'Sophie','Lefebvre','sophie.lefebvre@example.test'),
 (22,'Souleymane','Keita','souleymane.keita@example.test'),
 (23,'Bintou','Camara','bintou.camara@example.test'),
 (24,'Hugo','Michel','hugo.michel@example.test'),
 (25,'Aya','Yapi','aya.yapi@example.test'),
 (26,'Cheikh','Fall','cheikh.fall@example.test'),
 (27,'Inès','Dubois','ines.dubois@example.test'),
 (28,'Serge','Akoto','serge.akoto@example.test'),
 (29,'Mariam','Sangaré','mariam.sangare@example.test'),
 (30,'Louis','Fournier','louis.fournier@example.test'),
 (31,'Djeneba','Sidibé','djeneba.sidibe@example.test'),
 (32,'Paul','Leroy','paul.leroy@example.test'),
 (33,'Seynabou','Ba','seynabou.ba@example.test'),
 (34,'Nicolas','Roux','nicolas.roux@example.test'),
 (35,'Assane','Sarr','assane.sarr@example.test'),
 (36,'Élodie','Vincent','elodie.vincent@example.test'),
 (37,'Diane','Koffi','diane.koffi@example.test'),
 (38,'Issa','Bamba','issa.bamba@example.test'),
 (39,'Léa','Garnier','lea.garnier@example.test'),
 (40,'Patrick','Ndaye','patrick.ndaye@example.test'),
 (41,'Rokia','Dembélé','rokia.dembele@example.test'),
 (42,'Julien','Faure','julien.faure@example.test'),
 (43,'Aminata','Barry','aminata.barry@example.test'),
 (44,'David','Adjei','david.adjei@example.test'),
 (45,'Emma','Rousseau','emma.rousseau@example.test'),
 (46,'Abdoulaye','Cissé','abdoulaye.cisse@example.test'),
 (47,'Hawa','Fofana','hawa.fofana@example.test'),
 (48,'Mathieu','Girard','mathieu.girard@example.test'),
 (49,'Christelle','Amani','christelle.amani@example.test'),
 (50,'Idrissa','Tall','idrissa.tall@example.test'),
 (51,'Aminata','Sissoko','aminata.sissoko@example.test'),
 (52,'Antoine','André','antoine.andre@example.test'),
 (53,'Nafissatou','Kane','nafissatou.kane@example.test'),
 (54,'Éric','Kouamé','eric.kouame@example.test'),
 (55,'Manon','Mercier','manon.mercier@example.test'),
 (56,'Amadou','Niang','amadou.niang@example.test'),
 (57,'Sandrine','Assi','sandrine.assi@example.test'),
 (58,'Yacouba','Sawadogo','yacouba.sawadogo@example.test'),
 (59,'Alice','Blanc','alice.blanc@example.test'),
 (60,'Habib','Bensalem','habib.bensalem@example.test'),
 (61,'Sita','Touré','sita.toure@example.test'),
 (62,'Pierre','Guérin','pierre.guerin@example.test'),
 (63,'Maimouna','Sy','maimouna.sy@example.test'),
 (64,'Franck','Tano','franck.tano@example.test'),
 (65,'Clara','Boyer','clara.boyer@example.test'),
 (66,'Fabrice','Agbeko','fabrice.agbeko@example.test'),
 (67,'Salimata','Sanogo','salimata.sanogo@example.test'),
 (68,'Victor','Chevalier','victor.chevalier@example.test'),
 (69,'Naïma','Amrani','naima.amrani@example.test'),
 (70,'Malick','Gueye','malick.gueye@example.test'),
 (71,'Lucie','François','lucie.francois@example.test'),
 (72,'Armand','Soro','armand.soro@example.test'),
 (73,'Fanta','Doumbia','fanta.doumbia@example.test'),
 (74,'Guillaume','Legrand','guillaume.legrand@example.test'),
 (75,'Esther','Ahou','esther.ahou@example.test'),
 (76,'Samba','Dieng','samba.dieng@example.test'),
 (77,'Amélie','Gauthier','amelie.gauthier@example.test'),
 (78,'Hervé','Zadi','herve.zadi@example.test'),
 (79,'Oumou','Bah','oumou.bah@example.test'),
 (80,'Romain','Garcia','romain.garcia@example.test'),
 (81,'Agnès','Adou','agnes.adou@example.test'),
 (82,'Boubacar','Diallo','boubacar.diallo@example.test'),
 (83,'Julie','Bonnet','julie.bonnet@example.test'),
 (84,'Hassan','Idrissi','hassan.idrissi@example.test'),
 (85,'Mélanie','Lambert','melanie.lambert@example.test'),
 (86,'Lassina','Ouédraogo','lassina.ouedraogo@example.test'),
 (87,'Aminata','Dabo','aminata.dabo@example.test'),
 (88,'Vincent','Fontaine','vincent.fontaine@example.test'),
 (89,'Clarisse','Yao','clarisse.yao@example.test'),
 (90,'Sékou','Condé','sekou.conde@example.test'),
 (91,'Charlotte','Masson','charlotte.masson@example.test'),
 (92,'Roger','Amouzou','roger.amouzou@example.test'),
 (93,'Aïssatou','Baldé','aissatou.balde@example.test'),
 (94,'Benoît','Robin','benoit.robin@example.test'),
 (95,'Aïcha','Benomar','aicha.benomar@example.test'),
 (96,'Modou','Thiam','modou.thiam@example.test'),
 (97,'Pauline','Clément','pauline.clement@example.test'),
 (98,'Alain','Nguessan','alain.nguessan@example.test'),
 (99,'Djamila','Belkacem','djamila.belkacem@example.test'),
 (100,'Mamadou','Kébé','mamadou.kebe@example.test');

-- Reuse the original clock on rerun; never refresh existing demo dates.
CREATE TEMP TABLE fixture_clock ON COMMIT DROP AS
SELECT COALESCE((SELECT created_at + (400 - (-id - 910000000)) * INTERVAL '1 day'
                 FROM users WHERE id BETWEEN -910000100 AND -910000001
                   AND (email = (SELECT p.email FROM fixture_people p WHERE p.n=-users.id-910000000)
                        OR email = 'fixture.user' || lpad((-id-910000000)::text,3,'0') || '@example.test')
                 ORDER BY id DESC LIMIT 1), LOCALTIMESTAMP) AS base_time;

-- Staging tables have the deployed column layout, without defaults/sequences.
CREATE TEMP TABLE fixture_users ON COMMIT DROP AS SELECT * FROM users WITH NO DATA;
CREATE TEMP TABLE fixture_trips ON COMMIT DROP AS SELECT * FROM trips WITH NO DATA;
CREATE TEMP TABLE fixture_trip_bookings ON COMMIT DROP AS SELECT * FROM trip_bookings WITH NO DATA;
CREATE TEMP TABLE fixture_traveler_reviews ON COMMIT DROP AS SELECT * FROM traveler_reviews WITH NO DATA;
CREATE TEMP TABLE fixture_parcel_requests ON COMMIT DROP AS SELECT * FROM parcel_requests WITH NO DATA;
CREATE TEMP TABLE fixture_conversations ON COMMIT DROP AS SELECT * FROM conversations WITH NO DATA;
CREATE TEMP TABLE fixture_messages ON COMMIT DROP AS SELECT * FROM messages WITH NO DATA;
CREATE TEMP TABLE fixture_trip_alerts ON COMMIT DROP AS SELECT * FROM trip_alerts WITH NO DATA;

INSERT INTO fixture_users (id, first_name, last_name, email, phone, password,
    local_auth_enabled, auth_provider, enabled, role, created_at, created_at_estimated, email_verified_at)
SELECT -910000000 - n,
    p.first_name, p.last_name, p.email,
    NULL, '$2y$10$MCuSAkKiLymc7pFk.crcK.B3rzv46y5IcOZsMC/0K0FHRHHI34nDu',
    true, 'LOCAL', n <= 90, CASE WHEN n <= 2 THEN 'ADMIN' ELSE 'USER' END,
    base_time - (400-n)*INTERVAL '1 day', false,
    CASE WHEN n <= 80 THEN base_time - (400-n)*INTERVAL '1 day' + INTERVAL '1 hour' END
FROM fixture_people p CROSS JOIN fixture_clock;

-- Stable route catalog, with the same display and lowercase normalization as services.
CREATE TEMP TABLE fixture_routes (n integer, departure text, destination text) ON COMMIT DROP;
INSERT INTO fixture_routes VALUES
 (0,'Paris, France','Abidjan, Côte d''Ivoire'),
 (1,'Lyon, France','Dakar, Sénégal'),
 (2,'Bruxelles, Belgique','Douala, Cameroun'),
 (3,'Marseille, France','Tunis, Tunisie'),
 (4,'Milan, Italie','Casablanca, Maroc'),
 (5,'Madrid, Espagne','Bamako, Mali'),
 (6,'Berlin, Allemagne','Ouagadougou, Burkina Faso'),
 (7,'Abidjan, Côte d''Ivoire','Paris, France'),
 (8,'Dakar, Sénégal','Bruxelles, Belgique'),
 (9,'Cotonou, Bénin','Lomé, Togo');

INSERT INTO fixture_trips (id, reference, user_id, departure_address, destination,
    departure_time, arrival_time, max_weight, price_per_kilo, instant_acceptance, status, created_at)
SELECT -910000000-i, 'FIXTURE-' || lpad(i::text,4,'0'), -910000000-(3+(i-1)%78),
    r.departure, r.destination,
    base_time + (CASE WHEN i<=150 THEN -180+i ELSE 1+(i-151)%120 END)*INTERVAL '1 day',
    base_time + (CASE WHEN i<=150 THEN -180+i ELSE 1+(i-151)%120 END)*INTERVAL '1 day' + INTERVAL '8 hours',
    10+(i%6)*5, 4+(i%15)*0.75, i%2=0,
    CASE WHEN i<=100 THEN 'COMPLETED' WHEN i<=150 THEN 'CANCELLED' ELSE 'ACTIVE' END,
    base_time - INTERVAL '250 days' + (i%30)*INTERVAL '1 day'
FROM generate_series(1,500) AS g(i) JOIN fixture_routes r ON r.n=(i-1)%10 CROSS JOIN fixture_clock;

-- Concrete parcel scenarios shared by bookings, requests and conversations.
CREATE TEMP TABLE fixture_parcels (n integer, title text, description text, weight numeric) ON COMMIT DROP;
INSERT INTO fixture_parcels VALUES
 (0,'Manuels scolaires de mathématiques','Six manuels de collège et deux cahiers, regroupés dans un carton rigide.',2.5),
 (1,'Vêtements pour enfant','Trois ensembles en coton, un gilet et deux pyjamas dans une pochette fermée.',1.5),
 (2,'Dossier universitaire','Copies de relevés de notes et attestations dans une enveloppe cartonnée.',0.5),
 (3,'Jeux de construction','Deux boîtes de jeux sans piles, pièces rangées dans des sachets fermés.',2),
 (4,'Chaussures de sport','Une paire neuve pointure 42, dans sa boîte avec papier de protection.',1.2),
 (5,'Livres de cuisine','Trois livres reliés protégés par du papier bulle, carton de 30 × 22 × 12 cm.',2.8),
 (6,'Linge de maison','Deux draps et quatre taies propres, pliés dans un sac de rangement.',2.2),
 (7,'Tissus pour couture','Deux coupons de tissu de trois mètres, emballés à plat dans une housse.',1.8),
 (8,'Lunettes et étuis','Deux paires de lunettes de lecture dans des étuis rigides rembourrés.',0.4),
 (9,'Album photo familial','Un album relié et des tirages papier, protégés dans une pochette rigide.',1.1),
 (10,'Sac à dos scolaire','Un cartable vide et une trousse contenant crayons et règles, sans liquide.',0.9),
 (11,'Maillots de football','Quatre maillots propres et pliés, emballage souple de 25 × 20 × 10 cm.',0.8),
 (12,'Patrons de couture','Huit patrons papier et un carnet de mesures dans une chemise cartonnée.',0.6),
 (13,'Décoration en bois','Deux petits cadres en bois sans verre, chacun entouré de mousse.',1.4),
 (14,'Romans en français','Quatre romans de poche à offrir, carton fermé et coins renforcés.',1.6),
 (15,'Tenue de cérémonie','Une robe et une veste dans une housse textile, sans bijoux ni accessoires fragiles.',2.4),
 (16,'Puzzles pour enfants','Trois puzzles en carton dans leurs boîtes, pièces conditionnées séparément.',1.7),
 (17,'Serviettes de bain','Trois serviettes neuves et deux gants de toilette, sous emballage textile.',1.9),
 (18,'Cahiers et crayons','Dix cahiers et une boîte de crayons de couleur, carton renforcé.',2.6),
 (19,'Accessoires de coiffure','Peignes, brosses et pinces sans aérosol ni produit liquide, dans une trousse.',0.7);

INSERT INTO fixture_trip_bookings (id, trip_id, sender_id, title, weight, description,
    recipient_contact, status, commercial_mode, platform_fee_rate, created_at,
    parcel_policy_version, parcel_policy_accepted_at, delivered_at)
SELECT -910000000-((i-1)*2+j), t.id, -910000000-(3+(i-1+j)%78),
    parcel.title, parcel.weight, parcel.description,
    recipient.email,
    CASE WHEN i<=75 THEN 'ACCEPTED'
         WHEN i<=100 THEN CASE WHEN j=1 THEN 'DELIVERED' ELSE 'REJECTED' END
         WHEN i<=150 THEN 'CANCELLED'
         WHEN i%5=0 THEN 'REMOVED' WHEN i%5=1 THEN 'REJECTED'
         WHEN i%5=2 THEN 'CANCELLED'
         WHEN t.instant_acceptance OR j=1 THEN 'ACCEPTED' ELSE 'PENDING' END,
    'FREE', 0, t.created_at + INTERVAL '1 day', '2026-09-01', t.created_at + INTERVAL '1 day',
    CASE WHEN i BETWEEN 76 AND 100 AND j=1 THEN t.arrival_time END
FROM generate_series(1,500) AS g(i) CROSS JOIN generate_series(1,2) AS s(j)
JOIN fixture_trips t ON t.id=-910000000-i
JOIN fixture_parcels parcel ON parcel.n=(i+j)%20
JOIN fixture_people recipient ON recipient.n=3+(i+j+10)%78;

-- Include working email validation codes on accepted, active bookings.
UPDATE fixture_trip_bookings b SET validation_code=lpad((-b.id-910000000)::text,6,'0'),
    validation_delivery_channel='EMAIL', validation_delivery_status='DELIVERED',
    validation_code_sent_at=b.created_at + INTERVAL '1 hour'
FROM fixture_trips t WHERE t.id=b.trip_id AND t.status='ACTIVE' AND b.status='ACCEPTED';

INSERT INTO fixture_traveler_reviews (id, booking_id, token_hash, invited_at, rating, comment, submitted_at)
SELECT b.id, b.id, md5('fixture-review-' || b.id) || md5('fixture-token-' || b.id),
    t.arrival_time + INTERVAL '1 day',
    CASE WHEN n%3<>0 THEN 1+n%5 END,
    CASE WHEN n%3<>0 THEN (ARRAY['La remise a eu beaucoup de retard et je suis resté sans nouvelles pendant plusieurs heures.',
        'Le colis est arrivé intact, mais le lieu de remise a changé au dernier moment.',
        'Livraison effectuée avec un léger retard. Le colis était en bon état.',
        'Bonne communication avant le départ et remise du colis à l’heure convenue.',
        'Voyageur ponctuel et attentionné. Ma famille a récupéré le colis sans difficulté.'])[1+n%5] END,
    CASE WHEN n%3<>0 THEN t.arrival_time + INTERVAL '2 days' END
FROM generate_series(1,150) AS g(n)
JOIN fixture_trip_bookings b ON b.id=-910000000-n JOIN fixture_trips t ON t.id=b.trip_id;

INSERT INTO fixture_parcel_requests (id, sender_id, departure, normalized_departure,
    destination, normalized_destination, desired_date, package_title, weight, description,
    status, created_at, updated_at, deleted_at)
SELECT -910000000-i, -910000000-(3+(i-1)%78), r.departure, lower(r.departure),
    r.destination, lower(r.destination),
    CASE WHEN i%4<>0 THEN (base_time + (1+i%60)*INTERVAL '1 day')::date END,
    parcel.title, parcel.weight,
    'Je cherche un voyageur de ' || r.departure || ' vers ' || r.destination || '. ' || parcel.description,
    CASE WHEN i%5=0 THEN 'CLOSED' WHEN i%5=1 THEN 'CANCELLED' ELSE 'ACTIVE' END,
    base_time-INTERVAL '10 days', base_time-INTERVAL '5 days',
    CASE WHEN i%5=1 AND i%2=0 THEN base_time-INTERVAL '5 days' END
FROM generate_series(1,200) AS g(i) JOIN fixture_routes r ON r.n=(i-1)%10
JOIN fixture_parcels parcel ON parcel.n=(i-1)%20 CROSS JOIN fixture_clock;

INSERT INTO fixture_conversations (id, trip_id, parcel_request_id, participant1_id, participant2_id, created_at)
SELECT -910000000-i,
    CASE WHEN i<=100 THEN t.id END, CASE WHEN i>100 THEN p.id END,
    CASE WHEN i<=100 THEN t.user_id ELSE p.sender_id END,
    -910000000-(3+i%78),
    CASE WHEN i<=100 THEN t.created_at+INTERVAL '2 days' ELSE p.created_at+INTERVAL '1 day' END
FROM generate_series(1,200) AS g(i)
JOIN fixture_trips t ON t.id=-910000000-i JOIN fixture_parcel_requests p ON p.id=-910000000-i;

INSERT INTO fixture_messages (id, conversation_id, sender_id, content, sent_at, read)
SELECT -910000000-((i-1)*4+j), c.id,
    CASE WHEN j%2=1 THEN c.participant1_id ELSE c.participant2_id END,
    CASE WHEN i<=100 THEN
        (ARRAY[
            'Bonjour ' || contact.first_name || ', je voyage de ' || t.departure_address || ' vers ' || t.destination || '. Quel colis souhaitez-vous envoyer ?',
            'Bonjour ' || owner.first_name || ', il s’agit de : ' || parcel.description,
            'Merci pour ces précisions. Pouvez-vous me remettre le colis la veille du départ ?',
            'Oui, je suis disponible en fin de journée. Précisons ensemble le lieu et l’heure de remise.'
        ])[j]
    ELSE
        (ARRAY[
            'Bonjour ' || contact.first_name || ', je cherche à envoyer un colis de ' || p.departure || ' vers ' || p.destination || '. Votre trajet pourrait-il convenir ?',
            'Bonjour ' || owner.first_name || ', je peux envisager ce transport. Quel est le contenu et le poids du colis ?',
            p.description || ' Le poids est de ' || p.weight || ' kg.',
            'Merci, le contenu me convient. Vérifions ensemble les dates et le tarif avant de réserver.'
        ])[j]
    END,
    c.created_at+j*INTERVAL '5 minutes', j<=2 OR i%2=0
FROM generate_series(1,200) AS g(i) CROSS JOIN generate_series(1,4) AS s(j)
JOIN fixture_conversations c ON c.id=-910000000-i
JOIN fixture_people owner ON owner.n=-c.participant1_id-910000000
JOIN fixture_people contact ON contact.n=-c.participant2_id-910000000
LEFT JOIN fixture_trips t ON t.id=c.trip_id
LEFT JOIN fixture_parcel_requests p ON p.id=c.parcel_request_id
JOIN fixture_parcels parcel ON parcel.n=(i+1)%20;

INSERT INTO fixture_trip_alerts (id, user_id, departure, normalized_departure,
    destination, normalized_destination, date, sort, min_price, max_price, created_at)
SELECT -910000000-i, -910000000-(3+(i-1)%78), r.departure, lower(r.departure),
    r.destination, lower(r.destination),
    CASE WHEN i%3<>0 THEN (base_time+(1+i%60)*INTERVAL '1 day')::date END,
    (ARRAY['price_asc','departure_asc','rating_desc'])[1+i%3],
    CASE WHEN i%2=0 THEN 3 END, CASE WHEN i%2=0 THEN 20 END,
    base_time-INTERVAL '3 days'
FROM generate_series(1,100) AS g(i) JOIN fixture_routes r ON r.n=(i-1)%10 CROSS JOIN fixture_clock;

-- Recognize the original fixture's stable labels too, without rewriting existing rows.
CREATE TEMP TABLE fixture_legacy_keys (target text, id bigint, key text, value text) ON COMMIT DROP;
INSERT INTO fixture_legacy_keys
SELECT 'users', -910000000-n, 'email', 'fixture.user' || lpad(n::text,3,'0') || '@example.test'
FROM generate_series(1,100) AS g(n)
UNION ALL
SELECT 'trip_bookings', -910000000-((i-1)*2+j), 'title',
    'FIXTURE colis ' || ((i-1)*2+j) || ' - ' ||
    (ARRAY['Livres','Vêtements','Documents','Jouets','Accessoires'])[1+(i+j)%5]
FROM generate_series(1,500) AS g(i) CROSS JOIN generate_series(1,2) AS s(j)
UNION ALL
SELECT 'parcel_requests', -910000000-i, 'package_title', 'FIXTURE demande ' || i || ' - effets personnels'
FROM generate_series(1,200) AS g(i)
UNION ALL
SELECT 'messages', -910000000-((i-1)*4+j), 'content',
    'FIXTURE message ' || ((i-1)*4+j) || ' : ' ||
    (ARRAY['Bonjour, le transport est-il disponible ?','Oui, quel est le contenu du colis ?',
           'Des livres et des vêtements soigneusement emballés.','Merci, organisons la remise.'])[j]
FROM generate_series(1,200) AS g(i) CROSS JOIN generate_series(1,4) AS s(j);

-- Ownership keys distinguish a previous fixture run from unrelated reserved-ID rows.
-- Mutable status/profile/timestamp fields are deliberately preserved on rerun.
DO $fixture$
DECLARE
    target text;
    keys text[];
    collision boolean;
BEGIN
    FOREACH target IN ARRAY ARRAY['users','trips','trip_bookings','traveler_reviews',
        'parcel_requests','conversations','messages','trip_alerts']
    LOOP
        keys := CASE target
            WHEN 'users' THEN ARRAY['email']
            WHEN 'trips' THEN ARRAY['reference','user_id']
            WHEN 'trip_bookings' THEN ARRAY['trip_id','sender_id','title']
            WHEN 'traveler_reviews' THEN ARRAY['booking_id','token_hash']
            WHEN 'parcel_requests' THEN ARRAY['sender_id','package_title']
            WHEN 'conversations' THEN ARRAY['trip_id','parcel_request_id','participant1_id','participant2_id']
            WHEN 'messages' THEN ARRAY['conversation_id','sender_id','content']
            WHEN 'trip_alerts' THEN ARRAY['user_id','departure','destination']
        END;
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I a JOIN %I e USING (id)
            CROSS JOIN unnest($1) k WHERE (to_jsonb(a)->k) IS DISTINCT FROM (to_jsonb(e)->k)
            AND NOT EXISTS (SELECT 1 FROM fixture_legacy_keys l
                WHERE l.target=$2 AND l.id=a.id AND l.key=k AND l.value=to_jsonb(a)->>k))',
            target, 'fixture_' || target) INTO collision USING keys, target;
        IF collision THEN
            RAISE EXCEPTION 'Fixture ID collision in table %. No data loaded.', target;
        END IF;
    END LOOP;

    -- Validate unique natural keys too, before the first persistent insert.
    IF EXISTS (SELECT 1 FROM users a JOIN fixture_users e USING (email) WHERE a.id<>e.id)
        OR EXISTS (SELECT 1 FROM trips a JOIN fixture_trips e USING (reference) WHERE a.id<>e.id)
        OR EXISTS (SELECT 1 FROM traveler_reviews a JOIN fixture_traveler_reviews e
                   ON a.booking_id=e.booking_id OR a.token_hash=e.token_hash WHERE a.id<>e.id)
        OR EXISTS (SELECT 1 FROM conversations a JOIN fixture_conversations e
                   ON a.participant1_id=e.participant1_id AND a.participant2_id=e.participant2_id
                   AND (a.trip_id=e.trip_id OR a.parcel_request_id=e.parcel_request_id) WHERE a.id<>e.id)
    THEN
        RAISE EXCEPTION 'Fixture unique key collision. No data loaded.';
    END IF;

    FOREACH target IN ARRAY ARRAY['users','trips','trip_bookings','traveler_reviews',
        'parcel_requests','conversations','messages','trip_alerts']
    LOOP
        EXECUTE format('INSERT INTO %I SELECT e.* FROM %I e
            WHERE NOT EXISTS (SELECT 1 FROM %I a WHERE a.id=e.id)',
            target, 'fixture_' || target, target);
    END LOOP;
END
$fixture$;
COMMIT;
