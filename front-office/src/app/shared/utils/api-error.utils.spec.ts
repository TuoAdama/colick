import { extractApiErrorMessage, parseApiErrorMessage } from './api-error.utils';

describe('extractApiErrorMessage', () => {
  const FALLBACK = 'Une erreur inattendue est survenue.';

  // --- Happy path: backend supplies a usable message ---

  it('returns the backend message when err.error.message is a plain string', () => {
    const err = { error: { message: 'Trip not found.' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Trip not found.');
  });

  it('strips a camelCase field prefix produced by bean-validation', () => {
    const err = { error: { message: 'departureTime: Departure time must be in the future' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Departure time must be in the future');
  });

  it('strips a single-word field prefix', () => {
    const err = { error: { message: 'price: Price must be positive' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Price must be positive');
  });

  it('strips a field prefix with extra spaces after the colon', () => {
    const err = { error: { message: 'arrivalTime:  Arrival time must be after departure' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('Arrival time must be after departure');
  });

  it('does not strip a colon that appears in the middle of the message', () => {
    const err = { error: { message: 'Error: something went wrong at step 2' } };
    // "Error" matches the prefix pattern → only the leading "Error: " is stripped
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('something went wrong at step 2');
  });

  it('does not strip when the message contains a URL with a colon (no leading field)', () => {
    // Message starts with a space — regex does not match at position 0
    const err = { error: { message: ' https://example.com is invalid' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe('https://example.com is invalid');
  });

  // --- Fallback cases ---

  it('returns fallback when err is null', () => {
    expect(extractApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err is undefined', () => {
    expect(extractApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error is missing', () => {
    const err = { status: 500 };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error.message is missing', () => {
    const err = { error: { status: 400 } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error.message is an empty string', () => {
    const err = { error: { message: '' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error.message is only whitespace', () => {
    const err = { error: { message: '   ' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error.message is not a string', () => {
    const err = { error: { message: 42 } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when err.error.message is an array', () => {
    // Spring sometimes wraps validation errors as arrays
    const err = { error: { message: ['field: error'] } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });

  it('returns fallback when stripping the prefix leaves nothing', () => {
    // Edge case: "field: " with nothing after — cleaned becomes ''
    const err = { error: { message: 'field:' } };
    expect(extractApiErrorMessage(err, FALLBACK)).toBe(FALLBACK);
  });
});

describe('parseApiErrorMessage', () => {
  it('returns the backend field name when the message starts with a validation prefix', () => {
    const err = { error: { message: 'departureTime: doit être une date dans le futur' } };

    expect(parseApiErrorMessage(err)).toEqual({
      rawMessage: 'departureTime: doit être une date dans le futur',
      fieldName: 'departureTime',
      cleanedMessage: 'doit être une date dans le futur',
    });
  });

  it('keeps the full message when no field prefix is present', () => {
    const err = { error: { message: 'Trip not found.' } };

    expect(parseApiErrorMessage(err)).toEqual({
      rawMessage: 'Trip not found.',
      fieldName: null,
      cleanedMessage: 'Trip not found.',
    });
  });

  it('does not treat a message with a leading space as a field-prefixed validation error', () => {
    const err = { error: { message: ' https://example.com is invalid' } };

    expect(parseApiErrorMessage(err)).toEqual({
      rawMessage: 'https://example.com is invalid',
      fieldName: null,
      cleanedMessage: 'https://example.com is invalid',
    });
  });
});
