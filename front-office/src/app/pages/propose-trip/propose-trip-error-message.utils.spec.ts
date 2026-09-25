import {
  getProposeTripApiErrorMessage,
  validateProposeTripTimes,
} from './propose-trip-error-message.utils';

describe('propose trip error message utils', () => {
  describe('validateProposeTripTimes', () => {
    const referenceNow = new Date('2099-05-01T10:00:00');

    it('returns a French departure message when the departure date is in the past', () => {
      expect(
        validateProposeTripTimes(
          {
            departureTime: '2099-05-01T09:00',
            arrivalTime: '2099-05-01T12:00',
            language: 'fr',
          },
          referenceNow,
        ),
      ).toBe('Veuillez choisir une date et une heure de départ dans le futur.');
    });

    it('returns an English arrival ordering message when the arrival is before the departure', () => {
      expect(
        validateProposeTripTimes(
          {
            departureTime: '2099-05-01T12:00',
            arrivalTime: '2099-05-01T11:00',
            language: 'en',
          },
          referenceNow,
        ),
      ).toBe('Please choose an estimated arrival date and time after the departure.');
    });

    it('returns null when both dates are valid', () => {
      expect(
        validateProposeTripTimes(
          {
            departureTime: '2099-05-01T11:00',
            arrivalTime: '2099-05-01T12:00',
            language: 'fr',
          },
          referenceNow,
        ),
      ).toBeNull();
    });
  });

  describe('getProposeTripApiErrorMessage', () => {
    const fallback = 'Une erreur est survenue.';

    it('maps a French backend future-date validation to a contextual departure message', () => {
      expect(
        getProposeTripApiErrorMessage(
          { error: { message: 'departureTime: doit être une date dans le futur' } },
          fallback,
          'fr',
        ),
      ).toBe('Veuillez choisir une date et une heure de départ dans le futur.');
    });

    it('maps an English backend future-date validation to a contextual arrival message', () => {
      expect(
        getProposeTripApiErrorMessage(
          { error: { message: 'arrivalTime: must be a date in the future' } },
          fallback,
          'en',
        ),
      ).toBe('Please choose an estimated arrival date and time in the future.');
    });

    it('returns the cleaned backend message when no contextual mapping exists', () => {
      expect(
        getProposeTripApiErrorMessage(
          { error: { message: 'pricePerKilo: Price must be positive' } },
          fallback,
          'en',
        ),
      ).toBe('Price must be positive');
    });
  });
});
