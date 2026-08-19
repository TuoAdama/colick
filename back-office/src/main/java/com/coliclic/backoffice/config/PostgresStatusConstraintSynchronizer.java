package com.coliclic.backoffice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
@RequiredArgsConstructor
public class PostgresStatusConstraintSynchronizer implements ApplicationRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String databaseProductName = connection.getMetaData().getDatabaseProductName();
            if (!"PostgreSQL".equalsIgnoreCase(databaseProductName)) {
                return;
            }
        }

        synchronizeTripStatusConstraint();
        synchronizeTripBookingStatusConstraint();
        synchronizeTripReferenceSchema();
        synchronizeConversationContextSchema();
    }

    private void synchronizeTripStatusConstraint() {
        jdbcTemplate.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check");
        jdbcTemplate.execute(
                "ALTER TABLE trips ADD CONSTRAINT trips_status_check " +
                        "CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED'))"
        );
    }

    private void synchronizeTripBookingStatusConstraint() {
        jdbcTemplate.execute("ALTER TABLE trip_bookings DROP CONSTRAINT IF EXISTS trip_bookings_status_check");
        jdbcTemplate.execute(
                "ALTER TABLE trip_bookings ADD CONSTRAINT trip_bookings_status_check " +
                        "CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'REMOVED', 'DELIVERED'))"
        );
    }

    private void synchronizeTripReferenceSchema() {
        jdbcTemplate.execute("ALTER TABLE trips ADD COLUMN IF NOT EXISTS reference VARCHAR(32)");
        jdbcTemplate.execute(
                "UPDATE trips " +
                        "SET reference = 'TRP-' || EXTRACT(YEAR FROM COALESCE(created_at, CURRENT_TIMESTAMP))::int || '-' || LPAD(id::text, 6, '0') " +
                        "WHERE reference IS NULL OR BTRIM(reference) = ''"
        );
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS trips_reference_unique_idx ON trips(reference)");
        jdbcTemplate.execute("ALTER TABLE trips ALTER COLUMN reference SET NOT NULL");
    }

    private void synchronizeConversationContextSchema() {
        jdbcTemplate.execute("ALTER TABLE conversations ALTER COLUMN trip_id DROP NOT NULL");
        jdbcTemplate.execute("ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_exactly_one_context_check");
        jdbcTemplate.execute(
                "ALTER TABLE conversations ADD CONSTRAINT conversations_exactly_one_context_check " +
                        "CHECK ((trip_id IS NOT NULL AND parcel_request_id IS NULL) " +
                        "OR (trip_id IS NULL AND parcel_request_id IS NOT NULL))"
        );
    }
}
