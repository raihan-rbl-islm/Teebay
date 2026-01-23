/**
 * Password Utilities
 * ----------------------------------------------------------------------------
 * Password hashing and verification utilities.
 * 
 * NOTE: Currently disabled - passwords are stored as plain text per project requirements.
 * In production, uncomment the bcrypt implementation below and use these functions
 * for secure password storage.
 */

// import bcrypt from 'bcrypt';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 */
// const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt
 * 
 * @param plainPassword - Plain text password to hash
 * @returns Hashed password string
 * 
 * @example
 * const hashed = await hashPassword('myPassword123');
 */
// export async function hashPassword(plainPassword: string): Promise<string> {
//   return bcrypt.hash(plainPassword, SALT_ROUNDS);
// }

/**
 * Verifies a plain text password against a hashed password
 * 
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('myPassword123', hashedPassword);
 */
// export async function verifyPassword(
//   plainPassword: string,
//   hashedPassword: string
// ): Promise<boolean> {
//   return bcrypt.compare(plainPassword, hashedPassword);
// }
