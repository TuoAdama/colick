-- Coliclic demo v1 -- PostgreSQL 16, existing Hibernate schema required.
-- Run the ENTIRE file with autocommit enabled. No application startup hook.
-- Reserved IDs: -910000001 .. -910001000 (independently in each table).
-- Password for every account: ColiclicDemo2026! (BCrypt).
BEGIN;

-- Serialize fixture runs and prevent a concurrent write between checks/inserts.
LOCK TABLE users, trips, trip_bookings, traveler_reviews, parcel_requests,
    conversations, messages, trip_alerts IN SHARE ROW EXCLUSIVE MODE;

-- Reuse the original clock on rerun; never refresh existing demo dates.
CREATE TEMP TABLE fixture_clock ON COMMIT DROP AS
SELECT COALESCE((SELECT created_at + (400 - (-id - 910000000)) * INTERVAL '1 day'
                 FROM users WHERE id BETWEEN -910000100 AND -910000001
                   AND email = 'fixture.user' || lpad((-id - 910000000)::text, 3, '0') || '@example.test'
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
    (ARRAY['Aïcha','Thomas','Fatou','Jean','Aminata','Moussa','Chloé','Koffi','Mariama','Ibrahim'])[1 + (n-1)%10],
    (ARRAY['Koné','Martin','Diallo','Dupont','Traoré','Diop','Bernard','Kouassi','Ndiaye','Ouédraogo'])[1 + ((n-1)/10)%10],
    'fixture.user' || lpad(n::text, 3, '0') || '@example.test',
    NULL, '$2y$10$MCuSAkKiLymc7pFk.crcK.B3rzv46y5IcOZsMC/0K0FHRHHI34nDu',
    true, 'LOCAL', n <= 90, CASE WHEN n <= 2 THEN 'ADMIN' ELSE 'USER' END,
    base_time - (400-n)*INTERVAL '1 day', false,
    CASE WHEN n <= 80 THEN base_time - (400-n)*INTERVAL '1 day' + INTERVAL '1 hour' END
FROM generate_series(1,100) AS g(n) CROSS JOIN fixture_clock;

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

INSERT INTO fixture_trip_bookings (id, trip_id, sender_id, title, weight, description,
    recipient_contact, status, commercial_mode, platform_fee_rate, created_at,
    parcel_policy_version, parcel_policy_accepted_at, delivered_at)
SELECT -910000000-((i-1)*2+j), t.id, -910000000-(3+(i-1+j)%78),
    'FIXTURE colis ' || ((i-1)*2+j) || ' - ' ||
      (ARRAY['Livres','Vêtements','Documents','Jouets','Accessoires'])[1+(i+j)%5],
    1+(i+j)%3, CASE WHEN i%4<>0 THEN 'Colis de démonstration emballé et déclaré au voyageur.' END,
    'fixture.recipient' || i || '@example.test',
    CASE WHEN i<=75 THEN 'ACCEPTED'
         WHEN i<=100 THEN CASE WHEN j=1 THEN 'DELIVERED' ELSE 'REJECTED' END
         WHEN i<=150 THEN 'CANCELLED'
         WHEN i%5=0 THEN 'REMOVED' WHEN i%5=1 THEN 'REJECTED'
         WHEN i%5=2 THEN 'CANCELLED'
         WHEN t.instant_acceptance OR j=1 THEN 'ACCEPTED' ELSE 'PENDING' END,
    'FREE', 0, t.created_at + INTERVAL '1 day', '2026-09-01', t.created_at + INTERVAL '1 day',
    CASE WHEN i BETWEEN 76 AND 100 AND j=1 THEN t.arrival_time END
FROM generate_series(1,500) AS g(i) CROSS JOIN generate_series(1,2) AS s(j)
JOIN fixture_trips t ON t.id=-910000000-i;

-- Include working email validation codes on accepted, active bookings.
UPDATE fixture_trip_bookings b SET validation_code=lpad((-b.id-910000000)::text,6,'0'),
    validation_delivery_channel='EMAIL', validation_delivery_status='DELIVERED',
    validation_code_sent_at=b.created_at + INTERVAL '1 hour'
FROM fixture_trips t WHERE t.id=b.trip_id AND t.status='ACTIVE' AND b.status='ACCEPTED';

INSERT INTO fixture_traveler_reviews (id, booking_id, token_hash, invited_at, rating, comment, submitted_at)
SELECT b.id, b.id, md5('fixture-review-' || b.id) || md5('fixture-token-' || b.id),
    t.arrival_time + INTERVAL '1 day',
    CASE WHEN n%3<>0 THEN 1+n%5 END,
    CASE WHEN n%3<>0 THEN (ARRAY['Livraison soignée.','Bonne communication.','Retard à la remise.','Très satisfait.','Service correct.'])[1+n%5] END,
    CASE WHEN n%3<>0 THEN t.arrival_time + INTERVAL '2 days' END
FROM generate_series(1,150) AS g(n)
JOIN fixture_trip_bookings b ON b.id=-910000000-n JOIN fixture_trips t ON t.id=b.trip_id;

INSERT INTO fixture_parcel_requests (id, sender_id, departure, normalized_departure,
    destination, normalized_destination, desired_date, package_title, weight, description,
    status, created_at, updated_at, deleted_at)
SELECT -910000000-i, -910000000-(3+(i-1)%78), r.departure, lower(r.departure),
    r.destination, lower(r.destination),
    CASE WHEN i%4<>0 THEN (base_time + (1+i%60)*INTERVAL '1 day')::date END,
    'FIXTURE demande ' || i || ' - effets personnels', 0.5+(i%20)*0.5,
    CASE WHEN i%3<>0 THEN 'Recherche un voyageur pour un petit colis de démonstration.' END,
    CASE WHEN i%5=0 THEN 'CLOSED' WHEN i%5=1 THEN 'CANCELLED' ELSE 'ACTIVE' END,
    base_time-INTERVAL '10 days', base_time-INTERVAL '5 days',
    CASE WHEN i%5=1 AND i%2=0 THEN base_time-INTERVAL '5 days' END
FROM generate_series(1,200) AS g(i) JOIN fixture_routes r ON r.n=(i-1)%10 CROSS JOIN fixture_clock;

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
    'FIXTURE message ' || ((i-1)*4+j) || ' : ' ||
      (ARRAY['Bonjour, le transport est-il disponible ?','Oui, quel est le contenu du colis ?',
             'Des livres et des vêtements soigneusement emballés.','Merci, organisons la remise.'])[j],
    c.created_at+j*INTERVAL '5 minutes', j<=2 OR i%2=0
FROM generate_series(1,200) AS g(i) CROSS JOIN generate_series(1,4) AS s(j)
JOIN fixture_conversations c ON c.id=-910000000-i;

INSERT INTO fixture_trip_alerts (id, user_id, departure, normalized_departure,
    destination, normalized_destination, date, sort, min_price, max_price, created_at)
SELECT -910000000-i, -910000000-(3+(i-1)%78), r.departure, lower(r.departure),
    r.destination, lower(r.destination),
    CASE WHEN i%3<>0 THEN (base_time+(1+i%60)*INTERVAL '1 day')::date END,
    (ARRAY['price_asc','departure_asc','rating_desc'])[1+i%3],
    CASE WHEN i%2=0 THEN 3 END, CASE WHEN i%2=0 THEN 20 END,
    base_time-INTERVAL '3 days'
FROM generate_series(1,100) AS g(i) JOIN fixture_routes r ON r.n=(i-1)%10 CROSS JOIN fixture_clock;

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
            CROSS JOIN unnest($1) k WHERE (to_jsonb(a)->k) IS DISTINCT FROM (to_jsonb(e)->k))',
            target, 'fixture_' || target) INTO collision USING keys;
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
