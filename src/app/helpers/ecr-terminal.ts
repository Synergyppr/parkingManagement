/**
 * Evertec ECR Terminal Helper Functions
 *
 * Handles ECR terminal configuration, request building, and reference management
 * Reference numbers must increment sequentially for each request within a session
 */

import { ECRBaseRequest } from '@/app/types/ecr';

/**
 * Validates ECR terminal credentials exist in environment
 * @throws Error if credentials are missing
 */
export function validateECRCredentials(): {
  terminalUrl: string;
  apiKey: string;
  terminalId: string;
  stationNumber: string;
  cashierId: string;
  timeout: number;
} {
  const terminalUrl = process.env.EVERTEC_ECR_TERMINAL_URL;
  const apiKey = process.env.EVERTEC_ECR_API_KEY;
  const terminalId = process.env.EVERTEC_ECR_TERMINAL_ID;
  const stationNumber = process.env.EVERTEC_ECR_STATION_NUMBER;
  const cashierId = process.env.EVERTEC_ECR_CASHIER_ID;
  const timeout = parseInt(process.env.EVERTEC_ECR_TIMEOUT || '30000', 10);

  if (!terminalUrl || !apiKey || !terminalId || !stationNumber || !cashierId) {
    throw new Error(
      'ECR Terminal credentials not configured. Please check EVERTEC_ECR_* variables in .env'
    );
  }

  return {
    terminalUrl,
    apiKey,
    terminalId,
    stationNumber,
    cashierId,
    timeout,
  };
}

/**
 * Builds base ECR request with required fields
 * @param reference - Current reference number (must increment)
 * @param lastReference - Previous reference number
 * @returns Base request object
 */
export function buildECRBaseRequest(
  reference: string,
  lastReference: string
): ECRBaseRequest {
  const { apiKey, terminalId, terminalUrl, stationNumber, cashierId } = validateECRCredentials();

  return {
    app_key: apiKey,
    terminal_url: terminalUrl,
    station_number: stationNumber,
    terminal_id: terminalId,
    cashier_id: cashierId,
    reference,
    last_reference: lastReference,
  };
}

/**
 * Format amount for ECR (decimal string with 2 places)
 * @param amount - Numeric amount
 * @returns Formatted string "25.50"
 */
export function formatECRAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Validates reference number sequence
 * @param reference - Current reference
 * @param lastReference - Previous reference
 * @returns True if valid sequence
 */
export function validateReferenceSequence(
  reference: string,
  lastReference: string
): boolean {
  const refNum = parseInt(reference, 10);
  const lastRefNum = parseInt(lastReference, 10);

  // First reference should be greater than last reference
  return refNum > lastRefNum;
}

/**
 * Generates next reference number
 * @param currentReference - Current reference number
 * @returns Next reference as string
 */
export function getNextReference(currentReference: string): string {
  const current = parseInt(currentReference, 10);
  return (current + 1).toString();
}

/**
 * Calls ECR terminal endpoint with timeout
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param timeout - Request timeout in ms
 * @returns Response data
 */
export async function callECRTerminal<T>(
  endpoint: string,
  body: Record<string, unknown>,
  timeout: number = 30000
): Promise<T> {
  const { terminalUrl } = validateECRCredentials();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${terminalUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ECR Terminal Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('ECR Terminal request timeout');
      }
      throw error;
    }

    throw new Error('Unknown ECR Terminal error');
  }
}

/**
 * Test ECR terminal connectivity
 * @returns True if terminal is reachable
 */
export async function testECRConnection(): Promise<boolean> {
  try {
    const { terminalUrl } = validateECRCredentials();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(terminalUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response.ok || response.status === 404; // 404 is OK, means terminal is responding
  } catch {
    return false;
  }
}
