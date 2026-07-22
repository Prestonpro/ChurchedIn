import { customAlphabet } from "nanoid";

// Excludes visually ambiguous characters (0/O, 1/I/L) so codes are easy to
// read aloud or write on a whiteboard during a church announcement.
const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(): string {
  return customAlphabet(JOIN_CODE_ALPHABET, 6)();
}

const URL_SAFE_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateToken(): string {
  return customAlphabet(URL_SAFE_ALPHABET, 32)();
}
