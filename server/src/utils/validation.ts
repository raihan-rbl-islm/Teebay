/**
 * Validation Utilities
 * ----------------------------------------------------------------------------
 * Reusable validation functions for input validation.
 */

import { ValidationError } from './errors';

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if valid, throws ValidationError otherwise
 * @throws ValidationError if email format is invalid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  return true;
}

/**
 * Validates password strength
 * @param password - Password string to validate
 * @param minLength - Minimum password length (default: 6)
 * @returns True if valid, throws ValidationError otherwise
 * @throws ValidationError if password doesn't meet requirements
 */
export function validatePassword(password: string, minLength: number = 6): boolean {
  if (!password || password.length < minLength) {
    throw new ValidationError(`Password must be at least ${minLength} characters long`);
  }
  
  return true;
}

/**
 * Validates that at least one of price or rentPrice is provided
 * @param price - Purchase price (optional)
 * @param rentPrice - Rental price (optional)
 * @returns True if valid, throws ValidationError otherwise
 * @throws ValidationError if neither price is provided
 */
export function validateProductPricing(
  price?: number | null,
  rentPrice?: number | null
): boolean {
  if (!price && !rentPrice) {
    throw new ValidationError('Product must have either a purchase price or rental price');
  }
  
  return true;
}

/**
 * Validates that rentType is provided when rentPrice is set
 * @param rentPrice - Rental price (optional)
 * @param rentType - Rental type (optional)
 * @returns True if valid, throws ValidationError otherwise
 * @throws ValidationError if rentPrice is set but rentType is missing
 */
export function validateRentalInfo(
  rentPrice?: number | null,
  rentType?: string | null
): boolean {
  if (rentPrice && !rentType) {
    throw new ValidationError('Rental type is required when rental price is set');
  }
  
  return true;
}

/**
 * Validates date range for rentals
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns True if valid, throws ValidationError otherwise
 * @throws ValidationError if dates are invalid or end date is before start date
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (start < now) {
    throw new ValidationError('Start date cannot be in the past');
  }
  
  if (end <= start) {
    throw new ValidationError('End date must be after start date');
  }
  
  return true;
}
