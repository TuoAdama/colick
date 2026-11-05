package com.coliclic.backoffice.trip.dto;

import java.util.List;

/** Public catalogue page, after availability filtering. */
public record TripCatalogResponse(List<TripResponse> items, long totalElements,
                                  int page, int size, boolean hasNext) {
}
