/**
 * PlaceToPay Auth Generation API Route
 * POST /api/payments/placetopay/auth
 *
 * Generates authentication object for PlaceToPay payment requests
 * Calls the middleware endpoint to get auth credentials
 */

import { NextResponse } from 'next/server';
import { validatePlaceToPayCredentials } from '@/app/helpers/placetopay-auth';
import { PlaceToPayAuthResponse, PlaceToPayError } from '@/app/types/payment';

export async function POST() {
  try {
    // Validate environment credentials exist
    const { login, secretKey, middlewareUrl } = validatePlaceToPayCredentials();

    // Call middleware auth generation endpoint
    const response = await fetch(`${middlewareUrl}/api/placetopay/auth/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login,
        secretKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PlaceToPay auth generation failed:', errorText);

      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'AUTH_GENERATION_FAILED',
          message: 'Failed to generate PlaceToPay authentication',
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const data: PlaceToPayAuthResponse = await response.json();
    console.log('PlaceToPay auth generation response:', data);
    if (!data.success || !data.auth) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_AUTH_RESPONSE',
          message: 'Invalid authentication response from middleware',
        },
        { status: 500 }
      );
    }

    // Return auth object to client
    return NextResponse.json<PlaceToPayAuthResponse>(data, { status: 200 });
  } catch (error) {
    console.error('PlaceToPay auth generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json<PlaceToPayError>(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
