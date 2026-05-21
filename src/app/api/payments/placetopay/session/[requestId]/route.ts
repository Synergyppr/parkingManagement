/**
 * PlaceToPay Session Status API Route
 * GET /api/payments/placetopay/session/[requestId]
 *
 * Retrieves payment session status from PlaceToPay
 * Verifies if payment was approved, rejected, or pending
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validatePlaceToPayCredentials,
  generatePlaceToPayAuth,
} from '@/app/helpers/placetopay-auth';
import {
  SessionStatusRequest,
  SessionStatusResponse,
  PlaceToPayError,
} from '@/app/types/payment';

interface RouteParams {
  params: Promise<{
    requestId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { requestId } = await context.params;

    // Validate requestId
    const requestIdNum = parseInt(requestId, 10);
    if (isNaN(requestIdNum) || requestIdNum <= 0) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_REQUEST_ID',
          message: 'Invalid request ID format',
        },
        { status: 400 }
      );
    }

    // Validate environment credentials
    const { login, secretKey, middlewareUrl } = validatePlaceToPayCredentials();

    console.log('Checking payment status for request ID:', requestId);

    // Generate fresh authentication for verification (must be within 5 minutes)
    const auth = generatePlaceToPayAuth(login, secretKey);

    console.log('Generated auth for status check:', {
      login: auth.login,
      nonce: auth.nonce.substring(0, 20) + '...',
      seed: auth.seed,
    });

    // Build session status request
    const statusRequest: SessionStatusRequest = {
      auth,
    };

    console.log('Status check request:', JSON.stringify(statusRequest, null, 2));

    // Call middleware session status endpoint
    const response = await fetch(
      `${middlewareUrl}/api/placetopay/checkout/get-session/${requestId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PlaceToPay session status check failed:', errorText);

      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'SESSION_STATUS_FAILED',
          message: 'Failed to retrieve payment session status',
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const data: SessionStatusResponse = await response.json();

    // Validate response
    if (!data.requestId || !data.status) {
      return NextResponse.json<PlaceToPayError>(
        {
          success: false,
          error: 'INVALID_STATUS_RESPONSE',
          message: 'Invalid status response from payment gateway',
        },
        { status: 500 }
      );
    }

    // Extract payment information
    const paymentStatus = data.status.status;
    const isApproved = paymentStatus === 'APPROVED';
    const isPending = paymentStatus === 'PENDING';
    const isRejected = paymentStatus === 'REJECTED' || paymentStatus === 'FAILED';

    // Extract payment details if available
    const paymentDetail = data.payment && data.payment.length > 0 ? data.payment[0] : null;

    // Build response
    const statusResponse = {
      success: true,
      requestId: data.requestId,
      status: paymentStatus,
      isApproved,
      isPending,
      isRejected,
      message: data.status.message,
      reason: data.status.reason,
      date: data.status.date,
      payment: paymentDetail
        ? {
            reference: paymentDetail.reference,
            amount: paymentDetail.amount.to.total,
            currency: paymentDetail.amount.to.currency,
            authorization: paymentDetail.authorization,
            receipt: paymentDetail.receipt,
            paymentMethod: paymentDetail.paymentMethodName,
            franchise: paymentDetail.franchise,
            issuerName: paymentDetail.issuerName,
            internalReference: paymentDetail.internalReference,
          }
        : null,
      payer: {
        name: data.request.payer.name,
        surname: data.request.payer.surname,
        email: data.request.payer.email,
        mobile: data.request.payer.mobile,
      },
    };

    return NextResponse.json(statusResponse, { status: 200 });
  } catch (error) {
    console.error('PlaceToPay session status error:', error);

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
