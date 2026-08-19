package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostgresStatusConstraintSynchronizerTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private Connection connection;

    @Mock
    private DatabaseMetaData databaseMetaData;

    @Test
    void run_shouldRefreshStatusConstraints_onPostgreSql() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(databaseMetaData);
        when(databaseMetaData.getDatabaseProductName()).thenReturn("PostgreSQL");

        PostgresStatusConstraintSynchronizer synchronizer =
                new PostgresStatusConstraintSynchronizer(dataSource, jdbcTemplate);

        synchronizer.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate).execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check");
        verify(jdbcTemplate).execute(
                "ALTER TABLE trips ADD CONSTRAINT trips_status_check " +
                        "CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED'))"
        );
        verify(jdbcTemplate).execute("ALTER TABLE trip_bookings DROP CONSTRAINT IF EXISTS trip_bookings_status_check");
        verify(jdbcTemplate).execute(
                "ALTER TABLE trip_bookings ADD CONSTRAINT trip_bookings_status_check " +
                        "CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'REMOVED', 'DELIVERED'))"
        );
        verify(jdbcTemplate).execute("ALTER TABLE conversations ALTER COLUMN trip_id DROP NOT NULL");
        verify(jdbcTemplate).execute("ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_exactly_one_context_check");
        verify(jdbcTemplate).execute(
                "ALTER TABLE conversations ADD CONSTRAINT conversations_exactly_one_context_check " +
                        "CHECK ((trip_id IS NOT NULL AND parcel_request_id IS NULL) " +
                        "OR (trip_id IS NULL AND parcel_request_id IS NOT NULL))"
        );
        verify(connection).close();
    }

    @Test
    void run_shouldSkipSynchronization_onNonPostgreSql() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(databaseMetaData);
        when(databaseMetaData.getDatabaseProductName()).thenReturn("H2");

        PostgresStatusConstraintSynchronizer synchronizer =
                new PostgresStatusConstraintSynchronizer(dataSource, jdbcTemplate);

        synchronizer.run(new DefaultApplicationArguments(new String[0]));

        verifyNoInteractions(jdbcTemplate);
        verify(connection).close();
    }
}
