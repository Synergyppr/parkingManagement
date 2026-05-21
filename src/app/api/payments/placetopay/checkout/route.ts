/**
 * PlaceToPay Checkout Session API Route
 * POST /api/payments/placetopay/checkout
 *
 * Creates a payment checkout session with PlaceToPay
 * Returns processUrl for user to complete payment and requestId for verification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validatePlaceToPayCredentials,
  generatePlaceToPayAuth,
  getClientIpAddress,
  getClientUserAgent,
} from '@/app/helpers/placetopay-auth';
import { generatePaymentAmount } from '@/app/helpers/tax-calculator';
import {
  PaymentIntentData,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  PlaceToPayError,
} from '@/app/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PaymentIntentData = await request.json();

    // Validate required fields
    if (
      !body.ticketId ||
      !body.patronName ||
      !body.patronSurname ||
      !body.patronEmail ||
      !body.amount ||
      !body.transactionTypeId ||
      !body.transactionDescription ||
      !body.propertyReference
    ) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing required payment information',
        },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Payment amount must be greater than zero',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.patronEmail)) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_EMAIL',
          message: 'Invalid email address format',
        },
        { status: 400 }
      );
    }

    // Validate environment credentials
    const { login, secretKey, middlewareUrl } = validatePlaceToPayCredentials();

    console.log('PlaceToPay credentials loaded:', { login, middlewareUrl });

    // Test middleware connectivity
    try {
      const testRes = await fetch(`${middlewareUrl}/api/placetopay/auth/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, secretKey }),
      });

      if (!testRes.ok) {
        console.error('Middleware connectivity test failed:', {
          status: testRes.status,
          statusText: testRes.statusText,
        });
        throw new Error(`Middleware not accessible: ${testRes.status}`);
      }

      const testData = await testRes.json();
      console.log('Middleware connectivity test response:', testData);
      console.log('Middleware auth test successful:', testData.success);
    } catch (error) {
      console.error('Middleware connection error:', error);
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'MIDDLEWARE_UNAVAILABLE',
          message: `Payment middleware is not accessible. Please ensure it's running at ${middlewareUrl}`,
        },
        { status: 503 }
      );
    }

    // Generate fresh authentication
    const auth = generatePlaceToPayAuth(login, secretKey);

    console.log('Generated auth:', {
      login: auth.login,
      nonce: auth.nonce,
      seed: auth.seed,
      tranKey: auth.tranKey.substring(0, 20) + '...',
    });

    // Calculate taxes and generate payment amount
    // Tax kinds per PlaceToPay spec: stateTax, municipalTax, reducedStateTax, etc.
    const paymentAmount = generatePaymentAmount(body.amount);

    console.log('Payment amount with taxes:', paymentAmount);

    // Validate payment amount has required fields
    if (!paymentAmount.currency || !paymentAmount.total || paymentAmount.total <= 0) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_AMOUNT',
          message: 'Invalid payment amount structure',
        },
        { status: 400 }
      );
    }

    // Extract client information
    let ipAddress = getClientIpAddress(request.headers);
    const userAgent = getClientUserAgent(request.headers);

    // Convert IPv6 localhost to IPv4 for PlaceToPay compatibility
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1';
    }

    // Generate unique reference (MAX 32 characters per PlaceToPay spec)
    // Format: TKT{shortId}-{timestamp} — strip hyphens and take first 12 chars of UUID
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const shortId = body.ticketId.replace(/-/g, '').substring(0, 12);
    const reference = `TKT${shortId}-${timestamp}`; // 3 + 12 + 1 + 8 = 24 chars

    // Validate reference length (PlaceToPay max: 32 alphanumeric chars)
    if (reference.length > 32) {
      console.error('Reference too long:', reference.length, 'chars');
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_REFERENCE',
          message: `Reference exceeds 32 character limit (${reference.length} chars)`,
        },
        { status: 400 }
      );
    }

    // Build checkout session request following PlaceToPay specification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    const checkoutRequest: CheckoutSessionRequest = {
      auth, // Authentication object with login, tranKey, nonce, seed
      locale: 'en_US',
      payer: {
        name: body.patronName,
        surname: body.patronSurname,
        email: body.patronEmail,
        mobile: body.patronPhone,
      },
      payment: {
        reference, // Unique transaction reference
        description: body.transactionDescription,
        amount: paymentAmount, // Contains currency, total, and taxes array
        allowPartial: false,
        subscribe: false,
      },
      returnUrl: `${baseUrl}/payment/return`,
      cancelUrl: `${baseUrl}/payment/cancel`,
      ipAddress, // Client IP address
      userAgent, // Client user agent string
    };

    console.log('Complete checkout request structure:', JSON.stringify(checkoutRequest, null, 2));

    // Log the complete request being sent
    console.log('Sending checkout request to middleware:', {
      url: `${middlewareUrl}/api/placetopay/checkout/create-session`,
      auth: {
        login: checkoutRequest.auth.login,
        nonce: checkoutRequest.auth.nonce.substring(0, 20) + '...',
        seed: checkoutRequest.auth.seed,
      },
      payer: checkoutRequest.payer,
      amount: checkoutRequest.payment.amount,
    });
console.log('ultimo paso antes del POST checkoutRequest', checkoutRequest);
    // Call middleware checkout endpoint
    const response = await fetch(
      `${middlewareUrl}/api/placetopay/checkout/create-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PlaceToPay checkout session failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'CHECKOUT_SESSION_FAILED',
          message: `Failed to create payment session: ${response.statusText}`,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const data: CheckoutSessionResponse = await response.json();

    // Validate response
    if (!data.requestId || !data.processUrl) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_CHECKOUT_RESPONSE',
          message: 'Invalid checkout response from payment gateway',
        },
        { status: 500 }
      );
    }

    // Check if status is OK
    if (data.status.status !== 'OK') {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'CHECKOUT_REJECTED',
          message: data.status.message || 'Checkout request was rejected',
        },
        { status: 400 }
      );
    }

    // Return success response with requestId and processUrl
    return NextResponse.json(
      {
        success: true,
        requestId: data.requestId,
        processUrl: data.processUrl,
        reference,
        amount: paymentAmount.total,
        message: 'Checkout session created successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PlaceToPay checkout session error:', error);

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
