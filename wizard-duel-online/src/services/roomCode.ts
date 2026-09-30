/**
 * Client-side room-code helpers. Kept in sync with the server's
 * RoomRegistry.normaliseCode / isValidCode.
 */
export const RoomRegistry = {
  normaliseCode(input: string): string {
    return (input ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  },

  isValidCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(RoomRegistry.normaliseCode(code));
  },
};