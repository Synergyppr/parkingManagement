/**
 * PlaceToPay Auth Test Route
 * GET /api/payments/placetopay/test-auth
 *
 * Test endpoint to verify authentication generation is working correctly
 * Use this to debug auth issues without making actual payment requests
 */

import { NextResponse } from 'next/server';
import {
  validatePlaceToPayCredentials,
  generatePlaceToPayAuth,
} from '@/app/helpers/placetopay-auth';

export async function GET() {
  try {
    // Validate environment credentials
    const { login, secretKey, middlewareUrl } = validatePlaceToPayCredentials();

    console.log('=== PlaceToPay Auth Test ===');
    console.log('Login:', login);
    console.log('Middleware URL:', middlewareUrl);
    console.log('Secret Key:', secretKey.substring(0, 5) + '...' + secretKey.substring(secretKey.length - 5));

    // Generate authentication
    const auth = generatePlaceToPayAuth(login, secretKey);

    console.log('Generated Auth Object:');
    console.log('- Login:', auth.login);
    console.log('- Nonce:', auth.nonce);
    console.log('- Seed:', auth.seed);
    console.log('- TranKey:', auth.tranKey);

    // Test middleware connectivity
    try {
      console.log('\n=== Testing Middleware Connectivity ===');
      const testRes = await fetch(`${middlewareUrl}/api/placetopay/auth/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, secretKey }),
      });

      console.log('Middleware Response Status:', testRes.status, testRes.statusText);

      if (!testRes.ok) {
        const errorText = await testRes.text();
        console.error('Middleware Error:', errorText);

        return NextResponse.json(
          {
            success: false,
            message: 'Middleware is not accessible',
            status: testRes.status,
            error: errorText,
            auth: {
              login: auth.login,
              nonce: auth.nonce,
              seed: auth.seed,
              tranKey: auth.tranKey.substring(0, 20) + '...',
            },
          },
          { status: 503 }
        );
      }

      const middlewareData = await testRes.json();
      console.log('Middleware Response:', middlewareData);

      return NextResponse.json(
        {
          success: true,
          message: 'Authentication test successful',
          localAuth: {
            login: auth.login,
            nonce: auth.nonce,
            seed: auth.seed,
            tranKey: auth.tranKey.substring(0, 30) + '...',
          },
          middlewareAuth: middlewareData.auth
            ? {
                login: middlewareData.auth.login,
                nonce: middlewareData.auth.nonce,
                seed: middlewareData.auth.seed,
                tranKey: middlewareData.auth.tranKey.substring(0, 30) + '...',
              }
            : null,
          middlewareStatus: testRes.status,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Middleware Connection Error:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Cannot connect to middleware',
          error: error instanceof Error ? error.message : 'Unknown error',
          middlewareUrl,
          auth: {
            login: auth.login,
            nonce: auth.nonce,
            seed: auth.seed,
            tranKey: auth.tranKey.substring(0, 20) + '...',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth test error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
