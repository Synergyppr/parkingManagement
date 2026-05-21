/**
 * ECR Terminal Start Refund API Route
 * POST /api/payments/ecr/sales/start-refund
 *
 * Initiates a refund transaction on the ECR terminal.
 * Returns trx_id — poll /ecr/transaction/get-status until approval_code is "00" or "ZY".
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateECRCredentials } from '@/app/helpers/ecr-terminal';
import { generateECRAmounts } from '@/app/helpers/tax-calculator';
import { ECRRefundResponse, ECRError } from '@/app/types/ecr';

interface StartRefundRequestBody {
  session_id: string;
  reference: string;
  last_reference: string;
  amount: number;
  /** "yes" to force duplicate refund through (default: "no") */
  force_duplicate?: 'yes' | 'no';
  terminal_url?: string;
  terminal_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StartRefundRequestBody = await request.json();

    if (!body.session_id || !body.reference || !body.last_reference || !body.amount || body.amount <= 0) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Missing or invalid required fields: session_id, reference, last_reference, amount',
        },
        { status: 400 }
      );
    }

    const credentials = validateECRCredentials();
    const terminalUrl = body.terminal_url || credentials.terminalUrl;
    const terminalId = body.terminal_id || credentials.terminalId;

    const amounts = generateECRAmounts(body.amount);
    console.log('ECR Start Refund — amounts:', amounts);

    const requestBody: Record<string, unknown> = {
      terminal_id: terminalId,
      terminal_url: terminalUrl,
      station_number: credentials.stationNumber,
      cashier_id: credentials.cashierId,
      session_id: body.session_id,
      reference: body.reference,
      last_reference: body.last_reference,
      amounts,
      receipt_output: 'BOTH',
      receipt_email: 'yes',
      manual_entry_indicator: 'no',
    };

    if (body.force_duplicate === 'yes') {
      requestBody.force_duplicate = 'yes';
      console.log('ECR Start Refund — force_duplicate enabled');
    }

    console.log('ECR Start Refund — middleware request:', JSON.stringify(requestBody, null, 2));

    const middlewareUrl = (process.env.PLACETOPAY_MIDDLEWARE_URL || '').replace(/\/$/, '');
    const response = await fetch(`${middlewareUrl}/api/evertec/sales/start-refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ECR Start Refund failed:', errorText);
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'ECR_REFUND_FAILED',
          message: 'Failed to initiate terminal refund',
          details: { status: response.status, error: errorText },
        },
        { status: response.status }
      );
    }

    const data: ECRRefundResponse = await response.json();
    console.log('ECR Start Refund — response:', JSON.stringify(data, null, 2));

    // Detect DUPLICATED TRANSACTION
    const responseMsg = (data.response_message || '').toUpperCase();
    if (!data.trx_id && responseMsg.includes('DUPLICAT')) {
      console.warn('ECR Start Refund — DUPLICATE TRANSACTION detected');
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'DUPLICATE_TRANSACTION',
          message: data.response_message || 'Duplicated transaction detected by terminal',
          details: {
            approval_code: data.approval_code,
            response_message: data.response_message,
            reference: data.reference || body.reference,
            last_reference: data.last_reference || body.last_reference,
            session_id: data.session_id || body.session_id,
          },
        },
        { status: 409 }
      );
    }

    if (!data.trx_id) {
      return NextResponse.json<ECRError>(
        {
          success: false,
          error: 'REFUND_REJECTED',
          message: data.message || `Refund rejected: ${data.response_message || 'no transaction ID'}`,
          details: data as unknown as Record<string, unknown>,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ECRRefundResponse>(
      {
        success: true,
        trx_id: data.trx_id,
        reference: data.reference || body.reference,
        amount: amounts.total,
        approval_code: data.approval_code,
        response_message: data.response_message,
        session_id: data.session_id,
        message: data.message || 'Refund initiated — waiting for card',
        status: 'pending',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ECR Start Refund error:', error);
    return NextResponse.json<ECRError>(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
