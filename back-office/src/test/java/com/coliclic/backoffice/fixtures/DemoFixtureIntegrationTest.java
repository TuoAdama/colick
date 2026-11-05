package com.coliclic.backoffice.fixtures;

import com.coliclic.backoffice.config.PostgresStatusConstraintSynchronizer;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.TripReferenceGenerator;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest(showSql = false, properties = {"spring.sql.init.mode=never", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
class DemoFixtureIntegrationTest {
    private static final Map<String, Integer> COUNTS = Map.of(
            "users", 100, "trips", 500, "trip_bookings", 1000, "traveler_reviews", 150,
            "parcel_requests", 200, "conversations", 200, "messages", 800, "trip_alerts", 100);

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired TripRepository trips;

    @BeforeEach
    void cleanDatabase() throws Exception {
        jdbc.execute("TRUNCATE users CASCADE");
        new PostgresStatusConstraintSynchronizer(dataSource, jdbc).run(null);
    }

    @Test
    void loadsVolumesAndBusinessScenarios() throws Exception {
        loadFixture();
        for (var count : COUNTS.entrySet()) {
            assertThat(number("SELECT count(*) FROM " + count.getKey())).isEqualTo(count.getValue());
        }
        assertThat(jdbc.queryForList("SELECT DISTINCT status FROM trip_bookings", String.class))
                .containsExactlyInAnyOrder("PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "REMOVED", "DELIVERED");
        assertThat(number("SELECT count(*) FROM trips WHERE status='ACTIVE' AND departure_time>localtimestamp")).isEqualTo(350);
        assertThat(number("SELECT count(*) FROM trips WHERE arrival_time<=departure_time OR max_weight<=0 OR price_per_kilo<=0 OR created_at>departure_time")).isZero();
        assertThat(number("SELECT count(*) FROM trips WHERE status<>'ACTIVE' AND arrival_time>localtimestamp")).isZero();
        assertThat(number("SELECT count(*) FROM trip_bookings b JOIN trips t ON t.id=b.trip_id WHERE b.sender_id=t.user_id OR b.created_at<t.created_at OR b.created_at>t.departure_time OR b.commercial_mode<>'FREE' OR b.platform_fee_rate<>0 OR b.parcel_policy_version<>'2026-09-01' OR b.parcel_policy_accepted_at IS NULL")).isZero();
        assertThat(number("SELECT count(*) FROM trips t WHERE (SELECT coalesce(sum(b.weight),0) FROM trip_bookings b WHERE b.trip_id=t.id AND b.status IN ('ACCEPTED','DELIVERED'))>t.max_weight")).isZero();
        assertThat(number("SELECT count(*) FROM trip_bookings b JOIN trips t ON t.id=b.trip_id WHERE b.status='PENDING' AND (t.instant_acceptance OR t.status<>'ACTIVE')")).isZero();
        assertThat(number("SELECT count(*) FROM trip_bookings WHERE status='DELIVERED' AND delivered_at IS NULL")).isZero();
        assertThat(number("SELECT count(*) FROM traveler_reviews r JOIN trip_bookings b ON b.id=r.booking_id JOIN trips t ON t.id=b.trip_id WHERE b.status<>'ACCEPTED' OR t.status<>'COMPLETED' OR r.invited_at<t.arrival_time OR r.submitted_at<r.invited_at OR ((r.rating IS NULL)<>(r.submitted_at IS NULL)) OR r.rating NOT BETWEEN 1 AND 5")).isZero();
        assertThat(number("SELECT count(*) FROM traveler_reviews WHERE submitted_at IS NOT NULL")).isEqualTo(100);
        assertThat(number("SELECT count(*) FROM conversations WHERE participant1_id=participant2_id OR ((trip_id IS NULL)=(parcel_request_id IS NULL))")).isZero();
        assertThat(number("SELECT count(*) FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE m.sender_id NOT IN (c.participant1_id,c.participant2_id) OR m.sent_at<c.created_at")).isZero();
        assertThat(number("SELECT count(*) FROM conversations c LEFT JOIN trips t ON t.id=c.trip_id LEFT JOIN parcel_requests p ON p.id=c.parcel_request_id WHERE c.participant1_id<>coalesce(t.user_id,p.sender_id)")).isZero();
        for (String table : new String[]{"trip_alerts", "parcel_requests"}) {
            assertThat(number("SELECT count(*) FROM " + table + " WHERE normalized_departure<>lower(departure) OR normalized_destination<>lower(destination)")).isZero();
        }
        assertThat(number("SELECT count(*) FROM messages WHERE NOT read")).isPositive();
        assertThat(number("SELECT count(*) FROM users WHERE role='ADMIN' AND enabled AND email_verified_at IS NOT NULL")).isEqualTo(2);
        assertThat(number("SELECT count(*) FROM users WHERE NOT enabled")).isEqualTo(10);
        assertThat(number("SELECT count(*) FROM users WHERE email_verified_at IS NULL")).isEqualTo(20);
        var encoder = new BCryptPasswordEncoder();
        assertThat(encoder.matches("ColiclicDemo2026!", jdbc.queryForObject(
                "SELECT password FROM users WHERE email='aicha.kone@example.test'", String.class))).isTrue();
        assertThat(number("SELECT count(DISTINCT password) FROM users")).isEqualTo(1);
    }

    @Test
    void usesRealisticProfilesParcelsAndConversations() throws Exception {
        loadFixture();
        assertThat(jdbc.queryForMap("SELECT first_name, last_name, email FROM users WHERE email='aicha.kone@example.test'"))
                .containsEntry("first_name", "Aïcha").containsEntry("last_name", "Koné")
                .containsEntry("email", "aicha.kone@example.test");
        assertThat(number("SELECT count(DISTINCT first_name || ' ' || last_name) FROM users")).isEqualTo(100);
        assertThat(number("SELECT count(DISTINCT title) FROM trip_bookings")).isEqualTo(20);
        assertThat(number("SELECT count(DISTINCT description) FROM trip_bookings")).isEqualTo(20);
        assertThat(number("SELECT count(*) FROM trip_bookings WHERE title LIKE 'FIXTURE%' OR recipient_contact LIKE 'fixture.%' OR description LIKE '%démonstration%'")).isZero();
        assertThat(number("SELECT count(*) FROM parcel_requests WHERE package_title LIKE 'FIXTURE%' OR description LIKE '%démonstration%'")).isZero();
        assertThat(number("SELECT count(*) FROM messages WHERE content LIKE 'FIXTURE%'")).isZero();
        assertThat(number("SELECT count(DISTINCT content) FROM messages")).isGreaterThan(100);
        assertThat(number("SELECT count(*) FROM traveler_reviews WHERE rating=1 AND comment NOT LIKE '%retard%'")).isZero();
    }

    @Test
    void replacesEveryFixtureRowWithNewPositiveIds() throws Exception {
        loadFixture();
        Map<String, Long> oldMaxIds = new LinkedHashMap<>();
        for (String table : COUNTS.keySet()) {
            oldMaxIds.put(table, jdbc.queryForObject("SELECT max(id) FROM " + table, Long.class));
        }
        loadFixture();
        for (String table : COUNTS.keySet()) {
            assertThat(number("SELECT count(*) FROM " + table)).isEqualTo(COUNTS.get(table));
            assertThat(jdbc.queryForObject("SELECT min(id) FROM " + table, Long.class)).isGreaterThan(oldMaxIds.get(table));
        }
    }

    @Test
    void recreatesEditedAccountsAndActivityInsteadOfKeepingOldValues() throws Exception {
        loadFixture();
        jdbc.update("UPDATE users SET first_name='Modifié', password='changed' WHERE email='fatou.diallo@example.test'");
        jdbc.update("UPDATE trip_bookings SET status='CANCELLED'");
        jdbc.update("UPDATE messages SET content='Ancien message modifié'");
        loadFixture();
        assertThat(jdbc.queryForObject("SELECT first_name FROM users WHERE email='fatou.diallo@example.test'", String.class)).isEqualTo("Fatou");
        assertThat(number("SELECT count(*) FROM users WHERE password='changed'")).isZero();
        assertThat(number("SELECT count(*) FROM messages WHERE content='Ancien message modifié'")).isZero();
        assertThat(number("SELECT count(DISTINCT status) FROM trip_bookings")).isEqualTo(6);
        assertThat(number("SELECT count(*) FROM trip_bookings")).isEqualTo(1000);
    }

    @Test
    void preservesUnrelatedDataAndAllowsNormalJpaCreation() throws Exception {
        User existing = users.saveAndFlush(user("existing@example.test"));
        var existingRow = jdbc.queryForMap("SELECT * FROM users WHERE id=?", existing.getId());
        loadFixture();
        assertThat(jdbc.queryForMap("SELECT * FROM users WHERE id=?", existing.getId())).isEqualTo(existingRow);
        long maxUserId = jdbc.queryForObject("SELECT max(id) FROM users", Long.class);
        User next = users.saveAndFlush(user("next@example.test"));
        assertThat(next.getId()).isGreaterThan(maxUserId);
        Trip trip = Trip.builder().traveler(next).departureAddress("Paris, France")
                .destination("Abidjan, Côte d'Ivoire").departureTime(LocalDateTime.now().plusDays(5))
                .arrivalTime(LocalDateTime.now().plusDays(6)).maxWeight(BigDecimal.TEN)
                .pricePerKilo(BigDecimal.ONE).build();
        trip.setReference(new TripReferenceGenerator(jdbc).generateForNewTrip(trip));
        Trip saved = trips.saveAndFlush(trip);
        assertThat(saved.getId()).isPositive();
        assertThat(saved.getReference()).matches("TRP-\\d{4}-\\d{6,}");
        loadFixture();
        assertThat(trips.findById(saved.getId())).isPresent();
        assertThat(number("SELECT count(*) FROM users")).isEqualTo(102);
    }

    @Test
    void removesExtraActivityAndResetTokensOnDemoAccounts() throws Exception {
        loadFixture();
        jdbc.execute("INSERT INTO messages (conversation_id,sender_id,content,sent_at,read) SELECT conversation_id,sender_id,'Activité ajoutée',sent_at,read FROM messages ORDER BY id LIMIT 1");
        jdbc.execute("INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) SELECT id,repeat('a',64),localtimestamp+interval '1 hour' FROM users WHERE email='aicha.kone@example.test'");
        jdbc.execute("INSERT INTO trip_alert_notifications (alert_id,trip_id,sent_at) SELECT (SELECT min(id) FROM trip_alerts),(SELECT min(id) FROM trips),localtimestamp");
        loadFixture();
        assertThat(number("SELECT count(*) FROM messages")).isEqualTo(800);
        assertThat(number("SELECT count(*) FROM password_reset_tokens")).isZero();
        assertThat(number("SELECT count(*) FROM trip_alert_notifications")).isZero();
    }

    @Test
    void replacesAnExistingAccountUsingAReservedDemoEmail() throws Exception {
        User existing = users.saveAndFlush(user("aicha.kone@example.test"));
        loadFixture();
        assertThat(users.findById(existing.getId())).isEmpty();
        var replacement = jdbc.queryForMap("SELECT first_name,role FROM users WHERE email='aicha.kone@example.test'");
        assertThat(replacement).containsEntry("first_name", "Aïcha").containsEntry("role", "ADMIN");
        assertThat(number("SELECT count(*) FROM users")).isEqualTo(100);
    }

    @Test
    void replacesLegacyNegativeIdsAndAllDependentRows() throws Exception {
        jdbc.execute("""
            INSERT INTO users (id,first_name,last_name,email,password,role) VALUES
                (-910000001,'Ancien','Admin','fixture.user001@example.test','hash','ADMIN'),
                (-910000003,'Ancien','Expéditeur','fatou.diallo@example.test','hash','USER');
            INSERT INTO trips (id,reference,user_id,departure_address,destination,departure_time,arrival_time,
                max_weight,price_per_kilo,instant_acceptance,status,created_at) VALUES
                (-910000001,'FIXTURE-0001',-910000001,'Paris','Abidjan',localtimestamp,localtimestamp+interval '8 hours',10,5,false,'COMPLETED',localtimestamp);
            INSERT INTO trip_bookings (id,trip_id,sender_id,title,weight,recipient_contact,status,created_at) VALUES
                (-910000001,-910000001,-910000003,'Ancien colis',1,'old@example.test','ACCEPTED',localtimestamp);
            INSERT INTO traveler_reviews (id,booking_id,token_hash,invited_at) VALUES
                (-910000001,-910000001,repeat('b',64),localtimestamp);
            INSERT INTO parcel_requests (id,sender_id,departure,normalized_departure,destination,normalized_destination,
                package_title,weight,status,created_at) VALUES
                (-910000001,-910000003,'Paris','paris','Abidjan','abidjan','Ancienne demande',1,'ACTIVE',localtimestamp);
            INSERT INTO conversations (id,trip_id,participant1_id,participant2_id,created_at) VALUES
                (-910000001,-910000001,-910000001,-910000003,localtimestamp);
            INSERT INTO messages (id,conversation_id,sender_id,content,sent_at,read) VALUES
                (-910000001,-910000001,-910000003,'Ancien message',localtimestamp,false);
            INSERT INTO trip_alerts (id,user_id,departure,normalized_departure,destination,normalized_destination,created_at) VALUES
                (-910000001,-910000003,'Paris','paris','Abidjan','abidjan',localtimestamp);
            INSERT INTO trip_alert_notifications (alert_id,trip_id,sent_at) VALUES
                ((SELECT id FROM trip_alerts LIMIT 1),-910000001,localtimestamp);
            INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES
                (-910000001,repeat('c',64),localtimestamp+interval '1 hour');
            """);
        loadFixture();
        for (String table : COUNTS.keySet()) {
            assertThat(number("SELECT count(*) FROM " + table)).isEqualTo(COUNTS.get(table));
            assertThat(number("SELECT count(*) FROM " + table + " WHERE id<=0")).isZero();
        }
        assertThat(number("SELECT count(*) FROM users WHERE email LIKE 'fixture.user%'")).isZero();
        assertThat(number("SELECT count(*) FROM password_reset_tokens")).isZero();
        assertThat(number("SELECT count(*) FROM trip_alert_notifications")).isZero();
    }

    @Test
    void preservesIndependentActivityAndOtherNegativeIds() throws Exception {
        jdbc.execute("""
            INSERT INTO users (id,first_name,last_name,email,password,role) VALUES
                (-1,'Compte','Indépendant','independent@example.test','hash','USER');
            INSERT INTO trips (id,reference,user_id,departure_address,destination,departure_time,arrival_time,
                max_weight,price_per_kilo,instant_acceptance,status,created_at) VALUES
                (-1,'TRP-2026-999999',-1,'Lyon','Dakar',localtimestamp,localtimestamp+interval '8 hours',10,5,false,'ACTIVE',localtimestamp);
            INSERT INTO trip_alerts (id,user_id,departure,normalized_departure,destination,normalized_destination) VALUES
                (-1,-1,'Lyon','lyon','Dakar','dakar');
            INSERT INTO trip_alert_notifications (alert_id,trip_id,sent_at) VALUES (-1,-1,localtimestamp);
            INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES
                (-1,repeat('d',64),localtimestamp+interval '1 hour');
            """);
        var account = jdbc.queryForMap("SELECT * FROM users WHERE id=-1");
        var trip = jdbc.queryForMap("SELECT * FROM trips WHERE id=-1");
        var notification = jdbc.queryForList("SELECT * FROM trip_alert_notifications");
        var token = jdbc.queryForList("SELECT * FROM password_reset_tokens");
        loadFixture();
        loadFixture();
        assertThat(jdbc.queryForMap("SELECT * FROM users WHERE id=-1")).isEqualTo(account);
        assertThat(jdbc.queryForMap("SELECT * FROM trips WHERE id=-1")).isEqualTo(trip);
        assertThat(jdbc.queryForList("SELECT * FROM trip_alert_notifications")).isEqualTo(notification);
        assertThat(jdbc.queryForList("SELECT * FROM password_reset_tokens")).isEqualTo(token);
    }

    @Test
    void restoresDeletedFixtureWhenRecreationFails() throws Exception {
        loadFixture();
        users.saveAndFlush(user("unrelated@example.test"));
        var before = snapshot();
        long maxMessage = jdbc.queryForObject("SELECT max(id) FROM messages", Long.class);
        jdbc.execute("ALTER TABLE messages ADD CONSTRAINT test_reject_fixture CHECK (id<=" + maxMessage + ") NOT VALID");
        try {
            assertThatThrownBy(this::loadFixture).isInstanceOf(SQLException.class)
                    .hasMessageContaining("test_reject_fixture");
            assertThat(snapshot()).isEqualTo(before);
        } finally {
            jdbc.execute("ALTER TABLE messages DROP CONSTRAINT test_reject_fixture");
        }
    }

    private void loadFixture() throws Exception {
        String sql = Files.readString(Path.of("fixtures/demo.sql"));
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            connection.setAutoCommit(true);
            try {
                statement.execute(sql);
            } catch (SQLException failure) {
                statement.execute("ROLLBACK");
                throw failure;
            }
        }
    }

    private int number(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }

    private Map<String, Object> snapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        COUNTS.keySet().forEach(table -> result.put(table, jdbc.queryForObject(
                "SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb)::text FROM " + table + " t", String.class)));
        return result;
    }

    private User user(String email) {
        return User.builder().firstName("Existing").lastName("Account").email(email).password("hash").build();
    }
}
