import crypto from "crypto";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "@#$%&*!";

const ALL = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;

export const generateTemporaryPassword = (
  length = 10
): string => {
  let password = "";

  // Ensure at least one character from each group
  password += UPPERCASE[crypto.randomInt(UPPERCASE.length)];
  password += LOWERCASE[crypto.randomInt(LOWERCASE.length)];
  password += NUMBERS[crypto.randomInt(NUMBERS.length)];
  password += SYMBOLS[crypto.randomInt(SYMBOLS.length)];

  while (password.length < length) {
    password += ALL[crypto.randomInt(ALL.length)];
  }

  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
};