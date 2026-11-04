package com.coliclic.backoffice.fixtures;

import com.coliclic.backoffice.config.PostgresStatusConstraintSynchronizer;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.TripReferenceGenerator;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
                "SELECT password FROM users WHERE email='fixture.user001@example.test'", String.class))).isTrue();
        assertThat(number("SELECT count(DISTINCT password) FROM users")).isEqualTo(1);
    }

    @Test
    void rerunPreservesAllRowsAndCompletesMissingLeafRows() throws Exception {
        loadFixture();
        jdbc.update("UPDATE users SET first_name='Modifié', password='changed' WHERE id=-910000003");
        jdbc.update("UPDATE trip_bookings SET status='CANCELLED' WHERE id=-910000999");
        var first = snapshot();
        loadFixture();
        assertThat(snapshot()).isEqualTo(first);
        jdbc.update("DELETE FROM messages WHERE id=-910000800");
        loadFixture();
        assertThat(snapshot()).isEqualTo(first);
    }

    @Test
    void preservesUnrelatedDataAndSequencesAndAllowsNormalJpaCreation() throws Exception {
        User existing = users.saveAndFlush(user("existing@example.test"));
        var existingRow = jdbc.queryForMap("SELECT * FROM users WHERE id=?", existing.getId());
        var sequences = sequenceSnapshot();
        loadFixture();
        assertThat(jdbc.queryForMap("SELECT * FROM users WHERE id=?", existing.getId())).isEqualTo(existingRow);
        assertThat(sequenceSnapshot()).isEqualTo(sequences);
        User next = users.saveAndFlush(user("next@example.test"));
        assertThat(next.getId()).isGreaterThan(existing.getId());
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

    @ParameterizedTest
    @CsvSource({"users,email", "trips,reference", "trip_bookings,title", "traveler_reviews,token_hash",
            "parcel_requests,package_title", "messages,content", "trip_alerts,departure"})
    void refusesReservedIdOwnedByDifferentData(String table, String key) throws Exception {
        loadFixture();
        jdbc.update("UPDATE " + table + " SET " + key + "='unrelated' WHERE id=-910000001");
        jdbc.update("DELETE FROM messages WHERE id=-910000800");
        var before = snapshot();
        assertThatThrownBy(this::loadFixture).isInstanceOf(SQLException.class).hasMessageContaining("Fixture ID collision");
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test
    void refusesConversationCollision() throws Exception {
        loadFixture();
        jdbc.update("UPDATE conversations SET participant2_id=-910000080 WHERE id=-910000001");
        var before = snapshot();
        assertThatThrownBy(this::loadFixture).hasMessageContaining("Fixture ID collision");
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test
    void refusesEmailCollisionBeforeLoadingAnyRows() {
        users.saveAndFlush(user("fixture.user001@example.test"));
        var before = snapshot();
        assertThatThrownBy(this::loadFixture).hasMessageContaining("Fixture unique key collision");
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test
    void rollsBackEarlierInsertsWhenALateInsertFails() {
        users.saveAndFlush(user("unrelated@example.test"));
        var before = snapshot();
        jdbc.execute("ALTER TABLE messages ADD CONSTRAINT test_reject_fixture CHECK (id>0)");
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

    private Object sequenceSnapshot() {
        return jdbc.queryForList("SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename");
    }

    private User user(String email) {
        return User.builder().firstName("Existing").lastName("Account").email(email).password("hash").build();
    }
}
