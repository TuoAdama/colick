/**
 * Extracts a useful, human-readable error message from an HTTP error response.
 *
 * The backend may return a payload such as:
 *   { "status": 400, "message": "departureTime: Departure time must be in the future" }
 *
 * This utility:
 *  1. Reads `err.error.message` from the raw error object.
 *  2. Strips a leading technical field prefix of the form "fieldName: " so the
 *     user sees "Departure time must be in the future" instead of the raw field identifier.
 *  3. Falls back to the provided `fallback` string when no usable message is found
 *     (network failures, unexpected payload shapes, etc.).
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  const raw: unknown = (err as Record<string, unknown> | null)?.['error'];
  const message = (raw as Record<string, unknown> | null)?.['message'];

  if (typeof message !== 'string' || !message.trim()) {
    return fallback;
  }

  // Strip a leading "camelCaseField: " prefix produced by backend bean-validation.
  // Regex matches an identifier (letters/digits, starting with a letter) followed
  // by a colon and optional whitespace, only at the very start of the string.
  const cleaned = message.replace(/^[a-zA-Z][a-zA-Z0-9]*:\s*/, '').trim();

  return cleaned || fallback;
}
