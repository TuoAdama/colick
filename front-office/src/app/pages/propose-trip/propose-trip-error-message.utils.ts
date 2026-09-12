import { parseApiErrorMessage } from '../../shared/utils/api-error.utils';

type SupportedLanguage = 'fr' | 'en';

interface ProposeTripTimeValidationInput {
  departureTime: string;
  arrivalTime: string;
  language?: string;
}

const PROPOSE_TRIP_MESSAGES = {
  fr: {
    departureInFuture: 'Veuillez choisir une date et une heure de départ dans le futur.',
    arrivalInFuture: 'Veuillez choisir une date et une heure d’arrivée estimée dans le futur.',
    arrivalAfterDeparture: 'Veuillez choisir une date d’arrivée estimée après la date de départ.',
    genericFutureDate: 'Veuillez choisir une date et une heure valides dans le futur.',
  },
  en: {
    departureInFuture: 'Please choose a departure date and time in the future.',
    arrivalInFuture: 'Please choose an estimated arrival date and time in the future.',
    arrivalAfterDeparture: 'Please choose an estimated arrival date and time after the departure.',
    genericFutureDate: 'Please choose a valid future date and time.',
  },
} as const;

function resolveLanguage(language?: string): SupportedLanguage {
  return language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function parseDateTime(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFutureDateValidationMessage(message: string): boolean {
  return /date dans le futur|in the future/i.test(message);
}

function isArrivalAfterDepartureValidationMessage(message: string): boolean {
  return /after the departure|after departure|après la date de départ|après le départ/i.test(message);
}

/**
 * Validates trip dates on the client before sending the form to the API.
 */
export function validateProposeTripTimes(
  input: ProposeTripTimeValidationInput,
  now: Date = new Date(),
): string | null {
  const language = resolveLanguage(input.language);
  const messages = PROPOSE_TRIP_MESSAGES[language];
  const departureDate = parseDateTime(input.departureTime);
  const arrivalDate = parseDateTime(input.arrivalTime);

  if (departureDate && departureDate.getTime() <= now.getTime()) {
    return messages.departureInFuture;
  }

  if (arrivalDate && arrivalDate.getTime() <= now.getTime()) {
    return messages.arrivalInFuture;
  }

  if (departureDate && arrivalDate && arrivalDate.getTime() <= departureDate.getTime()) {
    return messages.arrivalAfterDeparture;
  }

  return null;
}

/**
 * Rewrites raw backend validation messages into user-facing trip form messages.
 */
export function getProposeTripApiErrorMessage(
  err: unknown,
  fallback: string,
  language?: string,
): string {
  const { fieldName, cleanedMessage } = parseApiErrorMessage(err);

  if (!cleanedMessage) {
    return fallback;
  }

  const messages = PROPOSE_TRIP_MESSAGES[resolveLanguage(language)];

  if (isFutureDateValidationMessage(cleanedMessage)) {
    if (fieldName === 'departureTime') {
      return messages.departureInFuture;
    }

    if (fieldName === 'arrivalTime') {
      return messages.arrivalInFuture;
    }

    return messages.genericFutureDate;
  }

  if (fieldName === 'arrivalTime' && isArrivalAfterDepartureValidationMessage(cleanedMessage)) {
    return messages.arrivalAfterDeparture;
  }

  return cleanedMessage;
}
