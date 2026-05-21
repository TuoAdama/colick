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
export interface ApiErrorMessageDetails {
  rawMessage: string | null;
  fieldName: string | null;
  cleanedMessage: string | null;
}

/**
 * Parses a backend error payload and exposes both the raw message and the optional field prefix.
 */
export function parseApiErrorMessage(err: unknown): ApiErrorMessageDetails {
  const raw: unknown = (err as Record<string, unknown> | null)?.['error'];
  const message = (raw as Record<string, unknown> | null)?.['message'];

  if (typeof message !== 'string') {
    return {
      rawMessage: null,
      fieldName: null,
      cleanedMessage: null,
    };
  }

  const rawMessage = message.trim();

  if (!rawMessage) {
    return {
      rawMessage: null,
      fieldName: null,
      cleanedMessage: null,
    };
  }

  const prefixMatch = message.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*:\s*(.*)$/);
  const fieldName = prefixMatch?.[1] ?? null;
  const cleanedMessage = prefixMatch ? prefixMatch[2].trim() : rawMessage;

  return {
    rawMessage,
    fieldName,
    cleanedMessage: cleanedMessage || null,
  };
}

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  const { cleanedMessage } = parseApiErrorMessage(err);
  return cleanedMessage || fallback;
}
