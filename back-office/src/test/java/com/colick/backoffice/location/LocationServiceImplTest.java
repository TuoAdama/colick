package com.colick.backoffice.location;

import com.colick.backoffice.location.dto.LocationResponse;
import com.colick.backoffice.location.entity.Continent;
import com.colick.backoffice.location.entity.Location;
import com.colick.backoffice.location.entity.LocationType;
import com.colick.backoffice.location.repository.LocationRepository;
import com.colick.backoffice.location.service.LocationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationServiceImplTest {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private LocationServiceImpl locationService;

    @Test
    void search_shouldReturnMatchingLocations() {
        Location paris = Location.builder()
                .id(1L).name("Paris").country("France").isoCode("FR").continent(Continent.EUROPE).type(LocationType.CITY).build();
        Location pays = Location.builder()
                .id(2L).name("Pays-Bas").country("Pays-Bas").isoCode("NL").continent(Continent.EUROPE).type(LocationType.COUNTRY).build();

        when(locationRepository.findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("Pa"))
                .thenReturn(List.of(paris, pays));

        List<LocationResponse> results = locationService.search("Pa");

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getName()).isEqualTo("Paris");
        assertThat(results.get(0).getCountry()).isEqualTo("France");
        assertThat(results.get(0).getIsoCode()).isEqualTo("FR");
        assertThat(results.get(0).getContinent()).isEqualTo(Continent.EUROPE);
        assertThat(results.get(0).getType()).isEqualTo(LocationType.CITY);
        assertThat(results.get(1).getName()).isEqualTo("Pays-Bas");
        verify(locationRepository).findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("Pa");
    }

    @Test
    void search_shouldReturnEmptyList_whenQueryIsBlank() {
        List<LocationResponse> results = locationService.search("  ");

        assertThat(results).isEmpty();
        verifyNoInteractions(locationRepository);
    }

    @Test
    void search_shouldReturnEmptyList_whenQueryIsNull() {
        List<LocationResponse> results = locationService.search(null);

        assertThat(results).isEmpty();
        verifyNoInteractions(locationRepository);
    }

    @Test
    void search_shouldReturnEmptyList_whenNoMatch() {
        when(locationRepository.findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("Xyz"))
                .thenReturn(List.of());

        List<LocationResponse> results = locationService.search("Xyz");

        assertThat(results).isEmpty();
    }

    @Test
    void search_shouldLimitTo10Results() {
        // The repository method already limits to 10 via findTop10,
        // so verify the service delegates correctly.
        when(locationRepository.findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("A"))
                .thenReturn(List.of(
                        Location.builder().id(1L).name("Abidjan").country("Côte d'Ivoire").isoCode("CI").continent(Continent.AFRICA).type(LocationType.CITY).build(),
                        Location.builder().id(2L).name("Alger").country("Algérie").isoCode("DZ").continent(Continent.AFRICA).type(LocationType.CITY).build(),
                        Location.builder().id(3L).name("Allemagne").country("Allemagne").isoCode("DE").continent(Continent.EUROPE).type(LocationType.COUNTRY).build()
                ));

        List<LocationResponse> results = locationService.search("A");

        assertThat(results).hasSize(3);
        verify(locationRepository).findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("A");
    }

    @Test
    void search_shouldMapAllFieldsCorrectly() {
        Location abidjan = Location.builder()
                .id(5L).name("Abidjan").country("Côte d'Ivoire").isoCode("CI").continent(Continent.AFRICA).type(LocationType.CITY).build();

        when(locationRepository.findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc("Ab"))
                .thenReturn(List.of(abidjan));

        List<LocationResponse> results = locationService.search("Ab");

        assertThat(results).hasSize(1);
        LocationResponse dto = results.get(0);
        assertThat(dto.getId()).isEqualTo(5L);
        assertThat(dto.getName()).isEqualTo("Abidjan");
        assertThat(dto.getCountry()).isEqualTo("Côte d'Ivoire");
        assertThat(dto.getIsoCode()).isEqualTo("CI");
        assertThat(dto.getContinent()).isEqualTo(Continent.AFRICA);
        assertThat(dto.getType()).isEqualTo(LocationType.CITY);
    }
}
