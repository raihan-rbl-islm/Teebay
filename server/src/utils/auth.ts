/**
 * Authentication Utilities
 * ----------------------------------------------------------------------------
 * Centralized authentication helper functions for JWT token management.
 */

import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { config } from '../config';
import { JWTPayload } from '../types';

/**
 * Extracts and validates JWT token from request headers
 * @param req - Express request object
 * @returns User ID if token is valid, null otherwise
 */
export function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  try {
    // Extract token from "Bearer <token>" format
    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      return null;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    
    return decoded.userId;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Generates a JWT token for a user
 * @param userId - User ID to encode in token
 * @returns JWT token string
 */
export function generateToken(userId: number): string {
  const payload: JWTPayload = { userId };
  
  return jwt.sign(
    payload,
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions
  );
}

/**
 * Verifies a JWT token and returns the payload
 * @param token - JWT token string
 * @returns Decoded payload if valid, null otherwise
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
}
