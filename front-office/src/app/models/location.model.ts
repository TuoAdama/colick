/**
 * Location model representing a geographical location returned by the API.
 */
export type LocationType = 'COUNTRY' | 'CITY';

export interface Location {
  id: number;
  name: string;
  country: string;
  isoCode: string;
  continent: string;
  type: LocationType;
}
