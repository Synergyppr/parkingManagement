/**
 * PlaceToPay Authentication Helper
 *
 * Handles authentication object generation for PlaceToPay API requests
 * Generates nonce, seed, and tranKey according to PlaceToPay specifications
 */

import crypto from 'crypto';
import { PlaceToPayAuth } from '@/app/types/payment';

/**
 * Generates complete PlaceToPay authentication object
 * Following PlaceToPay specification:
 * - Nonce: Random bytes encoded as Base64
 * - Seed: Current ISO 8601 timestamp
 * - TranKey: Base64(SHA256(rawNonceBytes + seed + secretKey))
 *
 * CRITICAL: tranKey must use raw nonce bytes, not the base64 string!
 *
 * @param login - PlaceToPay login ID
 * @param secretKey - PlaceToPay secret key
 * @returns Complete auth object ready for API requests
 */
export function generatePlaceToPayAuth(login: string, secretKey: string): PlaceToPayAuth {
  // Generate random nonce bytes
  const nonceBytes = crypto.randomBytes(16);

  // Base64 encode nonce for transmission
  const nonceBase64 = nonceBytes.toString('base64');

  // Generate ISO 8601 timestamp (seed)
  const seed = new Date().toISOString();

  // Calculate tranKey: Base64(SHA256(rawNonceBytes + seed + secretKey))
  // CRITICAL: Concatenate raw nonce bytes + seed string + secretKey string
  const tranKey = crypto
    .createHash('sha256')
    .update(Buffer.concat([
      nonceBytes,
      Buffer.from(seed, 'utf8'),
      Buffer.from(secretKey, 'utf8')
    ]))
    .digest('base64');

  return {
    login,
    tranKey,
    nonce: nonceBase64,
    seed,
  };
}

/**
 * Validates PlaceToPay credentials exist in environment
 * @throws Error if credentials are missing
 */
export function validatePlaceToPayCredentials(): {
  login: string;
  secretKey: string;
  middlewareUrl: string;
} {
  const login = process.env.PLACETOPAY_LOGIN;
  const secretKey = process.env.PLACETOPAY_SECRET_KEY;
  const middlewareUrl = process.env.PLACETOPAY_MIDDLEWARE_URL;

  if (!login || !secretKey || !middlewareUrl) {
    throw new Error(
      'PlaceToPay credentials not configured. Please check PLACETOPAY_LOGIN, PLACETOPAY_SECRET_KEY, and PLACETOPAY_MIDDLEWARE_URL in .env'
    );
  }

  return { login, secretKey, middlewareUrl };
}

/**
 * Gets the client's IP address from Next.js request headers
 * @param headers - Next.js request headers
 * @returns IP address or fallback
 */
export function getClientIpAddress(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

/**
 * Gets the user agent from Next.js request headers
 * @param headers - Next.js request headers
 * @returns User agent string or fallback
 */
export function getClientUserAgent(headers: Headers): string {
  return (
    headers.get('user-agent') ||
    'Mozilla/5.0 (compatible; ValetParking/1.0)'
  );
}
